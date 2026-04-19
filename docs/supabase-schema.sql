-- Supabase schema proposal for future owned data intake.
-- RLS and security policies must be configured before any direct client writes are allowed.
-- Service-role keys must never be exposed client-side.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text,
  email text not null,
  phone text,
  company text,
  vertical text,
  trade_or_business_type text,
  team_size text,
  bottleneck text,
  current_stack text,
  budget_range text,
  setup_tolerance text,
  source_page text,
  starter_pack_type text,
  consent_status text,
  lead_status text not null default 'new',
  notes text
);

comment on table public.leads is
  'Proposal only. Stores owned lead records after secure intake is configured.';

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads(id),
  form_type text not null,
  source_page text,
  vertical text,
  trade_or_business_type text,
  bottleneck text,
  message text,
  raw_payload jsonb
);

comment on table public.form_submissions is
  'Proposal only. Stores normalized form submissions plus raw payload context for debugging secure intake.';

create table if not exists public.shortlist_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads(id),
  anonymous_id text,
  vertical text not null,
  answers jsonb not null,
  top_recommendation text,
  second_recommendation text,
  third_recommendation text,
  result_clicked text,
  source_page text
);

comment on table public.shortlist_sessions is
  'Proposal only. Stores shortlist answers and recommendation outcomes once a secure owned endpoint exists.';

create table if not exists public.tool_intent_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.leads(id),
  anonymous_id text,
  vertical text,
  tool_slug text,
  tool_category text,
  page_path text,
  cta_type text,
  destination_hostname text
);

comment on table public.tool_intent_events is
  'Proposal only. Stores owned tool-intent clicks separately from behavior analytics when first-party intake is enabled.';

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_vertical_idx on public.leads (vertical);
create index if not exists leads_bottleneck_idx on public.leads (bottleneck);
create index if not exists leads_trade_or_business_type_idx on public.leads (trade_or_business_type);

create index if not exists form_submissions_form_type_idx on public.form_submissions (form_type);

create index if not exists shortlist_sessions_vertical_idx on public.shortlist_sessions (vertical);
create index if not exists shortlist_sessions_top_recommendation_idx on public.shortlist_sessions (top_recommendation);

create index if not exists tool_intent_events_tool_slug_idx on public.tool_intent_events (tool_slug);
create index if not exists tool_intent_events_destination_hostname_idx on public.tool_intent_events (destination_hostname);
