"""Engine orchestration + the bounded test-and-repair loop.

  ingest -> frames -> vision -> synthesize -> format -> [GATE: test/repair]*

Outcomes (mirroring the delivery model's two emails):
  - "verified"     : passed the gate clean -> safe to ship the .skill
  - "needs_review" : failed after max retries OR a key was missing for the
                     AI checks -> flagged with the logged failures. NEVER
                     presented as a success.
"""
from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from .config import CONFIG
from .gate import test_repair as gate
from .models import SkillIntermediate
from .providers.llm import LLM, LLMUnavailable
from .stages.format_skill import build_and_package
from .stages.frames import sample_frames
from .stages.ingest import ingest
from .stages.synthesize import synthesize
from .stages.vision import describe_frames


@dataclass
class PipelineResult:
    status: str                       # "verified" | "needs_review"
    skill_path: Path | None = None    # the .skill archive, if produced
    skill_dir: Path | None = None
    attempts: int = 0
    log: list[str] = field(default_factory=list)
    gate_failures: list[str] = field(default_factory=list)

    @property
    def verified(self) -> bool:
        return self.status == "verified"


def _gen_trigger_prompts(skill: SkillIntermediate, llm: LLM) -> tuple[list[str], list[str]]:
    sys = ("Generate test prompts to check whether a skill router fires "
           "correctly. Return JSON {\"relevant\":[3 short user requests this "
           "skill SHOULD handle], \"irrelevant\":[3 plausible but unrelated "
           "requests it should NOT handle]}.")
    user = f"Skill: {skill.title}\nDescription: {skill.description}"
    try:
        d = llm.complete_json(sys, user, max_tokens=512)
        return d.get("relevant", [])[:3], d.get("irrelevant", [])[:3]
    except Exception:
        return [], []


def run(url: str, dest: Path | None = None, executor=None) -> PipelineResult:
    dest = dest or Path(tempfile.mkdtemp(prefix="sb_out_"))
    dest.mkdir(parents=True, exist_ok=True)
    res = PipelineResult(status="needs_review")

    # ---- stages 1-2 (no key) ----
    res.log.append("ingest: fetching transcript")
    transcript = ingest(url)
    res.log.append(f"ingest: {len(transcript.segments)} segments via {transcript.source}")

    # ---- AI availability gate ----
    try:
        llm: LLM | None = LLM()
    except LLMUnavailable as e:
        res.log.append(f"AI stages skipped: {e}")
        res.gate_failures.append(
            "No API key: vision, synthesis, trigger and end-to-end tests could "
            "not run. Cannot produce a verified skill. (Connect a key.)")
        return res

    res.log.append("frames: sampling")
    frames = sample_frames(url)
    res.log.append(f"frames: {len(frames)} sampled (cap {CONFIG.max_frames})")

    res.log.append("vision: describing frames")
    notes = describe_frames(frames, llm)
    res.log.append(f"vision: {len(notes)} frames had technical content")

    # ---- synthesize + bounded repair loop ----
    feedback: str | None = None
    relevant: list[str] = []
    irrelevant: list[str] = []

    for attempt in range(1, CONFIG.gate_max_retries + 1):
        res.attempts = attempt
        res.log.append(f"attempt {attempt}: synthesize"
                       + (" (repair)" if feedback else ""))
        skill = synthesize(transcript, notes, llm, repair_feedback=feedback)

        if not relevant:
            relevant, irrelevant = _gen_trigger_prompts(skill, llm)
        task = f"{skill.title}. {skill.summary}".strip()

        skill_dir, archive = build_and_package(skill, dest)
        report = gate.evaluate(skill_dir, task=task, relevant=relevant,
                               irrelevant=irrelevant, llm=llm, executor=executor)

        if report.passed:
            res.status = "verified"
            res.skill_dir, res.skill_path = skill_dir, archive
            res.log.append(f"attempt {attempt}: GATE PASSED")
            return res

        feedback = report.feedback()
        res.log.append(f"attempt {attempt}: gate failed -> {feedback}")

    # exhausted retries -> NOT a pass
    res.status = "needs_review"
    res.skill_dir = skill_dir
    res.gate_failures = [c.detail for c in report.failures]
    res.log.append("retries exhausted: flagged for human review (NOT shipped)")
    return res
