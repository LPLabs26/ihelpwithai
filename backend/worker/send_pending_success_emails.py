"""Cron entrypoint: send missing success emails for verified skills."""
from __future__ import annotations

import os

from supabase import create_client

from email_outbox import send_success_email_for_submission


sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
LIMIT = int(os.environ.get("SUCCESS_EMAIL_CRON_LIMIT", "20"))


def main() -> None:
    rows = (
        sb.table("submissions")
        .select("id,email,finished_at")
        .eq("status", "verified")
        .is_("success_email_sent_at", "null")
        .is_("success_email_send_started_at", "null")
        .order("finished_at", desc=False)
        .limit(LIMIT)
        .execute()
        .data
    )
    sent = 0
    failed = 0
    for row in rows or []:
        try:
            if send_success_email_for_submission(sb, row["id"]):
                sent += 1
        except Exception as exc:
            failed += 1
            print(f"success-email cron failed submission={row['id']} error={str(exc)[:200]}")

    print(f"success-email cron checked={len(rows or [])} sent={sent} failed={failed}")


if __name__ == "__main__":
    main()
