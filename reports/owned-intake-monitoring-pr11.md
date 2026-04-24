# Owned Intake Monitoring PR11

## Summary

This PR adds no-secret owned-intake monitoring polish after the production apply work. It does not change the frontend endpoint, FormSubmit flow, Supabase secrets handling, CORS policy, or analytics behavior.

## Changed Files

- `scripts/verify-owned-intake-live.mjs`
- `package.json`
- `docs/owned-intake-operations.md`
- `reports/owned-intake-monitoring-pr11.md`

## Monitoring Added

- added `npm run verify:owned-intake-live` for a no-secret live check of public site data, allowed host, privacy copy, and FormSubmit actions
- added `npm run verify:owned-intake-live -- --smoke` for optional live smoke checks that confirm valid `202`, invalid `400`, and disallowed-origin `403` behavior
- documented how to interpret sustained `500` spikes, unusual `403` growth, missing valid `202` responses, and FormSubmit fail-open checks

## Checks Run

- `npm run build`
- `npm run qa:live`
- `npm run test:owned-intake`
- `npm run check:owned-intake-config`
- `npm run verify:owned-intake-live`
- `node --check scripts/build-site.mjs`
- `node --check src/assets/site.js`
- `node --check src/assets/data-capture.js`
- `node --check scripts/live-site-qa.mjs`
- `node --check scripts/validate-owned-intake.mjs`
- `node --check scripts/smoke-owned-intake.mjs`
- `node --check scripts/check-owned-intake-config.mjs`
- `node --check scripts/verify-owned-intake-live.mjs`
- `node --check supabase/functions/owned-intake/shared.mjs`
- `/tmp/deno-install/bin/deno check supabase/functions/owned-intake/index.ts`

## Security And Privacy Confirmation

- FormSubmit remains live
- `tool_intent_event` remains unwired
- PostHog remains behavior-only
- no PII was added to analytics
- no frontend config was changed
- no client-side Supabase writes were added
- no Supabase secret handling was changed
- no CORS broadening was added
- endpoint guard remains active
- no secrets, `.env` files, service-role keys, database passwords, or raw lead payloads were committed

## Remaining Follow-Ups

- use `npm run verify:owned-intake-live -- --smoke` after deploys where creating fake smoke rows is acceptable
- clean fake smoke rows with `docs/owned-intake-fake-smoke-cleanup.sql` after recording verification results
