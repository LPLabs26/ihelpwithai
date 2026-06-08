from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "backend" / "worker"
sys.path.insert(0, str(WORKER))

from skill_builder.stages.ingest import Segment, Transcript
from skill_builder.stages.pitch_to_skill import (  # noqa: E402
    DISCLAIMER,
    PROHIBITED_PHRASES,
    _normalize,
    _skill_from_data,
    validate_pitch_output,
)


class PitchToSkillStaticTests(unittest.TestCase):
    def test_homepage_renders_mode_selector_and_posts_result_type(self) -> None:
        html = (ROOT / "index.html").read_text()
        self.assertIn("Build from tutorial", html)
        self.assertIn("Decode offer and build prototype", html)
        self.assertIn('value="pitch_to_skill"', html)
        self.assertIn("ihwa_result_type", html)
        self.assertIn("withModeParam", html)
        self.assertIn("JSON.stringify({url:submitUrl,email,result_type})", html)

    def test_library_can_filter_pitch_results(self) -> None:
        html = (ROOT / "skills" / "index.html").read_text()
        self.assertIn("Pitch-to-Skill", html)
        self.assertIn("Prototype based on public pitch", html)
        self.assertIn("typeFilter", html)
        self.assertIn("pitch_to_skill", html)
        self.assertIn("skillType", html)

    def test_edge_function_and_schema_store_result_type(self) -> None:
        fn = (ROOT / "backend" / "functions" / "submit-skill-job" / "index.ts").read_text()
        schema = (ROOT / "backend" / "schema.sql").read_text()
        migration = (ROOT / "backend" / "pitch-to-skill.sql").read_text()
        self.assertIn("RESULT_TYPES", fn)
        self.assertIn("result_type: safeResultType", fn)
        self.assertIn("result_type text not null default 'tutorial'", schema)
        self.assertIn("detected_offer_name", schema)
        self.assertIn("create or replace view public.public_skills", migration)


class PitchToSkillGenerationTests(unittest.TestCase):
    def test_pitch_skill_contains_required_sections_and_disclaimer(self) -> None:
        transcript = Transcript(
            video_id="VVU3POOtyDU",
            title="Example offer video",
            duration_s=120,
            segments=[Segment(0, 10, "Join my course to learn a public workflow.")],
        )
        data = _normalize(
            {
                "offer_detected": True,
                "detected_offer_name": "Workflow Course",
                "offer_type": "course",
                "target_customer": "Solo operators",
                "problem_solved": "Manual intake",
                "promised_outcome": "Cleaner follow-up",
                "public_components": ["Capture a goal", "Draft a plan"],
                "missing_or_proprietary_components": ["Private templates are not public"],
                "generated_skill_name": "workflow-prototype",
                "confidence_level": "medium",
                "source_timestamps": [{"timestamp": "00:00", "note": "Offer mentioned"}],
                "starter_skill": {
                    "name": "workflow-prototype",
                    "title": "Workflow Prototype",
                    "description": "Use this generic prototype to test a public workflow concept.",
                    "steps": ["Collect user goal", "Draft a starter workflow"],
                },
            },
            transcript,
        )
        skill = _skill_from_data(data, transcript)
        text = "\n".join(section["title"] + "\n" + section["body"] for section in skill.extra_sections)

        for title in [
            "Offer Decoder",
            "Starter Skill",
            "Buy vs. Build",
            "Confidence Report",
            "Source Notes",
            "Download Skill",
            "Guardrail Disclaimer",
        ]:
            self.assertIn(title, text)
        self.assertIn(DISCLAIMER, text)
        self.assertEqual([], validate_pitch_output(data, text))

    def test_prohibited_phrases_are_reported(self) -> None:
        for phrase in PROHIBITED_PHRASES:
            failures = validate_pitch_output({"guardrail_notes": [DISCLAIMER], "x": phrase})
            self.assertTrue(failures, phrase)


if __name__ == "__main__":
    unittest.main()
