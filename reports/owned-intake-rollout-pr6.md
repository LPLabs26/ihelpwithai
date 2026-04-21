# Owned Intake Rollout PR6

## Summary

This PR adds the rollout safety layer on top of the PR #5 owned-intake foundation.

What is now in the repo:

- an operator-first rollout checklist in `docs/owned-intake-rollout.md`
- a direct endpoint smoke tester in `scripts/smoke-owned-intake.mjs`
- a production config validator in `scripts/check-owned-intake-config.mjs`
- a repeatable deployment helper in `scripts/deploy-owned-intake.sh`
- expanded GitHub Actions checks with Node 24 and Deno validation

## Changed files

- `.github/workflows/pr-build.yml`
- `.github/workflows/deploy-github-pages.yml`
- `package.json`
- `docs/supabase-setup.md`
- `docs/owned-intake-rollout.md`
- `scripts/check-owned-intake-config.mjs`
- `scripts/smoke-owned-intake.mjs`
- `scripts/deploy-owned-intake.sh`
- `reports/live-site-qa.md`
- `reports/live-site-qa.json`
- `reports/owned-intake-rollout-pr6.md`

## What is automated now

- `npm run check:owned-intake-config` validates source config, generated site data, endpoint safety rules, and FormSubmit persistence.
- `npm run smoke:owned-intake` runs direct POST smoke tests against a deployed owned-intake endpoint.
- `scripts/deploy-owned-intake.sh` verifies `verify_jwt = false`, sets function secrets, deploys the function, and runs smoke tests when secure Supabase access is available.
- PR checks now run the owned-intake config validator, Node script syntax checks, and `deno check supabase/functions/owned-intake/index.ts`.
- Pages deploy now runs the owned-intake config validator and Node script checks before uploading `public/`.

## Endpoint status

Frontend owned capture remains disabled in this PR.

- `site.ownedDataEndpoint` is still `""`
- `site.ownedDataAllowedHosts` is still `[]`

That is intentional because the production Supabase function URL is still unknown in this environment and no direct smoke test against a real deployed endpoint has been completed here.

## Tests run

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
- `PATH=/tmp/deno-install/bin:$PATH deno check supabase/functions/owned-intake/index.ts`

## Security and privacy checks

- FormSubmit remains the live action for starter-pack, contact, and vendor forms.
- Owned capture remains fail-open and does nothing while the endpoint is blank.
- No client-side Supabase writes were added.
- PostHog remains behavior-only.
- No PII was added to analytics payloads.
- `verify_jwt = false` remains scoped only to `functions.owned-intake` in `supabase/config.toml`.
- The rollout doc and deploy helper both treat secrets as environment-only values.

## Secrets check

Checks run in this environment:

- `git ls-files | rg '(^|/)\\.env($|\\.)|(^|/)env\\.(local|production|development)|(^|/)\\.envrc$'`
- `git grep -nE 'sb_secret_[A-Za-z0-9]+|postgres(ql)?://[A-Za-z0-9]' -- .`

Result:

- no tracked `.env` files
- no committed Supabase keys
- no committed database connection strings

## Remaining blocker

Supabase deployment was not performed in this PR because this environment does not currently have:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- Supabase CLI installed/authenticated
- secure SQL access for `docs/supabase-schema.sql`

## Exact next instruction for Codex after this PR merges

If the secure deployment environment becomes available, the next Codex step is:

1. Run `scripts/deploy-owned-intake.sh` with secure environment variables.
2. Confirm direct smoke tests pass against the real production endpoint.
3. If they pass, open PR #7 to enable `site.ownedDataEndpoint` and `site.ownedDataAllowedHosts` with the tested production values while keeping FormSubmit live.

If secure deployment access is still missing, the one secure access item needed is:

`A secure deployment environment that already contains SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, and secure SQL access for docs/supabase-schema.sql. Do not paste service-role keys or database passwords into chat.`
