-- Track success-email delivery so the worker and cron can safely retry without
-- sending duplicate "skill is ready" emails.

alter table public.submissions
  add column if not exists success_email_sent_at timestamptz,
  add column if not exists success_email_send_started_at timestamptz,
  add column if not exists success_email_provider_id text,
  add column if not exists success_email_last_error text;

create index if not exists submissions_success_email_pending_idx
  on public.submissions (finished_at)
  where status = 'verified' and success_email_sent_at is null;
