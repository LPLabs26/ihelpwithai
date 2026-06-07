"""Frontmatter / structural validation. Runs WITHOUT an API key.

Linting passing is NECESSARY, NOT SUFFICIENT — the gate (test_repair.py) must
still load-, trigger-, and end-to-end-test the skill. This module only catches
the mechanical failures.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
NAME_MAX = 64
DESC_MAX = 1024


@dataclass
class ValidationResult:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.ok


def _split_frontmatter(text: str) -> tuple[dict | None, str, list[str]]:
    errors: list[str] = []
    if not text.startswith("---"):
        return None, text, ["SKILL.md does not begin with YAML frontmatter (---)."]
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, text, ["Frontmatter is not closed with a second '---'."]
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        return None, text, [f"Frontmatter is not valid YAML: {e}"]
    if not isinstance(fm, dict):
        return None, text, ["Frontmatter did not parse to a mapping."]
    return fm, parts[2], errors


def validate_skill_md(text: str) -> ValidationResult:
    fm, body, errs = _split_frontmatter(text)
    errors = list(errs)
    warnings: list[str] = []

    if fm is not None:
        name = fm.get("name")
        if not name:
            errors.append("Frontmatter missing required field: name.")
        elif not isinstance(name, str) or not NAME_RE.match(name):
            errors.append(f"name '{name}' must be kebab-case [a-z0-9-].")
        elif len(name) > NAME_MAX:
            errors.append(f"name exceeds {NAME_MAX} chars.")

        desc = fm.get("description")
        if not desc:
            errors.append("Frontmatter missing required field: description.")
        elif not isinstance(desc, str):
            errors.append("description must be a string.")
        else:
            if len(desc) > DESC_MAX:
                errors.append(f"description exceeds {DESC_MAX} chars.")
            if len(desc) < 20:
                warnings.append("description is very short; may trigger unreliably.")
            if "when" not in desc.lower() and "use" not in desc.lower():
                warnings.append(
                    "description does not say WHEN to use the skill; triggering "
                    "may be unreliable."
                )

        allowed = {"name", "description", "license", "allowed-tools", "metadata"}
        for k in fm:
            if k not in allowed:
                warnings.append(f"Unexpected frontmatter field: {k}.")

    if not body.strip():
        errors.append("SKILL.md has no body content.")
    if "## Procedure" not in text and "## procedure" not in text.lower():
        warnings.append("No Procedure section found.")

    return ValidationResult(ok=not errors, errors=errors, warnings=warnings)


def validate_skill_dir(skill_dir: Path) -> ValidationResult:
    md = skill_dir / "SKILL.md"
    if not md.exists():
        return ValidationResult(False, ["SKILL.md not found in skill directory."])
    res = validate_skill_md(md.read_text())

    # every referenced bundled file must actually exist (gate requirement)
    body = md.read_text()
    for ref in re.findall(r"`scripts/([^`]+)`", body):
        if not (skill_dir / "scripts" / ref).exists():
            res.errors.append(f"Referenced file scripts/{ref} is missing.")
    res = ValidationResult(ok=not res.errors, errors=res.errors,
                           warnings=res.warnings)
    return res
