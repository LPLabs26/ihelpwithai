# Owned Intake Hardening PR9

## Summary

This PR hardens owned-intake dedupe and operations without changing the frontend endpoint, FormSubmit flow, PostHog scope, or CORS policy.

## Changed Files

- `supabase/functions/owned-intake/index.ts`
- `scripts/validate-owned-intake.mjs`
- `docs/supabase-schema.sql`
- `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql`
- `docs/owned-intake-fake-smoke-cleanup.sql`
- `docs/owned-intake-operations.md`
- `docs/owned-intake-rollout.md`
- `docs/supabase-setup.md`
- `reports/owned-intake-hardening-pr9.md`

## Hardening Added

- replaced the lead `select-then-insert` flow with a database-backed atomic upsert contract
- added normalized-email dedupe migration SQL for existing projects
- added a unique normalized-email guard in schema and migration SQL
- added fake smoke-row cleanup SQL that targets only test-marked rows
- added clearer monitoring and rollback guidance
- added validation coverage for repeated same-email submissions and the new migration contract

## Tests Run

- `npm run build`
- `npm run qa:live`
- `npm run test:owned-intake`
- `npm run check:owned-intake-config`
- `node --check scripts/build-site.mjs`
- `node --check src/assets/site.js`
- `node --check src/assets/data-capture.js`
- `node --check scripts/live-site-qa.mjs`
- `node --check scripts/validate-owned-intake.mjs`
- `node --check scripts/smoke-owned-intake.mjs`
- `node --check scripts/check-owned-intake-config.mjs`
- `node --check supabase/functions/owned-intake/shared.mjs`
- `deno check supabase/functions/owned-intake/index.ts`

## Migration And Backward-Compatibility Notes

- the repo now includes `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql` for existing projects
- the updated Edge Function expects that migration to be applied before production redeploy so the SQL upsert function and normalized-email uniqueness guard exist
- the migration normalizes existing lead emails, re-points related rows, and removes duplicate leads before creating the unique guard
- production application still requires secure SQL access for the migration and secure Supabase function redeploy access
- no frontend config changes are included in this PR

## Security And Privacy Confirmation

- FormSubmit remains live
- no client-side Supabase writes were added
- `tool_intent_event` remains unwired
- PostHog remains behavior-only
- no secrets were committed
- no CORS broadening was added
- endpoint guard behavior remains intact

## Fake Smoke Rows

- no fake smoke rows were cleaned up during this PR
- cleanup support is now documented and captured in `docs/owned-intake-fake-smoke-cleanup.sql`
