-- Analytics for ihelpwithai.com admin counters.
-- Records two anonymous events: page visits and skill downloads. No PII.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  type       text not null check (type in ('visit','download')),
  path       text,
  skill      text,
  visitor    text,            -- random id from localStorage (approx unique visitors)
  created_at timestamptz default now()
);
alter table public.events enable row level security;

-- Public pages may INSERT events (counter only); they cannot read them.
drop policy if exists "anon insert events" on public.events;
create policy "anon insert events" on public.events
  for insert to anon with check (true);

-- Admins may READ events (for the counters).
drop policy if exists "admin read events" on public.events;
create policy "admin read events" on public.events
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
