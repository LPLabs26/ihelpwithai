# Supabase Setup

## What this step is for

This repo now includes the schema proposal and frontend-safe config hooks needed to prepare an owned intake layer.

It does not switch the live site away from FormSubmit yet.

For the Codex-run production rollout checklist, use [`docs/owned-intake-rollout.md`](docs/owned-intake-rollout.md).

## Setup flow

1. Create a Supabase project.

2. Choose the region that best matches the operating team and expected lead volume.

3. Run `docs/supabase-schema.sql` in the Supabase SQL editor.

4. Deploy the Edge Function from `supabase/functions/owned-intake/`.

5. Keep FormSubmit live while the owned endpoint is tested end to end.

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

## Edge Function deployment

Typical deployment flow:

1. Install and log into the Supabase CLI.

2. Link the local repo to the Supabase project.

3. Set the required function secrets or confirm they exist in the project environment.

4. Confirm the repo includes `supabase/config.toml` with:

   ```toml
   [functions.owned-intake]
   verify_jwt = false
   ```

   This is required because the static site calls the Edge Function directly without a Supabase user JWT. Gateway-level JWT verification must be disabled for this specific function, while the function's own CORS and origin checks still stay in place.

5. Confirm the repo includes `deno.json` with:

   ```json
   {
     "nodeModulesDir": "auto"
   }
   ```

   This allows `deno check supabase/functions/owned-intake/index.ts` and Edge Function tooling to resolve the `npm:@supabase/supabase-js@2` import cleanly from the repo root.

6. Deploy the function:

   ```bash
   supabase functions deploy owned-intake
   ```

   If the project is deployed another way, the equivalent flag is:

   ```bash
   supabase functions deploy owned-intake --no-verify-jwt
   ```

The function entrypoint in this repo is `supabase/functions/owned-intake/index.ts`.

## Required secrets and config

Required in the function environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended function config values:

- `OWNED_INTAKE_ALLOWED_ORIGINS=https://ihelpwithai.com,https://www.ihelpwithai.com`
- `OWNED_INTAKE_DEV_ORIGIN=http://127.0.0.1:4173`

Only set a dev origin when local testing is actually needed.

## Allowed origins

The function is designed to allow:

- `https://ihelpwithai.com`
- `https://www.ihelpwithai.com`
- one optional local dev origin when explicitly configured

The frontend helper also requires an approved HTTPS endpoint host before it will send any owned payloads.

## Deno validation

If `deno` is available locally, run:

```bash
deno check supabase/functions/owned-intake/index.ts
```

If `deno` is not available in the local environment, treat that check as a required operator-run verification before deployment.

## Existing-project hardening migration

For an existing owned-intake project that already has the base schema, apply:

- `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql`

Use the repo's normal secure SQL path for that environment. If the Supabase CLI is configured for the project, that can be done through the migration workflow. If not, run the migration file through secure SQL access in the Supabase SQL editor.

That migration:

- normalizes existing lead emails to lowercase
- re-points child rows away from duplicate lead records
- removes duplicate lead rows after reassignment
- adds a unique normalized-email guard
- creates the SQL upsert function used by the Edge Function

## Test checklist

- Send an `OPTIONS` request from an allowed origin and confirm CORS headers are returned.
- Send a valid `form_submission` payload and confirm rows land in `leads` and `form_submissions`.
- Send a valid `shortlist_session` payload and confirm rows land in `shortlist_sessions`.
- Confirm malformed JSON returns `400`.
- Confirm unsupported payload types return `400`.
- Confirm disallowed origins return `403`.
- Confirm oversized payloads are rejected.
- Confirm the live FormSubmit email flow still works while owned intake is enabled.

Sample direct `curl` test:

```bash
curl -i 'https://your-project-ref.supabase.co/functions/v1/owned-intake' \
  -X POST \
  -H 'Origin: https://ihelpwithai.com' \
  -H 'Content-Type: application/json' \
  --data '{
    "type": "form_submission",
    "form_type": "field_starter_pack",
    "email": "owner@example.com",
    "source_page": "/starter-pack/",
    "vertical": "field_trades",
    "trade": "hvac",
    "bottleneck": "missed-calls"
  }'
```

Include the `Origin: https://ihelpwithai.com` header during direct testing. The function intentionally rejects requests with a missing or disallowed origin.

## Enabling ownedDataEndpoint after deploy

Do not enable the frontend endpoint until the function has been deployed and tested.

When the function is ready:

1. Set `site.ownedDataEndpoint` to the full deployed HTTPS function URL, for example:

   - `https://your-project-ref.supabase.co/functions/v1/owned-intake`

2. Set `site.ownedDataAllowedHosts` to the hostname only, for example:

   - `["your-project-ref.supabase.co"]`

3. Rebuild and deploy the static site.

4. Re-test owned intake and confirm FormSubmit still works in parallel.

## Access still required by Codex

- Secure access to the production Supabase project
- Function secret injection for:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OWNED_INTAKE_ALLOWED_ORIGINS`
  - optional `OWNED_INTAKE_DEV_ORIGIN`
- Secure SQL access to run `docs/supabase-schema.sql`
- Direct smoke-test access to the deployed function URL
