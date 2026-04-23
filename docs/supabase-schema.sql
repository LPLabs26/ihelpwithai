-- Supabase schema proposal for future owned data intake.
-- Row Level Security is enabled by default below for safety.
-- Direct client writes should remain blocked unless carefully scoped policies are added later.
-- The preferred intake path is a Supabase Edge Function or another secure serverless endpoint.
-- Service-role keys must never be exposed client-side.

create extension if not exists pgcrypto;

create or replace function public.normalize_owned_intake_email(input text)
returns text
language sql
immutable
as $$
  select nullif(lower(btrim(coalesce(input, ''))), '');
$$;

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

comment on column public.form_submissions.raw_payload is
  'Use cautiously. raw_payload may contain PII, should be minimized where possible, should be reviewed before broad use, and may be pruned or removed once the intake normalizer is stable.';

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

alter table public.leads enable row level security;
alter table public.form_submissions enable row level security;
alter table public.shortlist_sessions enable row level security;
alter table public.tool_intent_events enable row level security;

comment on table public.leads is
  'Proposal only. Stores owned lead records after secure intake is configured. RLS is enabled by default for safety; direct client writes should stay blocked unless narrowly scoped policies are added later. Preferred intake path: Edge Function or secure serverless endpoint.';

comment on table public.form_submissions is
  'Proposal only. Stores normalized form submissions plus raw payload context for debugging secure intake. RLS is enabled by default for safety; direct client writes should stay blocked unless narrowly scoped policies are added later. Preferred intake path: Edge Function or secure serverless endpoint.';

comment on table public.shortlist_sessions is
  'Proposal only. Stores shortlist answers and recommendation outcomes once a secure owned endpoint exists. RLS is enabled by default for safety; direct client writes should stay blocked unless narrowly scoped policies are added later. Preferred intake path: Edge Function or secure serverless endpoint.';

comment on table public.tool_intent_events is
  'Proposal only. Stores owned tool-intent clicks separately from behavior analytics when first-party intake is enabled. RLS is enabled by default for safety; direct client writes should stay blocked unless narrowly scoped policies are added later. Preferred intake path: Edge Function or secure serverless endpoint.';

-- Normalize existing emails in place without changing historical recency.
-- The later merge step still uses original updated_at ordering to decide which
-- duplicate row supplies the newest field values.
update public.leads
set email = public.normalize_owned_intake_email(email)
where public.normalize_owned_intake_email(email) is not null
  and email is distinct from public.normalize_owned_intake_email(email);

drop table if exists owned_intake_lead_ranked;
create temp table owned_intake_lead_ranked as
select
  l.id,
  public.normalize_owned_intake_email(l.email) as normalized_email,
  first_value(l.id) over (
    partition by public.normalize_owned_intake_email(l.email)
    order by l.created_at asc, l.id asc
  ) as survivor_id,
  row_number() over (
    partition by public.normalize_owned_intake_email(l.email)
    order by l.created_at asc, l.id asc
  ) as row_num
from public.leads l
where public.normalize_owned_intake_email(l.email) is not null;

drop table if exists owned_intake_lead_merge;
create temp table owned_intake_lead_merge as
select
  ranked.survivor_id,
  (
    array_agg(nullif(l.name, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.name, '') is not null)
  )[1] as merged_name,
  (
    array_agg(nullif(l.phone, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.phone, '') is not null)
  )[1] as merged_phone,
  (
    array_agg(nullif(l.company, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.company, '') is not null)
  )[1] as merged_company,
  (
    array_agg(nullif(l.vertical, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.vertical, '') is not null)
  )[1] as merged_vertical,
  (
    array_agg(nullif(l.trade_or_business_type, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.trade_or_business_type, '') is not null)
  )[1] as merged_trade_or_business_type,
  (
    array_agg(nullif(l.team_size, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.team_size, '') is not null)
  )[1] as merged_team_size,
  (
    array_agg(nullif(l.bottleneck, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.bottleneck, '') is not null)
  )[1] as merged_bottleneck,
  (
    array_agg(nullif(l.current_stack, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.current_stack, '') is not null)
  )[1] as merged_current_stack,
  (
    array_agg(nullif(l.budget_range, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.budget_range, '') is not null)
  )[1] as merged_budget_range,
  (
    array_agg(nullif(l.setup_tolerance, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.setup_tolerance, '') is not null)
  )[1] as merged_setup_tolerance,
  (
    array_agg(nullif(l.source_page, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.source_page, '') is not null)
  )[1] as merged_source_page,
  (
    array_agg(nullif(l.starter_pack_type, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.starter_pack_type, '') is not null)
  )[1] as merged_starter_pack_type,
  (
    array_agg(nullif(l.consent_status, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.consent_status, '') is not null)
  )[1] as merged_consent_status,
  (
    array_agg(nullif(l.lead_status, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.lead_status, '') is not null)
  )[1] as merged_lead_status,
  (
    array_agg(nullif(l.notes, '') order by l.updated_at desc, l.created_at desc, l.id desc)
      filter (where nullif(l.notes, '') is not null)
  )[1] as merged_notes,
  max(l.updated_at) as merged_updated_at
from public.leads l
join owned_intake_lead_ranked ranked on ranked.id = l.id
group by ranked.survivor_id;

update public.leads l
set
  name = coalesce(nullif(l.name, ''), merged.merged_name),
  phone = coalesce(nullif(l.phone, ''), merged.merged_phone),
  company = coalesce(nullif(l.company, ''), merged.merged_company),
  vertical = coalesce(nullif(l.vertical, ''), merged.merged_vertical),
  trade_or_business_type = coalesce(
    nullif(l.trade_or_business_type, ''),
    merged.merged_trade_or_business_type
  ),
  team_size = coalesce(nullif(l.team_size, ''), merged.merged_team_size),
  bottleneck = coalesce(nullif(l.bottleneck, ''), merged.merged_bottleneck),
  current_stack = coalesce(nullif(l.current_stack, ''), merged.merged_current_stack),
  budget_range = coalesce(nullif(l.budget_range, ''), merged.merged_budget_range),
  setup_tolerance = coalesce(nullif(l.setup_tolerance, ''), merged.merged_setup_tolerance),
  source_page = coalesce(nullif(l.source_page, ''), merged.merged_source_page),
  starter_pack_type = coalesce(nullif(l.starter_pack_type, ''), merged.merged_starter_pack_type),
  consent_status = coalesce(nullif(l.consent_status, ''), merged.merged_consent_status),
  lead_status = coalesce(nullif(l.lead_status, ''), merged.merged_lead_status),
  notes = coalesce(nullif(l.notes, ''), merged.merged_notes),
  updated_at = greatest(l.updated_at, coalesce(merged.merged_updated_at, l.updated_at))
from owned_intake_lead_merge merged
where l.id = merged.survivor_id;

drop table if exists owned_intake_lead_duplicates;
create temp table owned_intake_lead_duplicates as
select id as duplicate_id, survivor_id
from owned_intake_lead_ranked
where row_num > 1;

update public.form_submissions submissions
set lead_id = duplicates.survivor_id
from owned_intake_lead_duplicates duplicates
where submissions.lead_id = duplicates.duplicate_id;

update public.shortlist_sessions sessions
set lead_id = duplicates.survivor_id
from owned_intake_lead_duplicates duplicates
where sessions.lead_id = duplicates.duplicate_id;

update public.tool_intent_events events
set lead_id = duplicates.survivor_id
from owned_intake_lead_duplicates duplicates
where events.lead_id = duplicates.duplicate_id;

delete from public.leads leads
using owned_intake_lead_duplicates duplicates
where leads.id = duplicates.duplicate_id;

drop table if exists owned_intake_lead_duplicates;
drop table if exists owned_intake_lead_merge;
drop table if exists owned_intake_lead_ranked;

create index if not exists leads_email_idx on public.leads (email);
create unique index if not exists leads_email_normalized_unique_idx
  on public.leads ((public.normalize_owned_intake_email(email)));
create index if not exists leads_vertical_idx on public.leads (vertical);
create index if not exists leads_bottleneck_idx on public.leads (bottleneck);
create index if not exists leads_trade_or_business_type_idx on public.leads (trade_or_business_type);

create index if not exists form_submissions_form_type_idx on public.form_submissions (form_type);

create index if not exists shortlist_sessions_vertical_idx on public.shortlist_sessions (vertical);
create index if not exists shortlist_sessions_top_recommendation_idx on public.shortlist_sessions (top_recommendation);

create index if not exists tool_intent_events_tool_slug_idx on public.tool_intent_events (tool_slug);
create index if not exists tool_intent_events_destination_hostname_idx on public.tool_intent_events (destination_hostname);

create or replace function public.upsert_owned_intake_lead(
  p_name text,
  p_email text,
  p_phone text default null,
  p_company text default null,
  p_vertical text default null,
  p_trade_or_business_type text default null,
  p_team_size text default null,
  p_bottleneck text default null,
  p_current_stack text default null,
  p_budget_range text default null,
  p_setup_tolerance text default null,
  p_source_page text default null,
  p_starter_pack_type text default null,
  p_consent_status text default null
)
returns uuid
language plpgsql
as $$
declare
  v_email text := public.normalize_owned_intake_email(p_email);
  v_id uuid;
begin
  if v_email is null then
    raise exception 'A valid email is required for upsert_owned_intake_lead'
      using errcode = '22023';
  end if;

  insert into public.leads (
    name,
    email,
    phone,
    company,
    vertical,
    trade_or_business_type,
    team_size,
    bottleneck,
    current_stack,
    budget_range,
    setup_tolerance,
    source_page,
    starter_pack_type,
    consent_status,
    updated_at
  )
  values (
    nullif(btrim(coalesce(p_name, '')), ''),
    v_email,
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_company, '')), ''),
    nullif(btrim(coalesce(p_vertical, '')), ''),
    nullif(btrim(coalesce(p_trade_or_business_type, '')), ''),
    nullif(btrim(coalesce(p_team_size, '')), ''),
    nullif(btrim(coalesce(p_bottleneck, '')), ''),
    nullif(btrim(coalesce(p_current_stack, '')), ''),
    nullif(btrim(coalesce(p_budget_range, '')), ''),
    nullif(btrim(coalesce(p_setup_tolerance, '')), ''),
    nullif(btrim(coalesce(p_source_page, '')), ''),
    nullif(btrim(coalesce(p_starter_pack_type, '')), ''),
    nullif(btrim(coalesce(p_consent_status, '')), ''),
    now()
  )
  on conflict ((public.normalize_owned_intake_email(email)))
  do update
  set
    updated_at = now(),
    name = coalesce(excluded.name, public.leads.name),
    email = excluded.email,
    phone = coalesce(excluded.phone, public.leads.phone),
    company = coalesce(excluded.company, public.leads.company),
    vertical = coalesce(excluded.vertical, public.leads.vertical),
    trade_or_business_type = coalesce(
      excluded.trade_or_business_type,
      public.leads.trade_or_business_type
    ),
    team_size = coalesce(excluded.team_size, public.leads.team_size),
    bottleneck = coalesce(excluded.bottleneck, public.leads.bottleneck),
    current_stack = coalesce(excluded.current_stack, public.leads.current_stack),
    budget_range = coalesce(excluded.budget_range, public.leads.budget_range),
    setup_tolerance = coalesce(excluded.setup_tolerance, public.leads.setup_tolerance),
    source_page = coalesce(excluded.source_page, public.leads.source_page),
    starter_pack_type = coalesce(excluded.starter_pack_type, public.leads.starter_pack_type),
    consent_status = coalesce(excluded.consent_status, public.leads.consent_status)
  returning id into v_id;

  return v_id;
end;
$$;
