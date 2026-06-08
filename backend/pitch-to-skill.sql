-- Pitch-to-Skill persistence fields. Safe to run more than once.

alter table public.submissions
  add column if not exists result_type text not null default 'tutorial';

alter table public.skills
  add column if not exists result_type text not null default 'tutorial',
  add column if not exists detected_offer_name text,
  add column if not exists offer_type text,
  add column if not exists target_customer text,
  add column if not exists problem_solved text,
  add column if not exists promised_outcome text,
  add column if not exists public_components jsonb,
  add column if not exists missing_or_proprietary_components jsonb,
  add column if not exists generated_skill_name text,
  add column if not exists confidence_level text,
  add column if not exists high_confidence_findings jsonb,
  add column if not exists medium_confidence_inferences jsonb,
  add column if not exists low_confidence_assumptions jsonb,
  add column if not exists source_video_url text,
  add column if not exists source_video_title text,
  add column if not exists source_timestamps jsonb,
  add column if not exists guardrail_notes jsonb;

create index if not exists submissions_result_type_idx
  on public.submissions (result_type, created_at desc);

create index if not exists skills_result_type_idx
  on public.skills (result_type, created_at desc)
  where is_public = true;

create or replace view public.public_skills as
  select name, description, category, source_url,
         storage_path as download_path, created_at,
         result_type,
         detected_offer_name, offer_type, target_customer, problem_solved,
         promised_outcome, generated_skill_name, confidence_level
  from public.skills
  where is_public = true
  order by created_at desc;

grant select on public.public_skills to anon;
