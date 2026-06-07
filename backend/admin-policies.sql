-- Admin access for ihelpwithai.com (run once in the Supabase SQL editor).
-- Lets a logged-in OWNER read submissions and add/delete/hide skills from the
-- /admin page — while the public still can't touch either table.

-- 1) Who is an admin
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- 2) Skills: full control for admins (insert / update / delete / select all)
drop policy if exists "admin manage skills" on public.skills;
create policy "admin manage skills" on public.skills
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 3) Submissions (emails): admins can READ; nobody public can.
drop policy if exists "admin read submissions" on public.submissions;
create policy "admin read submissions" on public.submissions
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 4) Make yourself an admin:
--    a) Supabase dashboard → Authentication → Users → Add user (your email + password)
--    b) copy that user's UID, then run:
--       insert into public.admins (user_id) values ('PASTE-YOUR-AUTH-UID');
