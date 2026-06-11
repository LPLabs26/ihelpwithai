-- Optional migration for file/source-text Skill Builder submissions.
-- The Edge Function is backwards-compatible with the legacy `url` column, but
-- this column gives the worker a cleaner place to receive temporary source text.

alter table public.submissions
  add column if not exists source_text text;

alter table public.submissions
  alter column result_type set default 'source_file';
