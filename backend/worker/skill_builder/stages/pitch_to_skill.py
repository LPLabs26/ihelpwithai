"""Pitch-to-Skill synthesis.

This mode decodes a public sales pitch into a generic starter agent skill. It
must not recreate paid, private, proprietary, or paywalled material.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any

from ..models import SkillIntermediate, Step
from ..providers.llm import LLM
from .ingest import Transcript
from .vision import FrameNote


RESULT_TYPE = "pitch_to_skill"
DISCLAIMER = (
    "This prototype is based only on public information from the video and "
    "general workflow knowledge. It does not reproduce paid content, private "
    "templates, proprietary systems, or restricted material."
)
OFFER_TYPES = {
    "course",
    "coaching",
    "template",
    "software",
    "community",
    "agency_service",
    "prompt_pack",
    "automation_workflow",
    "downloadable_resource",
    "consulting_offer",
    "unknown",
}
PROHIBITED_PHRASES = [
    "replace the course",
    "get the paid system for free",
    "bypass the product",
    "unlock the private method",
]


@dataclass
class PitchToSkillOutput:
    skill: SkillIntermediate
    metadata: dict[str, Any]
    gate_failures: list[str] = field(default_factory=list)


_SYSTEM = f"""You create Pitch-to-Skill results from public YouTube videos.

Goal: detect whether the video sells or promotes a course, template, software
product, coaching offer, prompt pack, community, agency service, or workflow,
then produce a generic starter agent skill that helps a user prototype the
public concept before deciding whether to buy.

Hard rules:
- Use only the public transcript, title, visible public frame notes, and general
  workflow knowledge.
- Do not reproduce paid, private, proprietary, or paywalled material.
- Do not infer private modules, exact paid templates, private scripts, private
  prompts, proprietary worksheets, or hidden frameworks.
- If the video says details are inside the paid product, say those details are
  not publicly available.
- Preserve attribution to the original video.
- Clearly label assumptions and confidence.
- Position the skill as a lightweight prototype, not a replacement.
- The Starter Skill Prototype must be generic. If the public pitch uses branded,
  named, or quoted framework labels, translate them into plain descriptive labels
  in the workflow steps. Mention branded labels only in Source Notes or Offer
  Decoder when directly supported by public transcript context.
- Never use these phrases: {", ".join(PROHIBITED_PHRASES)}.
- Include this exact disclaimer in guardrail_notes: {DISCLAIMER!r}
"""

_SCHEMA = """Return JSON with exactly this shape:
{
  "offer_detected": true,
  "detected_offer_name": "",
  "offer_type": "course|coaching|template|software|community|agency_service|prompt_pack|automation_workflow|downloadable_resource|consulting_offer|unknown",
  "target_customer": "",
  "problem_solved": "",
  "promised_outcome": "",
  "public_components": ["publicly mentioned steps, tactics, tools, examples, or concepts"],
  "missing_or_proprietary_components": ["paid, private, missing, unavailable, or not disclosed details"],
  "can_prototype": true,
  "low_detail": false,
  "generated_skill_name": "kebab-case-name",
  "confidence_level": "high|medium|low",
  "high_confidence_findings": ["directly supported by public transcript"],
  "medium_confidence_inferences": ["reasonable inference from public pitch"],
  "low_confidence_assumptions": ["assumptions, not facts"],
  "source_timestamps": [
    {"timestamp": "MM:SS", "note": "what this supports"}
  ],
  "guardrail_notes": ["must include the exact required disclaimer"],
  "starter_skill": {
    "name": "kebab-case-skill-name",
    "title": "Starter prototype title",
    "description": "one or two sentences explaining when to use this generic prototype skill",
    "when_to_use": ["..."],
    "inputs_required": ["..."],
    "steps": ["specific generic workflow steps"],
    "expected_outputs": ["..."],
    "quality_checks": ["..."],
    "safety_checks": ["..."],
    "limitations": ["..."],
    "suggested_first_test_prompt": "..."
  },
  "buy_vs_build": {
    "try_prototype_first": ["..."],
    "consider_buying_when": ["..."],
    "prototype_does_not_include": ["..."],
    "assumptions_made": ["..."],
    "original_product_may_provide": ["templates, coaching, community, support, private datasets, implementation help, or software access"]
  }
}"""


def generate_pitch_to_skill(
    transcript: Transcript,
    notes: list[FrameNote],
    llm: LLM | None = None,
) -> PitchToSkillOutput:
    llm = llm or LLM()
    data = llm.complete_json(_SYSTEM, _build_prompt(transcript, notes), max_tokens=8192)
    data = _normalize(data, transcript)
    skill = _skill_from_data(data, transcript)
    failures = validate_pitch_output(data, _skill_text_for_guard(skill))
    return PitchToSkillOutput(skill=skill, metadata=_metadata(data, transcript), gate_failures=failures)


def validate_pitch_output(data: dict[str, Any], skill_text: str = "") -> list[str]:
    failures: list[str] = []
    combined = (json.dumps(data, ensure_ascii=False) + "\n" + skill_text).lower()
    for phrase in PROHIBITED_PHRASES:
        if phrase in combined:
            failures.append(f"Pitch-to-Skill output included prohibited phrase: {phrase}")
    guardrail_notes = "\n".join(str(x) for x in data.get("guardrail_notes") or [])
    if DISCLAIMER not in guardrail_notes and DISCLAIMER not in skill_text:
        failures.append("Pitch-to-Skill output is missing the required guardrail disclaimer.")
    return failures


def _build_prompt(t: Transcript, notes: list[FrameNote]) -> str:
    frame_block = "\n".join(
        f"[frame {n.index} @ {_stamp(n.timestamp)}] {n.description}" for n in notes
    ) or "(no usable frame notes)"
    transcript_block = "\n".join(
        f"[{_stamp(s.start)}] {s.text.strip()}" for s in t.segments if s.text.strip()
    )
    return "\n".join([
        f"VIDEO TITLE: {t.title}",
        f"SOURCE: https://youtu.be/{t.video_id}",
        _SCHEMA,
        "\n--- TIMESTAMPED TRANSCRIPT ---\n" + transcript_block,
        "\n--- FRAME NOTES (visible public context only) ---\n" + frame_block,
    ])


def _normalize(data: dict[str, Any], t: Transcript) -> dict[str, Any]:
    data = dict(data or {})
    offer_type = str(data.get("offer_type") or "unknown")
    if offer_type not in OFFER_TYPES:
        data["offer_type"] = "unknown"
    data.setdefault("detected_offer_name", "Public offer")
    data.setdefault("target_customer", "People interested in the workflow described in the video.")
    data.setdefault("problem_solved", "The video does not state a specific problem clearly.")
    data.setdefault("promised_outcome", "The promised outcome is not stated clearly.")
    data.setdefault("public_components", [])
    data.setdefault("missing_or_proprietary_components", [])
    data.setdefault("high_confidence_findings", [])
    data.setdefault("medium_confidence_inferences", [])
    data.setdefault("low_confidence_assumptions", [])
    data.setdefault("source_timestamps", [])
    data["guardrail_notes"] = _ensure_list(data.get("guardrail_notes"))
    if DISCLAIMER not in data["guardrail_notes"]:
        data["guardrail_notes"].insert(0, DISCLAIMER)
    data["generated_skill_name"] = _safe_name(
        data.get("generated_skill_name")
        or (data.get("starter_skill") or {}).get("name")
        or f"prototype-{t.video_id.lower()}"
    )
    starter = dict(data.get("starter_skill") or {})
    starter["name"] = _safe_name(starter.get("name") or data["generated_skill_name"])
    starter.setdefault("title", f"{data.get('detected_offer_name') or 'Public Offer'} Starter Prototype")
    starter.setdefault(
        "description",
        "Use this generic prototype skill to test a publicly described workflow before deciding whether to buy the original offer.",
    )
    starter.setdefault("when_to_use", ["You want to prototype the public concept described in a video pitch."])
    starter.setdefault("inputs_required", ["Your goal", "Publicly available video notes", "Any tools/accounts you already have"])
    starter.setdefault("steps", ["Clarify the desired outcome.", "Map public steps into an agent workflow.", "Run a small test case.", "Review gaps before deciding whether to buy."])
    starter.setdefault("expected_outputs", ["A lightweight workflow prototype", "A list of gaps and assumptions"])
    starter.setdefault("quality_checks", ["Verify each step is based on public information or clearly marked as an assumption."])
    starter.setdefault("safety_checks", [DISCLAIMER])
    starter.setdefault("limitations", ["Does not include paid, private, proprietary, or restricted material."])
    starter.setdefault("suggested_first_test_prompt", "Help me prototype the public workflow described in this video for my use case.")
    data["starter_skill"] = starter
    data["buy_vs_build"] = dict(data.get("buy_vs_build") or {})
    return _scrub(data)


def _skill_from_data(data: dict[str, Any], t: Transcript) -> SkillIntermediate:
    starter = data["starter_skill"]
    steps = [
        Step(n=i + 1, instruction=str(text))
        for i, text in enumerate(_ensure_list(starter.get("steps")))
    ]
    source_notes = _format_timestamps(data.get("source_timestamps"))
    offer_missing = _bullets(data.get("missing_or_proprietary_components"))
    if not data.get("offer_detected"):
        offer_missing += "\n- No clear paid offer or sales pitch was detected. You can still generate a normal tutorial-based skill from this video."
    elif data.get("low_detail"):
        offer_missing += "\n- This video appears to promote an offer, but it does not disclose enough public implementation detail to build a specific skill. A generic starter prototype was created based on the publicly described outcome."

    return SkillIntermediate(
        source_url=f"https://youtu.be/{t.video_id}",
        title=f"Pitch-to-Skill: {starter.get('title')}",
        name=_safe_name(starter.get("name")),
        description=str(starter.get("description")),
        category="Pitch-to-Skill",
        summary=DISCLAIMER,
        prerequisites=_ensure_list(starter.get("inputs_required")),
        tools=[],
        steps=steps,
        gotchas=_ensure_list(starter.get("safety_checks")),
        known_limitations=_ensure_list(starter.get("limitations")),
        extra_sections=[
            {"title": "Offer Decoder", "body": _offer_decoder(data, offer_missing)},
            {"title": "Starter Skill", "body": _starter_skill(starter)},
            {"title": "Buy vs. Build", "body": _buy_vs_build(data.get("buy_vs_build") or {})},
            {"title": "Confidence Report", "body": _confidence(data)},
            {"title": "Source Notes", "body": source_notes or "- No timestamp-specific offer notes were available."},
            {"title": "Download Skill", "body": "Use this packaged .skill as a starter prototype. Keep the limitations and attribution with the skill when adapting it."},
            {"title": "Guardrail Disclaimer", "body": DISCLAIMER},
        ],
    )


def _metadata(data: dict[str, Any], t: Transcript) -> dict[str, Any]:
    return {
        "result_type": RESULT_TYPE,
        "detected_offer_name": data.get("detected_offer_name"),
        "offer_type": data.get("offer_type"),
        "target_customer": data.get("target_customer"),
        "problem_solved": data.get("problem_solved"),
        "promised_outcome": data.get("promised_outcome"),
        "public_components": data.get("public_components"),
        "missing_or_proprietary_components": data.get("missing_or_proprietary_components"),
        "generated_skill_name": data.get("generated_skill_name"),
        "confidence_level": data.get("confidence_level"),
        "high_confidence_findings": data.get("high_confidence_findings"),
        "medium_confidence_inferences": data.get("medium_confidence_inferences"),
        "low_confidence_assumptions": data.get("low_confidence_assumptions"),
        "source_video_url": f"https://youtu.be/{t.video_id}",
        "source_video_title": t.title,
        "source_timestamps": data.get("source_timestamps"),
        "guardrail_notes": data.get("guardrail_notes"),
    }


def _offer_decoder(data: dict[str, Any], missing: str) -> str:
    return "\n".join([
        f"- What is being sold? {data.get('detected_offer_name') or 'Unknown'} ({data.get('offer_type') or 'unknown'})",
        f"- Who is the target customer? {data.get('target_customer')}",
        f"- What problem does it solve? {data.get('problem_solved')}",
        f"- What outcome or transformation is promised? {data.get('promised_outcome')}",
        "- Public steps, tactics, tools, or concepts mentioned:\n" + _bullets(data.get("public_components")),
        "- Private, proprietary, paid, missing, or unavailable components:\n" + (missing.strip() or "- Not clearly stated."),
        f"- Can the public concept be prototyped as an agent skill? {'Yes' if data.get('can_prototype', True) else 'Only as a very generic prototype.'}",
    ])


def _starter_skill(starter: dict[str, Any]) -> str:
    return "\n".join([
        f"**Name:** {_safe_name(starter.get('name'))}",
        f"**Description:** {starter.get('description')}",
        "\n**When to use this skill**\n" + _bullets(starter.get("when_to_use")),
        "\n**Inputs required**\n" + _bullets(starter.get("inputs_required")),
        "\n**Step-by-step workflow**\n" + _numbered(starter.get("steps")),
        "\n**Expected outputs**\n" + _bullets(starter.get("expected_outputs")),
        "\n**Quality checks**\n" + _bullets(starter.get("quality_checks")),
        "\n**Safety checks**\n" + _bullets(starter.get("safety_checks")),
        "\n**Limitations**\n" + _bullets(starter.get("limitations")),
        f"\n**Suggested first test prompt**\n{starter.get('suggested_first_test_prompt')}",
    ])


def _buy_vs_build(bvb: dict[str, Any]) -> str:
    return "\n".join([
        "**Try the prototype first when**\n" + _bullets(bvb.get("try_prototype_first")),
        "\n**Consider buying the original product when**\n" + _bullets(bvb.get("consider_buying_when")),
        "\n**What the prototype does not include**\n" + _bullets(bvb.get("prototype_does_not_include")),
        "\n**Assumptions made**\n" + _bullets(bvb.get("assumptions_made")),
        "\n**Extra value the original product might provide**\n" + _bullets(bvb.get("original_product_may_provide")),
    ])


def _confidence(data: dict[str, Any]) -> str:
    return "\n".join([
        f"**Overall confidence:** {data.get('confidence_level') or 'low'}",
        "\n**High-confidence findings**\n" + _bullets(data.get("high_confidence_findings")),
        "\n**Medium-confidence inferences**\n" + _bullets(data.get("medium_confidence_inferences")),
        "\n**Low-confidence assumptions**\n" + _bullets(data.get("low_confidence_assumptions")),
    ])


def _format_timestamps(items: Any) -> str:
    out = []
    for item in _ensure_list(items):
        if isinstance(item, dict):
            out.append(f"- {item.get('timestamp', 'unknown')}: {item.get('note', '')}")
        else:
            out.append(f"- {item}")
    return "\n".join(out)


def _bullets(items: Any) -> str:
    vals = [str(x).strip() for x in _ensure_list(items) if str(x).strip()]
    return "\n".join(f"- {x}" for x in vals) or "- Not available from public video details."


def _numbered(items: Any) -> str:
    vals = [str(x).strip() for x in _ensure_list(items) if str(x).strip()]
    return "\n".join(f"{i + 1}. {x}" for i, x in enumerate(vals)) or "1. Clarify the public goal and test a small prototype."


def _ensure_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _safe_name(value: Any) -> str:
    name = re.sub(r"[^a-z0-9-]+", "-", str(value or "pitch-to-skill-prototype").lower())
    name = re.sub(r"-+", "-", name).strip("-")
    return (name[:64].strip("-") or "pitch-to-skill-prototype")


def _stamp(seconds: float) -> str:
    total = max(0, int(seconds))
    return f"{total // 60:02d}:{total % 60:02d}"


def _scrub(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _scrub(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_scrub(v) for v in value]
    if not isinstance(value, str):
        return value
    text = value
    for phrase in PROHIBITED_PHRASES:
        text = re.sub(re.escape(phrase), "prototype the public concept", text, flags=re.I)
    return text


def _skill_text_for_guard(skill: SkillIntermediate) -> str:
    return json.dumps(skill.to_dict(), ensure_ascii=False)
