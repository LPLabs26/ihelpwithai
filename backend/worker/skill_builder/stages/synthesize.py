"""Stage 4 — synthesis: fuse transcript + frame notes into a structured
SkillIntermediate. This is where procedure is separated from fluff.

The same function is reused by the repair loop: pass `repair_feedback` with
the gate's failures and it regenerates a corrected intermediate.
"""
from __future__ import annotations

import json

from ..models import SkillIntermediate, Step
from ..providers.llm import LLM
from .ingest import Transcript
from .vision import FrameNote

_SYSTEM = """You convert tutorial content into a precise, executable agent \
skill. You extract the ACTUAL procedure a practitioner must follow — not a \
summary. Drop intros, sponsor reads, subscribe asks, and tangents. Every step \
must be concrete and runnable. State every prerequisite and dependency \
explicitly, even if the tutorial only implied it. Prefer exact commands and \
verbatim code/config over prose. The `commands` array is for executable shell \
commands only: never put prose, analysis tasks, conceptual instructions, UI \
click directions, or natural-language diagnostics inside `commands`. Put those \
in `instruction` or `note` instead. If something cannot be verified or was \
assumed off-screen, record it under known_limitations rather than guessing."""

_SCHEMA_HINT = """Return JSON with exactly these keys:
{
  "name": "kebab-case-skill-name (<=64 chars, [a-z0-9-])",
  "description": "one or two sentences starting with what it does and WHEN to \
use it, written so an agent reliably triggers it on relevant requests and not \
on unrelated ones. Include concrete trigger nouns/verbs.",
  "title": "human title",
  "summary": "2-3 sentence overview",
  "prerequisites": ["..."],
  "tools": ["libraries / CLIs / accounts needed"],
  "steps": [{"n":1,"instruction":"...","commands":["only executable shell commands, or []"],"code":"... or null",
             "note":"gotcha or null","frame_evidence":[frame indices]}],
  "gotchas": ["common failure modes / pitfalls the tutorial flags"],
  "snippets": {"filename.ext":"full file contents the tutorial provides"},
  "known_limitations": ["anything unverifiable or environment-specific"]
}"""


def _build_prompt(t: Transcript, notes: list[FrameNote],
                  repair_feedback: str | None) -> str:
    frame_block = "\n".join(
        f"[frame {n.index} @ {n.timestamp:.0f}s] {n.description}" for n in notes
    ) or "(no usable frame notes)"
    parts = [
        f"VIDEO TITLE: {t.title}",
        f"SOURCE: https://youtu.be/{t.video_id}",
        _SCHEMA_HINT,
        "\n--- TRANSCRIPT ---\n" + t.full_text,
        "\n--- FRAME NOTES (visual context) ---\n" + frame_block,
    ]
    if repair_feedback:
        parts.append(
            "\n--- REPAIR FEEDBACK (the previous skill FAILED the acceptance "
            "gate; fix exactly these problems) ---\n" + repair_feedback
        )
    return "\n".join(parts)


def synthesize(t: Transcript, notes: list[FrameNote],
               llm: LLM | None = None,
               repair_feedback: str | None = None) -> SkillIntermediate:
    llm = llm or LLM()
    data = llm.complete_json(_SYSTEM, _build_prompt(t, notes, repair_feedback),
                             max_tokens=8192)
    steps = [Step(**{**s, "code": s.get("code"), "note": s.get("note")})
             for s in data.get("steps", [])]
    return SkillIntermediate(
        source_url=f"https://youtu.be/{t.video_id}",
        title=data.get("title", t.title),
        name=data["name"],
        description=data["description"],
        category=data.get("category", "Skill"),
        summary=data.get("summary", ""),
        prerequisites=data.get("prerequisites", []),
        tools=data.get("tools", []),
        steps=steps,
        gotchas=data.get("gotchas", []),
        snippets=data.get("snippets", {}),
        known_limitations=data.get("known_limitations", []),
    )
