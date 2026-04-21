# Supabase Intake PR5

## What this PR adds

- A secure Supabase Edge Function at `supabase/functions/owned-intake/index.ts`
- Repo-level Deno config at `deno.json` so `deno check supabase/functions/owned-intake/index.ts` can resolve npm imports
- Shared payload validation and origin helpers in `supabase/functions/owned-intake/shared.mjs`
- Repeatable function config in `supabase/config.toml` with JWT verification disabled for this public endpoint
- A lightweight validation script at `scripts/validate-owned-intake.mjs`
- Frontend endpoint guards so owned capture only runs for approved HTTPS hosts
- Updated Supabase rollout docs for deploy, secrets, origins, and enablement

## What stays the same

- GitHub Pages remains the live static site host.
- FormSubmit remains the live form action for starter-pack, contact, and vendor flows.
- Thank-you redirects remain unchanged.
- PostHog remains behavior analytics only.

## Security guardrails in this PR

- No client-side Supabase writes were added.
- The Edge Function accepts `POST` JSON only and handles `OPTIONS` for CORS.
- CORS is restricted to approved origins.
- Unsupported methods, malformed JSON, oversized payloads, and unsupported payload types are rejected.
- Service-role access stays inside the function runtime only.
- The frontend helper requires both an HTTPS endpoint and an approved host allowlist before any owned payload is sent.
- If the hidden honeypot field is filled, owned capture is skipped entirely and the normal form flow continues.

## Payloads covered now

- `form_submission`
- `shortlist_session`

`tool_intent_event` is left for future scope so this rollout stays narrower and easier to validate.

## Manual rollout steps

1. Deploy the `owned-intake` Edge Function.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the function environment.
3. Set allowed-origin config for production, and only add a dev origin if needed.
4. Run `deno check supabase/functions/owned-intake/index.ts` if it was not already run in local development.
5. Test direct function requests first.
6. Then enable `site.ownedDataEndpoint` with the full function URL and `site.ownedDataAllowedHosts` with the hostname only.
7. Rebuild and deploy the static site.
8. Verify FormSubmit and owned intake both work in parallel.

## Risks to watch

- Misconfigured origins could block browser writes.
- A wrong endpoint host could keep owned capture disabled on purpose.
- Schema drift between docs and the actual Supabase project would break inserts.
- FormSubmit should not be removed until owned intake has been proven stable in production.

## Local validation note

- `deno` was not available in the local environment for this PR.
- The shared validator logic was exercised through `node scripts/validate-owned-intake.mjs`.
- The pull request workflow now runs `deno check supabase/functions/owned-intake/index.ts` so the Edge Function is validated in GitHub before merge.
- `deno.json` enables Deno npm resolution for the Supabase client import.
- Static-site checks and live QA were still run from the existing repo toolchain.
