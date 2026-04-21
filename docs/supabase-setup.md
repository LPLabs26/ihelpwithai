# Supabase Setup

## What this step is for

This repo now includes the schema proposal and frontend-safe config hooks needed to prepare an owned intake layer.

It does not switch the live site away from FormSubmit yet.

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

5. Confirm the function directory includes `supabase/functions/owned-intake/deno.json` with:

   ```json
   {
     "nodeModulesDir": "auto"
   }
   ```

   This allows `deno check` and Edge Function tooling to resolve the `npm:@supabase/supabase-js@2` import cleanly.

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

If `deno` is not available in the local environment, treat that check as a required manual verification before deployment.

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

## Manual steps still required by the site owner

- Create the Supabase project.
- Choose the region.
- Run the schema from `docs/supabase-schema.sql`.
- Deploy the `owned-intake` Edge Function.
- Set the function secrets/config.
- Run `deno check supabase/functions/owned-intake/index.ts` if it was not already run locally.
- Test starter-pack, contact, vendor, and shortlist submissions.
- Decide whether FormSubmit remains a backup path or is replaced later.
