-- ihelpwithai.com data repository (Supabase / Postgres)
-- Two stores: (1) submissions = the EMAIL repository, (2) skills = the BUILT
-- SKILL repository. Emails are private (owner-only). The public Skill Library
-- reads ONLY the non-personal skill fields via a safe view.

-- 1) EMAIL / SUBMISSION repository -------------------------------------------
create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,                 -- the captured email
  url         text not null,                 -- the YouTube link they submitted
  status      text not null default 'queued',-- queued|running|verified|needs_review|error
  ip          text,
  failures    jsonb,                          -- gate failures if needs_review
  attempts    int default 0,
  created_at  timestamptz default now(),
  finished_at timestamptz,
  success_email_sent_at timestamptz,
  success_email_send_started_at timestamptz,
  success_email_provider_id text,
  success_email_last_error text
);

-- 2) BUILT SKILL repository --------------------------------------------------
create table if not exists public.skills (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete set null,
  name          text not null,
  description   text not null,
  category      text default 'Skill',
  source_url    text,
  storage_path  text not null,                -- path in the 'skills' bucket
  is_public     boolean default true,         -- show in the public library?
  created_at    timestamptz default now()
);

-- Storage for the actual .skill files
insert into storage.buckets (id, name, public)
values ('skills','skills', true)              -- public-read so library links work
on conflict (id) do nothing;

-- 3) PRIVACY: lock the tables down -------------------------------------------
alter table public.submissions enable row level security;
alter table public.skills      enable row level security;
-- No public policies = browser/anon cannot read emails or raw rows.
-- The edge function + worker use the service-role key (bypasses RLS).

-- 4) PUBLIC, SAFE view for the Skill Library (NO emails) ---------------------
create or replace view public.public_skills as
  select name, description, category, source_url,
         storage_path as download_path, created_at
  from public.skills
  where is_public = true
  order by created_at desc;

grant select on public.public_skills to anon;   -- safe: contains no PII

-- The library page can then read from:
--   https://YOURPROJECT.supabase.co/rest/v1/public_skills?select=*
-- (set SKILLS_SOURCE in skills/index.html to that URL). It returns exactly the
-- shape the page expects: name, description, category, source_url, created_at,
-- plus download_path (prefix with your storage public URL for download_url).
