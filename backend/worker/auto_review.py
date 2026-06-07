"""Retry failed submissions with a dedicated local Gemma review pass.

This is meant to run from cron. It picks bounded `needs_review` jobs, retries
the full build/verify pipeline, and only publishes/emails when the gate passes.
"""
from __future__ import annotations

import datetime as dt
import os
import tempfile
from pathlib import Path

from supabase import create_client

import emails
from skill_archive import archive_skill_bytes, archive_skill_file
from skill_builder.gate.executor import SandboxExecutor
from skill_builder.pipeline import run


sb = create_client(os.environ["SUPABASE_URL"],
                   os.environ["SUPABASE_SERVICE_ROLE_KEY"])

PUBLIC_BASE = os.environ.get("PUBLIC_STORAGE_BASE", "").rstrip("/")
MAX_ATTEMPTS = int(os.environ.get("AUTO_REVIEW_MAX_ATTEMPTS", "2"))
LIMIT = int(os.environ.get("AUTO_REVIEW_LIMIT", "1"))
SKIP_IPS = {
    ip.strip()
    for ip in os.environ.get("AUTO_REVIEW_SKIP_IPS", "internal-test").split(",")
    if ip.strip()
}
EMAIL_FAILURES = os.environ.get("AUTO_REVIEW_EMAIL_FAILURES", "").lower() == "true"
SANDBOX_EXECUTOR = SandboxExecutor.from_env()


def main() -> None:
    print(f"auto-review started at {_now()} base={os.environ.get('SKILLBUILDER_LOCAL_BASE_URL')}")
    jobs = _eligible_jobs()
    if not jobs:
        print("auto-review: no eligible needs_review submissions")
        return

    for job in jobs[:LIMIT]:
        try:
            _process(job)
        except Exception as e:
            _mark_failed(job, [f"auto-review error: {str(e)[:500]}"])
            print("auto-review error", job["id"], e)


def _eligible_jobs() -> list[dict]:
    rows = (sb.table("submissions").select("*").eq("status", "needs_review")
            .order("finished_at").limit(max(10, LIMIT * 5)).execute().data)
    out = []
    for row in rows:
        if row.get("ip") in SKIP_IPS:
            continue
        if int(row.get("attempts") or 0) >= MAX_ATTEMPTS:
            continue
        out.append(row)
    return out


def _process(job: dict) -> None:
    attempt = int(job.get("attempts") or 0) + 1
    if not _claim(job, attempt):
        print("auto-review: claim skipped", job["id"])
        return

    existing = _existing_public_skill(job["url"])
    if existing:
        print("auto-review: existing skill satisfies", job["id"], existing["name"])
        _archive_existing_storage(job, existing)
        _mark_verified(job, existing["name"], existing["storage_path"], send_email=True)
        return

    print("auto-review: retrying", job["id"], "attempt", attempt)
    out = Path(tempfile.mkdtemp(prefix="sf_review_"))
    result = run(job["url"], dest=out, executor=SANDBOX_EXECUTOR)

    if result.verified and result.skill_path:
        key = f'{job["id"]}/{result.skill_path.name}'
        with open(result.skill_path, "rb") as f:
            sb.storage.from_("skills").upload(
                key, f.read(),
                {"content-type": "application/zip", "upsert": "true"},
            )
        meta = _read_meta(result.skill_dir)
        _upsert_skill(job, meta, key)
        _archive_safely(job["id"], archive_skill_file,
                        result.skill_path, job=job, meta=meta, storage_path=key)
        _mark_verified(job, meta["name"], key, send_email=True)
        print("auto-review: verified", job["id"], meta["name"])
        return

    failures = result.gate_failures or result.log[-5:] or ["auto-review did not verify"]
    _mark_failed(job, failures)
    if EMAIL_FAILURES:
        _send_email_safely(job["id"], emails.send_needs_review, job["email"], failures)
    print("auto-review: still needs review", job["id"], failures)


def _claim(job: dict, attempt: int) -> bool:
    resp = (sb.table("submissions")
            .update({
                "status": "running",
                "attempts": attempt,
                "failures": [f"auto-review attempt {attempt} started at {_now()}"],
            })
            .eq("id", job["id"])
            .eq("status", "needs_review")
            .execute())
    return bool(resp.data)


def _existing_public_skill(url: str) -> dict | None:
    rows = (sb.table("skills").select("name,description,category,storage_path,is_public")
            .eq("source_url", url).eq("is_public", True).limit(1).execute().data)
    return rows[0] if rows else None


def _archive_existing_storage(job: dict, skill: dict) -> None:
    storage_path = skill["storage_path"]
    try:
        data = sb.storage.from_("skills").download(storage_path)
    except Exception as e:
        print("auto-review archive download error on", job["id"], e)
        return
    meta = {
        "name": skill.get("name"),
        "description": skill.get("description"),
        "category": skill.get("category", "Skill"),
    }
    _archive_safely(
        job["id"],
        archive_skill_bytes,
        data,
        filename=Path(storage_path).name,
        job=job,
        meta=meta,
        storage_path=storage_path,
    )


def _upsert_skill(job: dict, meta: dict, storage_path: str) -> None:
    row = {
        "submission_id": job["id"],
        "name": meta["name"],
        "description": meta["description"],
        "category": meta.get("category", "Skill"),
        "source_url": job["url"],
        "storage_path": storage_path,
        "is_public": True,
    }
    existing = (sb.table("skills").select("id")
                .eq("submission_id", job["id"]).limit(1).execute().data)
    if existing:
        sb.table("skills").update(row).eq("id", existing[0]["id"]).execute()
    else:
        sb.table("skills").insert(row).execute()


def _mark_verified(job: dict, skill_name: str, storage_path: str, *,
                   send_email: bool) -> None:
    sb.table("submissions").update({
        "status": "verified",
        "failures": None,
        "finished_at": _now(),
    }).eq("id", job["id"]).execute()
    if send_email:
        link = f"{PUBLIC_BASE}/{storage_path}" if PUBLIC_BASE else storage_path
        _send_email_safely(job["id"], emails.send_success, job["email"], skill_name, link)


def _mark_failed(job: dict, failures: list[str]) -> None:
    sb.table("submissions").update({
        "status": "needs_review",
        "failures": failures,
        "finished_at": _now(),
    }).eq("id", job["id"]).execute()


def _send_email_safely(job_id: str, fn, *args) -> None:
    try:
        fn(*args)
    except Exception as e:
        print("auto-review email error on", job_id, e)


def _archive_safely(job_id: str, fn, *args, **kwargs) -> None:
    try:
        archived = fn(*args, **kwargs)
        if archived:
            print("auto-review archived skill", job_id, archived)
    except Exception as e:
        print("auto-review archive error on", job_id, e)


def _read_meta(skill_dir: Path) -> dict:
    import yaml

    text = (skill_dir / "SKILL.md").read_text()
    fm = yaml.safe_load(text.split("---", 2)[1])
    return {
        "name": fm.get("name", "skill"),
        "description": fm.get("description", ""),
        "category": fm.get("category", "Skill"),
    }


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


if __name__ == "__main__":
    main()
