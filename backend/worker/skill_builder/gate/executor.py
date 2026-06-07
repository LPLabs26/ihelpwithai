"""Constrained command runner for the end-to-end gate.

This is intentionally small and conservative. The gate only needs to prove that
commands produced by a clean agent can run from the generated skill directory;
it does not need access to production secrets, the host filesystem, or network
tools.
"""
from __future__ import annotations

import os
import pwd
import re
import shlex
import shutil
import signal
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path


_BLOCKED_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = tuple(
    (re.compile(pattern, re.IGNORECASE), reason)
    for pattern, reason in [
        (
            r"(^|[;&|]\s*)(sudo|su|ssh|scp|sftp|ftp|telnet|nc|netcat|curl|wget)\b",
            "network/login tools are not allowed in the verification sandbox",
        ),
        (
            r"(^|[;&|]\s*)(docker|podman|kubectl|gh|supabase)\b",
            "external control CLIs are not allowed in the verification sandbox",
        ),
        (
            r"(^|[;&|]\s*)(mount|umount|mkfs|dd)\b",
            "device and filesystem administration commands are not allowed",
        ),
        (
            r"(^|[;&|]\s*)rm\s+(-[^\s]*[rf][^\s]*|-[^\s]*[fr][^\s]*)\s+/(?:\s|$)",
            "recursive deletion of system paths is not allowed",
        ),
        (
            r"(^|[;&|]\s*)(chmod|chown)\b[^\n;&|]*\s/(?:\s|$)",
            "permission changes on system paths are not allowed",
        ),
        (
            r">\s*/(?:etc|proc|sys|dev|root|usr|bin|sbin|var)\b",
            "writing to system paths is not allowed",
        ),
    ]
)

_SHELL_WORDS = {
    ".",
    ":",
    "[",
    "alias",
    "bash",
    "break",
    "case",
    "cd",
    "command",
    "continue",
    "declare",
    "do",
    "done",
    "echo",
    "elif",
    "else",
    "env",
    "eval",
    "exec",
    "exit",
    "export",
    "false",
    "fi",
    "for",
    "function",
    "if",
    "local",
    "printf",
    "pwd",
    "read",
    "return",
    "set",
    "shift",
    "shopt",
    "source",
    "test",
    "then",
    "time",
    "trap",
    "true",
    "type",
    "ulimit",
    "umask",
    "unalias",
    "unset",
    "until",
    "while",
}


@dataclass(frozen=True)
class SandboxExecutor:
    timeout_seconds: int = 45
    max_commands: int = 16
    max_command_chars: int = 2000
    output_tail_chars: int = 4000
    memory_bytes: int = 1024 * 1024 * 1024
    file_bytes: int = 50 * 1024 * 1024
    drop_user: str = "nobody"

    @classmethod
    def from_env(cls) -> "SandboxExecutor":
        return cls(
            timeout_seconds=_env_int("SKILLBUILDER_SANDBOX_TIMEOUT_SECONDS", 45),
            max_commands=_env_int("SKILLBUILDER_SANDBOX_MAX_COMMANDS", 16),
            max_command_chars=_env_int("SKILLBUILDER_SANDBOX_MAX_COMMAND_CHARS", 2000),
        )

    def __call__(
        self,
        commands: list[str],
        *,
        skill_dir: Path | None = None,
        task: str | None = None,
    ) -> str | None:
        err = self._validate_commands(commands)
        if err:
            return err

        with tempfile.TemporaryDirectory(prefix="skillforge_sandbox_") as tmp:
            root = Path(tmp)
            home = root / "home"
            scratch = root / "tmp"
            home.mkdir()
            scratch.mkdir()

            if skill_dir is not None:
                workdir = root / "skill"
                shutil.copytree(skill_dir, workdir)
            else:
                workdir = root / "work"
                workdir.mkdir()

            if task:
                (root / "TASK.txt").write_text(task)

            uid_gid = _lookup_uid_gid(self.drop_user)
            if uid_gid is not None and os.geteuid() == 0:
                _chown_tree(root, *uid_gid)

            env = {
                "HOME": str(home),
                "TMPDIR": str(scratch),
                "PATH": "/usr/local/bin:/usr/bin:/bin",
                "PYTHONDONTWRITEBYTECODE": "1",
                "NO_COLOR": "1",
            }

            for idx, command in enumerate(commands, start=1):
                blocked = _blocked_reason(command)
                if blocked:
                    return f"command {idx} rejected: {blocked}: {command[:200]}"

                shape_err = _command_shape_error(command, env["PATH"])
                if shape_err:
                    return f"command {idx} rejected: {shape_err}: {command[:200]}"

                run_err = self._run_one(idx, command, workdir, env, uid_gid)
                if run_err:
                    return run_err

        return None

    def _validate_commands(self, commands: list[str]) -> str | None:
        if not isinstance(commands, list):
            return "executor expected a JSON list of shell commands"
        if not commands:
            return "executor received no commands"
        if len(commands) > self.max_commands:
            return f"executor received {len(commands)} commands; max is {self.max_commands}"
        for idx, command in enumerate(commands, start=1):
            if not isinstance(command, str) or not command.strip():
                return f"command {idx} is not a non-empty string"
            if len(command) > self.max_command_chars:
                return (
                    f"command {idx} is {len(command)} chars; "
                    f"max is {self.max_command_chars}"
                )
        return None

    def _run_one(
        self,
        idx: int,
        command: str,
        cwd: Path,
        env: dict[str, str],
        uid_gid: tuple[int, int] | None,
    ) -> str | None:
        stdout_path = cwd.parent / f"command_{idx}.stdout"
        stderr_path = cwd.parent / f"command_{idx}.stderr"
        with stdout_path.open("wb") as stdout, stderr_path.open("wb") as stderr:
            proc = subprocess.Popen(
                ["/bin/bash", "-c", command],
                cwd=cwd,
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=stdout,
                stderr=stderr,
                start_new_session=True,
                preexec_fn=self._preexec(uid_gid),
            )
            try:
                returncode = proc.wait(timeout=self.timeout_seconds)
            except subprocess.TimeoutExpired:
                _kill_process_group(proc.pid)
                return (
                    f"command {idx} timed out after {self.timeout_seconds}s: "
                    f"{command[:200]}"
                )

        if returncode != 0:
            out = _tail(stdout_path, self.output_tail_chars)
            err = _tail(stderr_path, self.output_tail_chars)
            return (
                f"command {idx} exited {returncode}: {command[:200]}\n"
                f"stdout:\n{out}\n"
                f"stderr:\n{err}"
            ).strip()
        return None

    def _preexec(self, uid_gid: tuple[int, int] | None):
        def apply_limits() -> None:
            try:
                import resource

                cpu = max(1, self.timeout_seconds + 2)
                resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu))
                resource.setrlimit(resource.RLIMIT_AS, (self.memory_bytes, self.memory_bytes))
                resource.setrlimit(resource.RLIMIT_FSIZE, (self.file_bytes, self.file_bytes))
                resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
            except Exception:
                # Resource limits are a hardening layer. The subprocess timeout
                # still enforces the core gate behavior if a platform omits one.
                pass

            if uid_gid is not None and os.geteuid() == 0:
                uid, gid = uid_gid
                os.setgid(gid)
                os.setuid(uid)

        return apply_limits


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _lookup_uid_gid(user: str) -> tuple[int, int] | None:
    try:
        p = pwd.getpwnam(user)
    except KeyError:
        return None
    return p.pw_uid, p.pw_gid


def _chown_tree(root: Path, uid: int, gid: int) -> None:
    os.chown(root, uid, gid)
    for path_root, dirs, files in os.walk(root):
        for name in dirs:
            os.chown(Path(path_root) / name, uid, gid)
        for name in files:
            os.chown(Path(path_root) / name, uid, gid)


def _blocked_reason(command: str) -> str | None:
    for pattern, reason in _BLOCKED_PATTERNS:
        if pattern.search(command):
            return reason
    return None


def _command_shape_error(command: str, search_path: str) -> str | None:
    """Reject obvious prose before bash turns it into a confusing 127."""
    head = _command_head(command)
    if not head:
        return "not a valid executable shell command"
    if head in _SHELL_WORDS:
        return None
    if "/" in head:
        return None
    if shutil.which(head, path=search_path):
        return None
    return (
        f"first word {head!r} is not an executable or shell keyword; "
        "the verifier must output literal shell commands, not prose"
    )


def _command_head(command: str) -> str | None:
    text = command.strip()
    while text.startswith("("):
        text = text[1:].lstrip()
    try:
        parts = shlex.split(text, posix=True)
    except ValueError:
        return None
    for part in parts:
        if not part or part in {"(", ")", "{", "}"}:
            continue
        if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*=.*", part):
            continue
        return part
    return None


def _kill_process_group(pid: int) -> None:
    try:
        os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def _tail(path: Path, chars: int) -> str:
    try:
        text = path.read_text(errors="replace")
    except OSError as e:
        return f"<could not read output: {e}>"
    if len(text) <= chars:
        return text
    return text[-chars:]
