# Owned Intake Production Apply PR10

## Summary

This pass verified the PR #9 owned-intake dedupe hardening on production and adds a PR #10 repo-side deployment automation fix. FormSubmit remains live, PostHog remains behavior-only, `tool_intent_event` remains unwired, and no secrets were committed or printed.

## PR #9 Baseline

- PR #9 merge SHA: `bd83b0c109dc9ecc0a3d495f0681b799589890ee`
- PR #9 merged into `main` on 2026-04-23.
- PR #9 fixed the dedupe merge-precedence blocker by normalizing existing lead emails without bumping historical `updated_at`.

## PR #10 Repo-Side Fix

PR #10 was required because `docs/owned-intake-rollout.md` said the deploy helper applies `supabase/migrations/20260422_owned_intake_dedupe_hardening.sql`, but `scripts/deploy-owned-intake.sh` only applied `docs/supabase-schema.sql`.

PR #10 updates the deploy helper so:

- `OWNED_INTAKE_APPLY_SCHEMA` defaults to `false`
- `OWNED_INTAKE_APPLY_DEDUPE_MIGRATION` defaults to `true`
- broad first-time schema setup only runs when explicitly requested
- the PR #9 dedupe migration runs by default before function deployment when `SUPABASE_DB_URL` is present
- the script fails before deployment if selected SQL apply steps require secure SQL access and `SUPABASE_DB_URL` is missing
- secrets are still passed through environment variables only and are not printed

## Production Database Verification

Production SQL access was available through the logged-in Supabase dashboard session. No raw lead payloads or PII were copied into this report.

Safe aggregate verification after the production apply:

- `leads`: 10
- `form_submissions`: 12
- `shortlist_sessions`: 8
- `tool_intent_events`: 0
- `public.normalize_owned_intake_email(text)` exists: true
- `public.upsert_owned_intake_lead(...)` exists: true
- `leads_email_normalized_unique_idx` exists: true
- duplicate non-null normalized lead email groups: 0
- orphan `form_submissions.lead_id` refs: 0
- orphan `shortlist_sessions.lead_id` refs: 0

The dashboard result grid did not expose the far-right `orphan_tool_intent_event_lead_refs` column in the visible accessibility tree, but `tool_intent_events` count was 0.

## Function Redeploy And Smoke Tests

The production Edge Function had already been redeployed through secure Supabase dashboard access after PR #9. Fresh smoke tests from `main` against the production endpoint passed:

- valid `form_submission`: 202
- valid `shortlist_session`: 202
- invalid payload: rejected with 400
- disallowed origin: rejected with 403

Endpoint tested:

```text
https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake
```

Origin tested:

```text
https://ihelpwithai.com
```

## Same-Email Dedupe Verification

Fake/test-marked same-email submissions were sent with differently-cased emails matching:

```text
test+owned-intake-<timestamp>@example.com
```

Result:

- first submission status: 202
- second submission status: 202
- both responses returned the same lead id: true
- lead id was present: true

This confirms production is using the normalized-email upsert path for repeated same-email submissions.

## Fake Smoke Cleanup

Pre-cleanup fake/test-marked aggregate counts:

- `test+owned-intake-%@example.com` leads: 9
- `test+dedup-%@example.com` leads: 2
- fake form submissions linked to those leads: 14
- `smoke-%` shortlist sessions: 8

Cleanup status: completed after action-time confirmation.

The cleanup criteria must remain limited to:

- `test+owned-intake-%@example.com`
- `test+dedup-%@example.com`
- `shortlist_sessions.anonymous_id like 'smoke-%'`

Post-cleanup fake/test-marked aggregate counts:

- `test+owned-intake-%@example.com` leads: 0
- `test+dedup-%@example.com` leads: 0
- fake form submissions linked to those leads: 0
- `smoke-%` shortlist sessions: 0

## Live Site And Privacy Checks

- live `assets/site-data.js` contains the pinned production owned endpoint
- live `assets/site-data.js` contains the pinned allowed host `fiopwsdzcbmjcbpkdxwr.supabase.co`
- live privacy page says submissions may be received through FormSubmit/email delivery and owned Supabase intake/database
- live privacy page says analytics is behavior-only and must not store names, emails, phone numbers, addresses, or free-form message bodies
- FormSubmit remains live in the generated site
- no frontend endpoint changes were made in PR #10

## Security And Privacy Confirmation

- no `.env` files committed
- no service-role keys committed
- no database passwords committed
- no raw production lead payloads copied into reports
- no client-side Supabase writes added
- no CORS broadening
- endpoint guard remains active
- owned capture remains fail-open
- PostHog remains behavior-only
- `tool_intent_event` remains unwired

## Remaining Items

- No remaining production-apply blockers.
