from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "backend" / "worker"
sys.path.insert(0, str(WORKER))

from skill_builder.stages.ingest import Segment, Transcript
from skill_builder.models import SkillIntermediate, Step  # noqa: E402
from skill_builder.providers.llm import _loads_loose  # noqa: E402
from skill_builder.stages.format_skill import build_and_package  # noqa: E402
from skill_builder.stages.pitch_to_skill import (  # noqa: E402
    DISCLAIMER,
    PROHIBITED_PHRASES,
    _normalize,
    _skill_from_data,
    validate_pitch_output,
)


class PitchToSkillStaticTests(unittest.TestCase):
    def test_homepage_renders_file_source_intake(self) -> None:
        html = (ROOT / "index.html").read_text()
        self.assertIn("Turn your files into agent skills", html)
        self.assertIn('id="files"', html)
        self.assertIn('id="sourceText"', html)
        self.assertIn('id="rights"', html)
        self.assertIn("rights_confirmed:rights", html)
        self.assertIn("JSON.stringify({email,transcript:sourceText,rights_confirmed:rights})", html)

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
        self.assertIn("rights_confirmed", fn)
        self.assertIn("inlineSourceUrl", fn)
        self.assertIn('result_type: "source_file"', fn)
        self.assertIn("source_text text", schema)
        self.assertIn("result_type text not null default 'source_file'", schema)
        self.assertIn("detected_offer_name", schema)
        self.assertIn("create or replace view public.public_skills", migration)


class PitchToSkillGenerationTests(unittest.TestCase):
    def test_json_loader_extracts_object_from_model_prose(self) -> None:
        self.assertEqual({"ok": True}, _loads_loose("Sure.\n```json\n{\"ok\": true}\n```\nDone."))

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

    def test_source_artifacts_are_not_written_or_packaged(self) -> None:
        import tempfile
        import zipfile

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill = SkillIntermediate(
                source_url="",
                title="Source File Skill",
                name="source-file-skill",
                description="Use this skill to test that raw source artifacts are never packaged.",
                category="Skill",
                steps=[Step(1, "Do the generated step.")],
                snippets={
                    "source.txt": "raw source",
                    "transcript.txt": "raw transcript",
                    "helper.txt": "generated helper",
                },
            )
            skill_dir, archive = build_and_package(skill, root)

            self.assertFalse((skill_dir / "scripts" / "source.txt").exists())
            self.assertFalse((skill_dir / "scripts" / "transcript.txt").exists())
            self.assertTrue((skill_dir / "scripts" / "helper.txt").exists())
            with zipfile.ZipFile(archive) as zf:
                names = set(zf.namelist())
            self.assertNotIn("source-file-skill/scripts/source.txt", names)
            self.assertNotIn("source-file-skill/scripts/transcript.txt", names)
            self.assertIn("source-file-skill/scripts/helper.txt", names)


if __name__ == "__main__":
    unittest.main()
