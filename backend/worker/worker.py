"""ihelpwithai.com worker — the off-site process that actually runs the engine.

Loop: claim a queued submission -> run the engine (build + verify) -> on a
verified pass, upload the .skill, record it in `skills` (the public library),
and email the user a link -> on failure after retries, mark needs_review and
email the reasons. Never emails a skill that didn't pass the gate.

Run this on a host that has Python + ffmpeg (Render / Railway / Fly / a VM).
It owns the API keys; the static site and edge function never see them.

Env required:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  SKILLBUILDER_PROVIDER + the matching AI key (ANTHROPIC_API_KEY / OPENAI_API_KEY)
  RESEND_API_KEY, EMAIL_FROM   (see emails.py)
  PUBLIC_STORAGE_BASE  e.g. https://YOURPROJECT.supabase.co/storage/v1/object/public/skills
"""
from __future__ import annotations

import os
import time
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from supabase import create_client

# the engine (installed alongside this worker; see requirements.txt)
from skill_builder.pipeline import run, run_pitch_to_skill
from skill_builder.gate.executor import SandboxExecutor
import emails
from email_outbox import send_success_email_for_submission
from skill_archive import archive_skill_file

sb = create_client(os.environ["SUPABASE_URL"],
                   os.environ["SUPABASE_SERVICE_ROLE_KEY"])
PUBLIC_BASE = os.environ.get("PUBLIC_STORAGE_BASE", "").rstrip("/")
POLL_SECONDS = int(os.environ.get("WORKER_POLL_SECONDS", "5"))
SANDBOX_EXECUTOR = SandboxExecutor.from_env()


def claim_one() -> dict | None:
    rows = (sb.table("submissions").select("*").eq("status", "queued")
            .order("created_at").limit(1).execute().data)
    if not rows:
        return None
    job = rows[0]
    sb.table("submissions").update({"status": "running"}).eq("id", job["id"]).execute()
    return job


def process(job: dict) -> None:
    out = Path(tempfile.mkdtemp(prefix="sf_"))
    result_type = _job_result_type(job)
    source_url = _clean_source_url(job["url"])
    archive_job = {**job, "url": source_url, "result_type": result_type}
    if result_type == "pitch_to_skill":
        result = run_pitch_to_skill(job["url"], dest=out)
    else:
        result = run(
            job["url"],
            dest=out,
            executor=SANDBOX_EXECUTOR,
        )  # ingest -> ... -> gate (bounded retries)

    if result.verified and result.skill_path:
        key = f'{job["id"]}/{result.skill_path.name}'
        with open(result.skill_path, "rb") as f:
            sb.storage.from_("skills").upload(
                key, f.read(),
                {"content-type": "application/zip", "upsert": "true"})
        # read the skill's name/description for the library row
        meta = _read_meta(result.skill_dir)
        row = {
            "submission_id": job["id"],
            "name": meta["name"], "description": meta["description"],
            "category": meta.get("category", "Skill"),
            "source_url": source_url,
            "storage_path": key, "is_public": True,
            "result_type": result_type,
        }
        row.update(_pitch_columns(result.metadata))
        _insert_skill(row)
        _archive_safely(job["id"], archive_skill_file,
                        result.skill_path, job=archive_job, meta=meta, storage_path=key)
        sb.table("submissions").update(
            {"status": "verified", "finished_at": _now()}).eq("id", job["id"]).execute()
        _send_email_safely(job["id"], send_success_email_for_submission, sb, job["id"])
    else:
        sb.table("submissions").update(
            {"status": "needs_review", "failures": result.gate_failures,
             "finished_at": _now()}).eq("id", job["id"]).execute()
        _send_email_safely(job["id"], emails.send_needs_review, job["email"], result.gate_failures)


def _send_email_safely(job_id: str, fn, *args) -> None:
    try:
        fn(*args)
    except Exception as e:
        print("email error on", job_id, e)


def _archive_safely(job_id: str, fn, *args, **kwargs) -> None:
    try:
        archived = fn(*args, **kwargs)
        if archived:
            print("archived skill", job_id, archived)
    except Exception as e:
        print("archive error on", job_id, e)


def _read_meta(skill_dir: Path) -> dict:
    import yaml
    text = (skill_dir / "SKILL.md").read_text()
    fm = yaml.safe_load(text.split("---", 2)[1])
    return {
        "name": fm.get("name", "skill"),
        "description": fm.get("description", ""),
        "category": fm.get("category", "Skill"),
    }


def _job_result_type(job: dict) -> str:
    if job.get("result_type") == "pitch_to_skill":
        return "pitch_to_skill"
    qs = parse_qs(urlsplit(job.get("url") or "").query)
    return "pitch_to_skill" if qs.get("ihwa_result_type", [""])[0] == "pitch_to_skill" else "tutorial"


def _clean_source_url(url: str) -> str:
    parts = urlsplit(url)
    pairs = [
        (k, v)
        for k, values in parse_qs(parts.query, keep_blank_values=True).items()
        for v in values
        if k != "ihwa_result_type"
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(pairs), parts.fragment))


def _pitch_columns(metadata: dict) -> dict:
    allowed = {
        "detected_offer_name",
        "offer_type",
        "target_customer",
        "problem_solved",
        "promised_outcome",
        "public_components",
        "missing_or_proprietary_components",
        "generated_skill_name",
        "confidence_level",
        "high_confidence_findings",
        "medium_confidence_inferences",
        "low_confidence_assumptions",
        "source_video_url",
        "source_video_title",
        "source_timestamps",
        "guardrail_notes",
    }
    return {k: v for k, v in (metadata or {}).items() if k in allowed}


def _insert_skill(row: dict) -> None:
    try:
        sb.table("skills").insert(row).execute()
    except Exception as e:
        if not _missing_pitch_columns(e):
            raise
        fallback = {
            k: v for k, v in row.items()
            if k in {
                "submission_id",
                "name",
                "description",
                "category",
                "source_url",
                "storage_path",
                "is_public",
            }
        }
        print("skills table is missing Pitch-to-Skill columns; inserted legacy row")
        sb.table("skills").insert(fallback).execute()


def _missing_pitch_columns(exc: Exception) -> bool:
    text = str(exc)
    return "column skills." in text and "does not exist" in text


def _now() -> str:
    import datetime
    return datetime.datetime.utcnow().isoformat()


def main() -> None:
    print("ihelpwithai.com worker started.")
    while True:
        job = claim_one()
        if not job:
            time.sleep(POLL_SECONDS)
            continue
        print("processing", job["id"], job["url"])
        try:
            process(job)
        except Exception as e:  # never crash the loop
            sb.table("submissions").update(
                {"status": "error", "failures": [str(e)[:500]], "finished_at": _now()}
            ).eq("id", job["id"]).execute()
            print("error on", job["id"], e)


if __name__ == "__main__":
    main()
