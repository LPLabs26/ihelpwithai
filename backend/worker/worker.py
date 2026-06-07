"""SkillForge worker — the off-site process that actually runs the engine.

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

from supabase import create_client

# the engine (installed alongside this worker; see requirements.txt)
from skill_builder.pipeline import run
import emails

sb = create_client(os.environ["SUPABASE_URL"],
                   os.environ["SUPABASE_SERVICE_ROLE_KEY"])
PUBLIC_BASE = os.environ.get("PUBLIC_STORAGE_BASE", "").rstrip("/")
POLL_SECONDS = int(os.environ.get("WORKER_POLL_SECONDS", "5"))


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
    result = run(job["url"], dest=out)            # ingest -> ... -> gate (bounded retries)

    if result.verified and result.skill_path:
        key = f'{job["id"]}/{result.skill_path.name}'
        with open(result.skill_path, "rb") as f:
            sb.storage.from_("skills").upload(
                key, f.read(),
                {"content-type": "application/zip", "upsert": "true"})
        # read the skill's name/description for the library row
        meta = _read_meta(result.skill_dir)
        sb.table("skills").insert({
            "submission_id": job["id"],
            "name": meta["name"], "description": meta["description"],
            "category": meta.get("category", "Skill"),
            "source_url": job["url"],
            "storage_path": key, "is_public": True,
        }).execute()
        sb.table("submissions").update(
            {"status": "verified", "finished_at": _now()}).eq("id", job["id"]).execute()
        link = f"{PUBLIC_BASE}/{key}" if PUBLIC_BASE else key
        _send_email_safely(job["id"], emails.send_success, job["email"], meta["name"], link)
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


def _read_meta(skill_dir: Path) -> dict:
    import yaml
    text = (skill_dir / "SKILL.md").read_text()
    fm = yaml.safe_load(text.split("---", 2)[1])
    return {"name": fm.get("name", "skill"), "description": fm.get("description", "")}


def _now() -> str:
    import datetime
    return datetime.datetime.utcnow().isoformat()


def main() -> None:
    print("SkillForge worker started.")
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
