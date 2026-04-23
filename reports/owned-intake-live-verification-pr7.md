# Owned Intake Live Verification After PR #7

## Summary

- PR #7 merged into `main` on April 22, 2026 at 9:36:38 PM PDT.
- PR #7 merge SHA: `75908b37a646199e20eac9c189b33cd89fdb1d17`
- GitHub Pages deploy run `24816998275` completed successfully for that SHA on April 22, 2026 at 9:37:08 PM PDT.
- Deploy run URL: `https://github.com/LPLabs26/ihelpwithai/actions/runs/24816998275`

## Live Site Verification

Verified on the live site:

- `https://ihelpwithai.com/assets/site-data.js` contains:
  - `ownedDataEndpoint = "https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake"`
  - `ownedDataAllowedHosts = ["fiopwsdzcbmjcbpkdxwr.supabase.co"]`
- `https://ihelpwithai.com/privacy/` says submissions may be received through FormSubmit and email delivery and through the owned Supabase intake and database.
- The privacy page also says FormSubmit remains live in parallel.
- Live forms still point to `https://formsubmit.co/info@ihelpwithai.com` on:
  - `/contact/`
  - `/for-vendors/`
  - `/starter-pack/`
  - `/beauty/starter-pack/`
- No live FormSubmit submission was sent during this pass. FormSubmit continuity was verified through the live form action attributes.
- The live shortlist flow still ships owned capture code through `window.IHWAI_DATA_CAPTURE.captureShortlist(...)`.

## Supabase Smoke Result

Direct smoke was re-run against the production endpoint after merge:

```bash
node scripts/smoke-owned-intake.mjs --endpoint "https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake" --origin "https://ihelpwithai.com"
```

Result:

- valid `form_submission`: `202`
- valid `shortlist_session`: `202`
- invalid payload rejected: `400`
- disallowed origin rejected: `403 Origin not allowed`

Fresh fake test rows landed in the expected tables:

- `leads`
  - `test+owned-intake-1776919146756@example.com`
- `form_submissions`
  - `field_starter_pack`
  - source page `/starter-pack/`
  - lead id `ddc4a02b-8113-4cba-9bff-8e11c93fd007`
- `shortlist_sessions`
  - anonymous id `smoke-1776919146756`
  - vertical `beauty`

## PostHog PII Check

Verified from the live `assets/site.js` bundle:

- analytics payloads still use behavior-only event metadata
- lead-form analytics still limit payloads to path, form type, vertical, trade, business type, and bottleneck
- analytics code does not add names, email addresses, phone numbers, street addresses, or free-form message bodies to PostHog payloads

## Test Data Cleanup

- No cleanup performed during this pass.
- Fake verification rows were left in place because they are clearly test-marked:
  - emails use `test+owned-intake-...@example.com`
  - shortlist rows use `smoke-...`

## Remaining Follow-Up Items

- add lead dedupe hardening:
  - normalized email column or unique functional index
  - true upsert instead of select-then-insert
- add lightweight recurring verification automation if desired without removing FormSubmit
- keep `tool_intent_event` unwired for now
