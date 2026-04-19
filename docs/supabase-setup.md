# Supabase Setup

## What this step is for

This repo now includes the schema proposal and frontend-safe config hooks needed to prepare an owned intake layer.

It does not switch the live site away from FormSubmit yet.

## Setup flow

1. Create a Supabase project.

2. Choose the region that best matches the operating team and expected lead volume.

3. Run `docs/supabase-schema.sql` in the Supabase SQL editor.

## Recommended safer intake path

1. The website form posts to a Supabase Edge Function.

2. The Edge Function validates the payload.

3. The Edge Function inserts into Supabase.

4. The Edge Function returns success.

5. An optional notification email or CRM handoff happens after the database write succeeds.

This keeps service-role credentials off the frontend and gives the team one place to validate, normalize, and log incoming data.

## Key handling rules

- Do not expose a Supabase service-role key in frontend code.
- A public anon key should only be exposed if Row Level Security and insert policies are configured correctly for the exact writes allowed.
- Keep FormSubmit live until Supabase intake is tested end to end.

## Manual steps still required by the site owner

- Create the Supabase project.
- Choose the region.
- Run the schema from `docs/supabase-schema.sql`.
- Create the Edge Function.
- Set the function secrets.
- Test starter-pack and contact submissions.
- Decide whether FormSubmit remains a backup path or is replaced later.
