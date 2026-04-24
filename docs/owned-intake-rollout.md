# Owned Intake Rollout

## Purpose

This is the operator checklist for Codex to move the owned-intake path from repo-ready to production-ready without breaking the live static site.

## Status Update

Production rollout is now live.

- production endpoint: `https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake`
- allowed hostname: `fiopwsdzcbmjcbpkdxwr.supabase.co`
- FormSubmit remains live in parallel
- PostHog remains behavior-only

For recurring verification, rollback, and fake-row cleanup guidance, use `docs/owned-intake-operations.md`.
For duplicate-email hardening on an existing Supabase project, apply `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql` before redeploying the Edge Function.

Current production rules:

- GitHub Pages remains the live static host.
- FormSubmit stays live for starter-pack, contact, and vendor forms.
- PostHog stays behavior-only and must not receive PII.
- `site.ownedDataEndpoint` should stay pinned to the tested production endpoint unless an intentional rollback is in progress.
- `site.ownedDataAllowedHosts` should contain only `fiopwsdzcbmjcbpkdxwr.supabase.co` unless an intentional rollback is in progress.

## Required secure inputs

Codex can complete the rollout once a secure deployment context has all of these available:

- `SUPABASE_PROJECT_REF`
- Supabase CLI access with `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OWNED_INTAKE_ALLOWED_ORIGINS`
- optional `OWNED_INTAKE_DEV_ORIGIN`
- secure SQL access through `SUPABASE_DB_URL` for selected database apply steps
- optional `OWNED_INTAKE_APPLY_SCHEMA=true` for first-time/full schema setup
- optional `OWNED_INTAKE_APPLY_DEDUPE_MIGRATION=false` only after verifying production already has the PR #9 dedupe migration

Do not paste secrets into chat. Provide them only through a secure environment or deployment runner.

## Never commit these items

- `.env` files
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- database passwords or raw connection strings
- Google credentials
- PostHog personal API keys
- any copied production payload that contains real lead data

## Repo-side preflight

Run these before any deployment attempt:

1. `npm run build`
2. `npm run test:owned-intake`
3. `npm run check:owned-intake-config`
4. `node --check scripts/build-site.mjs`
5. `node --check src/assets/site.js`
6. `node --check src/assets/data-capture.js`
7. `node --check scripts/live-site-qa.mjs`
8. `node --check scripts/validate-owned-intake.mjs`
9. `node --check scripts/smoke-owned-intake.mjs`
10. `node --check scripts/check-owned-intake-config.mjs`
11. `node --check supabase/functions/owned-intake/shared.mjs`
12. `deno check supabase/functions/owned-intake/index.ts`

## Schema migration

First-time setup path:

1. Use secure SQL access to run `docs/supabase-schema.sql`.
2. Confirm the tables exist:
   - `leads`
   - `form_submissions`
   - `shortlist_sessions`
   - `tool_intent_events`
3. Confirm RLS is enabled on all four tables.

Existing live project path:

1. Use secure SQL access to run `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql`.
2. Confirm `public.normalize_owned_intake_email(...)` exists.
3. Confirm `public.upsert_owned_intake_lead(...)` exists.
4. Confirm `leads_email_normalized_unique_idx` exists.
5. Confirm there are no duplicate non-null normalized lead emails.

If Codex has a secure database connection string in the deployment environment, `scripts/deploy-owned-intake.sh` can apply the selected SQL files automatically through `psql`.

If secure SQL access is missing, that is a hard blocker for rollout completion.

## Function deployment

Codex should use `scripts/deploy-owned-intake.sh` when the secure environment is available.

What that script verifies or performs:

1. Verifies `supabase/config.toml` still has:

   ```toml
   [functions.owned-intake]
   verify_jwt = false
   ```

2. Links the local repo to `SUPABASE_PROJECT_REF`.
3. Skips broad schema setup by default. Set `OWNED_INTAKE_APPLY_SCHEMA=true` to apply `docs/supabase-schema.sql` for first-time/full schema setup.
4. Applies `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql` by default before redeploying the function. Set `OWNED_INTAKE_APPLY_DEDUPE_MIGRATION=false` only after verifying production already has that migration.
5. Sets function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OWNED_INTAKE_ALLOWED_ORIGINS`
   - optional `OWNED_INTAKE_DEV_ORIGIN`
6. Deploys `owned-intake`.
7. Runs the direct smoke tests against the deployed endpoint.

## Direct smoke tests

Use the smoke script after deployment:

```bash
npm run smoke:owned-intake -- --endpoint "https://YOUR_PROJECT_REF.supabase.co/functions/v1/owned-intake"
```

Defaults:

- endpoint from `OWNED_INTAKE_ENDPOINT` if not passed on the command line
- origin from `OWNED_INTAKE_ORIGIN`, defaulting to `https://ihelpwithai.com`

The smoke script will:

- POST a safe `form_submission`
- POST a safe `shortlist_session`
- POST an invalid payload and require rejection
- exit nonzero if any step fails

## Frontend enablement

Do not enable the frontend until all of these are true:

1. The production function URL is known.
2. The exact allowed hostname is known.
3. Direct smoke tests passed.
4. FormSubmit still works.
5. The endpoint is HTTPS and ends with `/functions/v1/owned-intake`.
6. The hostname is exactly present in `site.ownedDataAllowedHosts`.

When the function is proven safe:

1. Set `site.ownedDataEndpoint` in `src/data/site-content.mjs` to:
   - `https://YOUR_PROJECT_REF.supabase.co/functions/v1/owned-intake`
2. Set `site.ownedDataAllowedHosts` to:
   - `["YOUR_PROJECT_REF.supabase.co"]`
3. Run:
   - `npm run build`
   - `npm run check:owned-intake-config`
   - `npm run qa:live`
4. Confirm generated forms still point to `https://formsubmit.co/info@ihelpwithai.com`.
5. Confirm `thank-you` remains noindex.
6. Confirm PostHog still receives behavior-only data.

## Rollback

If the owned endpoint causes bad writes, high errors, or suspicious traffic:

1. Set `site.ownedDataEndpoint` back to `""`.
2. Set `site.ownedDataAllowedHosts` back to `[]`.
3. Rebuild and redeploy the static site.
4. Re-run `npm run check:owned-intake-config`.
5. Re-run `npm run qa:live`.
6. Keep FormSubmit live while rollout issues are investigated.

Rollback does not require removing FormSubmit because FormSubmit never stops being the primary live form action during this phase.

## Verification checklist

- PR checks are green.
- `npm run smoke:owned-intake` passed against the deployed function.
- Valid payloads insert rows into:
  - `leads`
  - `form_submissions`
  - `shortlist_sessions`
- Invalid payloads are rejected.
- CORS accepts `https://ihelpwithai.com` and rejects disallowed origins.
- `site.ownedDataEndpoint` is either blank or set only to the tested production function URL.
- `site.ownedDataAllowedHosts` is either empty or contains only the tested production hostname.
- FormSubmit is still live.
- No secrets were committed.

## Exact blocker message if access is missing

If rollout cannot proceed, the minimal secure request is:

`I need a secure deployment environment with SUPABASE_PROJECT_REF=fiopwsdzcbmjcbpkdxwr, Supabase CLI access through SUPABASE_ACCESS_TOKEN, secure SQL access through SUPABASE_DB_URL or equivalent, and existing function secrets available in Supabase. Do not paste service-role keys, database passwords, or access tokens into chat.`
