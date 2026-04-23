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

## Periodic Manual Checks

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

Example cleanup SQL:

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

## Hardening Follow-Ups

Recommended next improvements:

- add a normalized email column or a unique functional index for dedupe
- replace select-then-insert lead handling with a true upsert path
- add a short recurring verification checklist to the operator docs
- add lightweight monitoring guidance for Supabase function errors and rejected origins
