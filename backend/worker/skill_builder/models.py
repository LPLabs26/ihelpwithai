"""Structured intermediate. Stages 1-4 fill this; the formatter and the
repair loop edit *this*, not raw markdown — regenerating from structure is
far more reliable than patching text."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class Step:
    n: int
    instruction: str
    commands: list[str] = field(default_factory=list)   # exact commands to run
    code: str | None = None                              # code block, if any
    note: str | None = None                              # gotcha tied to this step
    frame_evidence: list[int] = field(default_factory=list)  # frame indices backing it


@dataclass
class SkillIntermediate:
    source_url: str
    title: str
    name: str                       # kebab-case skill name
    description: str                # the trigger description (gate-critical)
    category: str = "Skill"
    summary: str = ""
    prerequisites: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)       # libraries / CLIs needed
    steps: list[Step] = field(default_factory=list)
    gotchas: list[str] = field(default_factory=list)
    snippets: dict[str, str] = field(default_factory=dict)  # filename -> contents
    known_limitations: list[str] = field(default_factory=list)
    extra_sections: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SkillIntermediate":
        steps = [Step(**s) for s in d.get("steps", [])]
        d = {**d, "steps": steps}
        return cls(**d)
