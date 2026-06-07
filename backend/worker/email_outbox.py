"""Idempotent success-email delivery for verified Skill Builder submissions."""
from __future__ import annotations

import datetime as dt
import os
from typing import Any

import emails


def send_success_email_for_submission(sb: Any, submission_id: str) -> bool:
    """Send the verified-skill email once, recording provider status in Supabase."""
    job = _single(
        sb.table("submissions")
        .select("id,email,status,success_email_sent_at,success_email_send_started_at")
        .eq("id", submission_id)
        .execute()
        .data
    )
    if not job or job.get("status") != "verified" or job.get("success_email_sent_at"):
        return False

    claim = (
        sb.table("submissions")
        .update({
            "success_email_send_started_at": _now(),
            "success_email_last_error": None,
        })
        .eq("id", submission_id)
        .eq("status", "verified")
        .is_("success_email_sent_at", "null")
        .is_("success_email_send_started_at", "null")
        .execute()
    )
    if not claim.data:
        return False

    try:
        skill = _single(
            sb.table("skills")
            .select("name,storage_path")
            .eq("submission_id", submission_id)
            .limit(1)
            .execute()
            .data
        )
        if not skill:
            raise RuntimeError("verified submission has no skill row")

        public_base = os.environ.get("PUBLIC_STORAGE_BASE", "").rstrip("/")
        link = f"{public_base}/{skill['storage_path']}" if public_base else skill["storage_path"]
        provider_id = emails.send_success(job["email"], skill["name"], link)

        sb.table("submissions").update({
            "success_email_sent_at": _now(),
            "success_email_provider_id": provider_id or None,
            "success_email_last_error": None,
        }).eq("id", submission_id).execute()
        return True
    except Exception as exc:
        sb.table("submissions").update({
            "success_email_send_started_at": None,
            "success_email_last_error": str(exc)[:500],
        }).eq("id", submission_id).execute()
        raise


def _single(rows: list[dict] | None) -> dict | None:
    return rows[0] if rows else None


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()
