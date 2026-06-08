"""Stage 5 — format + package.

Turns a SkillIntermediate into a skill directory:
    <name>/
      SKILL.md          (YAML frontmatter + body)
      scripts/...       (any extracted snippets)
and zips it into a single `<name>.skill` file (a .skill is a zip of the
skill dir, per the packaging convention).
"""
from __future__ import annotations

import zipfile
from pathlib import Path

import yaml

from ..models import SkillIntermediate


def _frontmatter(skill: SkillIntermediate) -> str:
    fm = {
        "name": skill.name,
        "description": skill.description,
        "category": skill.category,
    }
    dumped = yaml.safe_dump(fm, sort_keys=False, width=10**9,
                            allow_unicode=True, default_flow_style=False)
    return "---\n" + dumped.strip() + "\n---\n"


def _body(skill: SkillIntermediate) -> str:
    L: list[str] = [f"# {skill.title}\n"]
    if skill.summary:
        L.append(skill.summary + "\n")
    L.append(f"_Source: {skill.source_url}_\n")

    if skill.prerequisites:
        L.append("## Prerequisites\n")
        L += [f"- {p}" for p in skill.prerequisites]
        L.append("")
    if skill.tools:
        L.append("## Tools & dependencies\n")
        L += [f"- {t}" for t in skill.tools]
        L.append("")

    L.append("## Procedure\n")
    for s in skill.steps:
        L.append(f"{s.n}. {s.instruction}")
        for cmd in s.commands:
            L.append(f"   ```bash\n   {cmd}\n   ```")
        if s.code:
            L.append(f"   ```\n{_indent(s.code)}\n   ```")
        if s.note:
            L.append(f"   > Note: {s.note}")
    L.append("")

    if skill.gotchas:
        L.append("## Common gotchas\n")
        L += [f"- {g}" for g in skill.gotchas]
        L.append("")
    if skill.snippets:
        L.append("## Bundled files\n")
        L += [f"- `scripts/{fn}`" for fn in skill.snippets]
        L.append("")
    if skill.known_limitations:
        L.append("## Known limitations\n")
        L += [f"- {k}" for k in skill.known_limitations]
        L.append("")
    for section in skill.extra_sections:
        title = section.get("title")
        body = section.get("body")
        if title and body:
            L.append(f"## {title}\n")
            L.append(body.strip())
            L.append("")
    return "\n".join(L)


def _indent(code: str) -> str:
    return "\n".join("   " + ln for ln in code.splitlines())


def write_skill_dir(skill: SkillIntermediate, dest: Path) -> Path:
    """Write the unpacked skill directory. Returns the directory path."""
    skill_dir = dest / skill.name
    (skill_dir / "scripts").mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(_frontmatter(skill) + "\n" + _body(skill))
    for fn, contents in skill.snippets.items():
        safe = fn.replace("/", "_").replace("..", "_")
        (skill_dir / "scripts" / safe).write_text(contents)
    return skill_dir


def package_skill(skill_dir: Path, dest: Path) -> Path:
    """Zip a skill dir into <name>.skill. Returns the archive path."""
    archive = dest / f"{skill_dir.name}.skill"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for f in skill_dir.rglob("*"):
            if f.is_file():
                z.write(f, f.relative_to(skill_dir.parent))
    return archive


def build_and_package(skill: SkillIntermediate, dest: Path) -> tuple[Path, Path]:
    d = write_skill_dir(skill, dest)
    return d, package_skill(d, dest)
