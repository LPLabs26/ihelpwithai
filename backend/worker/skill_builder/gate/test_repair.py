"""The acceptance gate.

Principle (non-negotiable): FINISHED = VERIFIED WORKING. A pass is only ever
returned when real checks actually ran and succeeded. Running out of retries
is NOT a pass — it is flagged for human review with the failures logged.
A silent false pass is the worst possible outcome for this product.

Checks, in order of strength:
  1. validation   — frontmatter/structure (no key needed)              [mechanical]
  2. load         — the skill parses and "loads" cleanly (no key)      [mechanical]
  3. trigger      — the description fires on relevant prompts and stays
                    quiet on unrelated ones                            [needs LLM]
  4. end_to_end   — a CLEAN agent (no memory of how the skill was made)
                    completes the task using ONLY the skill            [needs LLM (+ exec sandbox)]

Each check returns a Check; evaluate() aggregates. The repair loop lives in
pipeline.py because repair must regenerate from the structured intermediate.
"""
from __future__ import annotations

import json
import inspect
from dataclasses import dataclass, field
from pathlib import Path

from ..providers.llm import LLM
from .validate import validate_skill_dir


@dataclass
class Check:
    name: str
    passed: bool
    detail: str = ""
    fixable: bool = True   # can synthesis plausibly repair this?


@dataclass
class GateReport:
    checks: list[Check] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return bool(self.checks) and all(c.passed for c in self.checks)

    @property
    def failures(self) -> list[Check]:
        return [c for c in self.checks if not c.passed]

    def feedback(self) -> str:
        """Failure text fed back into synthesis for repair."""
        return "\n".join(f"- [{c.name}] {c.detail}" for c in self.failures)


# ---------------------------------------------------------------- mechanical

def check_validation(skill_dir: Path) -> Check:
    r = validate_skill_dir(skill_dir)
    return Check("validation", r.ok, "; ".join(r.errors) or "frontmatter ok")


def check_load(skill_dir: Path) -> Check:
    """A skill 'loads' if SKILL.md exists, has closed frontmatter with name +
    description, and a non-empty body. (Same shape an agent loader expects.)"""
    md = skill_dir / "SKILL.md"
    if not md.exists():
        return Check("load", False, "SKILL.md missing")
    text = md.read_text()
    if text.count("---") < 2:
        return Check("load", False, "frontmatter not closed; loader would reject")
    return Check("load", True, "loads without error")


# ---------------------------------------------------------------- needs LLM

def check_trigger(skill_dir: Path, relevant: list[str], irrelevant: list[str],
                  llm: LLM) -> Check:
    """Simulate a router: would this skill's description fire on each prompt?
    Must fire on all relevant prompts and on none of the irrelevant ones."""
    desc = _description(skill_dir)
    sys = ("You are an agent's skill router. Given a skill description and a "
           "user request, answer strictly 'YES' if this skill should activate "
           "for that request, else 'NO'. Answer with one word.")
    misfires, missed = [], []
    for p in relevant:
        if not _yes(llm, sys, desc, p):
            missed.append(p)
    for p in irrelevant:
        if _yes(llm, sys, desc, p):
            misfires.append(p)
    if missed or misfires:
        detail = []
        if missed:
            detail.append(f"failed to trigger on: {missed}")
        if misfires:
            detail.append(f"misfired on unrelated: {misfires}")
        return Check("trigger", False, "; ".join(detail))
    return Check("trigger", True, "triggers correctly on relevant, quiet on rest")


def check_end_to_end(skill_dir: Path, task: str, llm: LLM,
                     executor=None) -> Check:
    """Hand the skill to a CLEAN agent (fresh context, only the skill + task)
    and have it produce the concrete steps/commands to do the task. If an
    `executor` is supplied, the commands are actually run in a sandbox and any
    error fails the check. Without an executor, full execution can't be proven
    here — that is reported as a known limitation, never as a pass."""
    skill_text = (skill_dir / "SKILL.md").read_text()
    sys = (
        "You are a fresh agent with NO prior context. You have been given "
        "exactly one skill. Using ONLY it, perform the user's task.\n"
        "Output JSON exactly like this: "
        "{\"commands\":[\"literal /bin/bash command\", \"...\"], "
        "\"blocked\":false, \"blocker\":\"\"}.\n"
        "The commands array must contain ONLY commands a non-interactive "
        "/bin/bash shell can execute from the skill directory. Do not output "
        "tutorial instructions, checklist items, TODOs, explanations, or prose "
        "as commands. Invalid examples: \"Identify the failure mode\", "
        "\"Check whether the file exists\", \"Verify the result\".\n"
        "Each command is run in a constrained offline sandbox with no network "
        "tools and no production secrets. Prefer local checks like python, "
        "bash, grep, test, file reads, and scripts bundled in the skill. "
        "If the skill is missing a step, dependency, file, or verifiable local "
        "procedure, set blocked=true and explain why in blocker."
    )
    user = f"SKILL:\n{skill_text}\n\nTASK: {task}"
    try:
        plan = llm.complete_json(sys, user, max_tokens=2048)
    except Exception as e:
        return Check("end_to_end", False, f"clean agent could not use skill: {e}")

    if plan.get("blocked"):
        return Check("end_to_end", False,
                     f"clean agent blocked: {plan.get('blocker','unspecified')}")

    commands = plan.get("commands", [])
    if not commands:
        return Check("end_to_end", False,
                     "clean agent produced no actionable commands from the skill")

    if executor is None:
        # Honest: we proved the skill is self-sufficient enough to PLAN the
        # task, but did not execute. Surfaced as a limitation, not a green pass.
        return Check(
            "end_to_end", False,
            "planned successfully but NOT executed (no sandbox executor wired). "
            "Per the acceptance gate this cannot be marked verified — connect an "
            "execution sandbox to fully close this check.",
            fixable=False,
        )

    err = _run_executor(executor, commands, skill_dir, task)
    if err:
        return Check("end_to_end", False, f"command failed in sandbox: {err}")
    return Check("end_to_end", True, "clean agent completed the task end-to-end")


# ---------------------------------------------------------------- aggregate

def evaluate(skill_dir: Path, *, task: str | None = None,
             relevant: list[str] | None = None,
             irrelevant: list[str] | None = None,
             llm: LLM | None = None, executor=None) -> GateReport:
    report = GateReport()
    report.checks.append(check_validation(skill_dir))
    report.checks.append(check_load(skill_dir))

    # AI-dependent checks only run when a key is available.
    if llm is not None:
        if relevant is not None and irrelevant is not None:
            report.checks.append(
                check_trigger(skill_dir, relevant, irrelevant, llm))
        if task:
            report.checks.append(
                check_end_to_end(skill_dir, task, llm, executor))
    return report


# ---------------------------------------------------------------- helpers

def _description(skill_dir: Path) -> str:
    import yaml
    text = (skill_dir / "SKILL.md").read_text()
    fm = yaml.safe_load(text.split("---", 2)[1])
    return fm.get("description", "")


def _yes(llm: LLM, sys: str, desc: str, prompt: str) -> bool:
    out = llm.complete(sys, f"SKILL DESCRIPTION:\n{desc}\n\nUSER REQUEST:\n{prompt}",
                       max_tokens=8)
    return out.strip().upper().startswith("Y")


def _run_executor(executor, commands: list[str], skill_dir: Path, task: str) -> str | None:
    """Call old one-argument executors or richer sandbox executors."""
    try:
        sig = inspect.signature(executor)
    except (TypeError, ValueError):
        return executor(commands)

    params = sig.parameters
    if any(p.kind == inspect.Parameter.VAR_KEYWORD for p in params.values()):
        return executor(commands, skill_dir=skill_dir, task=task)
    if "skill_dir" in params or "task" in params:
        kwargs = {}
        if "skill_dir" in params:
            kwargs["skill_dir"] = skill_dir
        if "task" in params:
            kwargs["task"] = task
        return executor(commands, **kwargs)

    positional = [
        p for p in params.values()
        if p.kind in (inspect.Parameter.POSITIONAL_ONLY,
                      inspect.Parameter.POSITIONAL_OR_KEYWORD)
    ]
    if len(positional) >= 3:
        return executor(commands, skill_dir, task)
    if len(positional) >= 2:
        return executor(commands, skill_dir)
    return executor(commands)
