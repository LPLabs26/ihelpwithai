# Owned Intake Operations

## Current Production State

Current live setup:

- static site hosted on GitHub Pages
- FormSubmit remains the live action for starter-pack, contact, and vendor forms
- owned intake runs in parallel at `https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake`
- allowed host guard remains locked to `fiopwsdzcbmjcbpkdxwr.supabase.co`
- PostHog remains behavior-only
- `tool_intent_event` remains unwired

## Fast Verification Checklist

Run this after any config change, deploy, or suspicious intake issue:

1. Confirm `https://ihelpwithai.com/assets/site-data.js` still contains the expected production endpoint and only the hostname `fiopwsdzcbmjcbpkdxwr.supabase.co`.
2. Confirm `https://ihelpwithai.com/privacy/` still says FormSubmit and owned Supabase intake both receive submissions.
3. Confirm live forms still point to `https://formsubmit.co/info@ihelpwithai.com`.
4. Run:

   ```bash
   node scripts/smoke-owned-intake.mjs --endpoint "https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake" --origin "https://ihelpwithai.com"
   ```

5. Confirm:
   - valid `form_submission` returns `202`
   - valid `shortlist_session` returns `202`
   - invalid payload is rejected
   - disallowed origin is rejected with `403`
6. Check Supabase tables for fresh fake rows in:
   - `leads`
   - `form_submissions`
   - `shortlist_sessions`
7. Confirm PostHog still carries only behavior metadata and not names, emails, phone numbers, addresses, or free-form message bodies.

## Periodic Operator-Run Checks

Recommended cadence:

- after any PR that touches `src/data/site-content.mjs`, `src/assets/site.js`, `src/assets/data-capture.js`, `supabase/functions/owned-intake/`, or GitHub Pages workflows
- weekly during the first live rollout period
- immediately after any unexpected form, shortlist, or analytics complaint

What to check:

- GitHub Pages deployment succeeded for the merge SHA
- live endpoint and allowed host still match production
- FormSubmit actions remain unchanged
- owned intake still inserts fake smoke rows
- disallowed origins still fail
- Supabase logs do not show sustained 4xx or 5xx spikes

## Incident Rollback

If owned intake starts failing noisily, writing bad rows, or accepting suspicious traffic:

1. Set `site.ownedDataEndpoint` to `""` in `src/data/site-content.mjs`.
2. Set `site.ownedDataAllowedHosts` to `[]`.
3. Run:

   ```bash
   npm run build
   npm run check:owned-intake-config
   npm run qa:live
   ```

4. Push the rollback to `main` so GitHub Pages redeploys the static site.
5. Re-check live `assets/site-data.js` until the endpoint is blank and allowed hosts are empty.
6. Leave FormSubmit live throughout the incident.

Rollback does not require changing Supabase secrets or removing FormSubmit.

## Fake Smoke-Row Cleanup

Only clean up fake verification rows after the verification report is captured.

Current fake markers:

- leads: `test+owned-intake-...@example.com`
- shortlist sessions: `smoke-...`

Use `docs/owned-intake-fake-smoke-cleanup.sql` for the canonical cleanup command.

Canonical cleanup SQL:

```sql
begin;

delete from form_submissions
where lead_id in (
  select id
  from leads
  where email like 'test+owned-intake-%@example.com'
);

delete from shortlist_sessions
where anonymous_id like 'smoke-%';

delete from leads
where email like 'test+owned-intake-%@example.com';

commit;
```

## Supabase Logs To Check

For owned intake, check:

- Edge Function logs for `owned-intake`
- recent `403` counts for disallowed origins
- recent `400` counts for malformed or unsupported payloads
- any `500` spikes or repeated `Owned intake failed` entries

What healthy behavior looks like:

- `202` responses for valid `form_submission` and `shortlist_session`
- occasional `400` responses from bad payloads during testing or bot noise
- occasional `403` responses from disallowed origins
- near-zero `500` responses during normal traffic

## Expected Status Patterns

- `202`: accepted and stored by the owned-intake function
- `400`: malformed JSON, unsupported payload type, or missing required data
- `403`: origin rejected by the function guard
- `405`: wrong HTTP method
- `413`: payload too large
- `500`: unexpected storage or runtime failure and worth immediate review

## Rollback Trigger Conditions

Rollback should be considered when any of these happen:

- repeated `500` errors over a short window instead of isolated failures
- valid smoke payloads stop returning `202`
- suspicious origins begin succeeding instead of returning `403`
- duplicate lead growth resumes after the dedupe migration is applied
- writes start landing with obviously broken normalization or missing expected lead links

## Hardening Follow-Ups

Recommended next improvements:

- add alerting or a lightweight dashboard for sustained `500` spikes and unusual `403` growth
- document a regular cadence for cleaning only clearly test-marked smoke rows
