# Data Layer Prep

## What was added

This PR is the prep layer only. It adds schema, docs, config hooks, and a disabled-by-default owned-data helper while keeping the current production form flow unchanged.

- `docs/data-architecture.md` to document the current split between GitHub Pages, FormSubmit, PostHog, and the future owned data layer.
- `docs/supabase-schema.sql` with a proposed schema for leads, form submissions, shortlist sessions, and tool-intent events.
- `docs/supabase-setup.md` with the recommended secure rollout path.
- `src/assets/data-capture.js` as a disabled-by-default helper for future owned intake.
- Source-level form metadata updates so starter-pack, contact, and vendor forms carry stable `data-form-type` values and hidden business-context fields.
- Privacy-page updates to explain the difference between form handling and behavior analytics more clearly.

## What is still manual

- Create the Supabase project.
- Pick the region.
- Run the proposed schema.
- Build the secure intake endpoint.
- Configure secrets outside the repo.
- Test owned intake before changing the live form action.
- Re-run live QA after this branch deploys, because `npm run qa:live` still validates the current production site on `main`.

## What PR #5 should do

- Implement the secure intake endpoint.
- Add request validation and normalization rules.
- Test starter-pack, contact, vendor, and shortlist writes into Supabase.
- Decide whether tool-intent writes should be turned on alongside form and shortlist intake.
- Add owner-facing verification notes for the Supabase test plan.

## Risks

- Direct client writes would be risky without RLS and carefully scoped policies.
- Mixing PII into analytics would create unnecessary privacy exposure.
- Replacing FormSubmit too early could break email-based lead delivery.

## Privacy guardrails

- PostHog remains behavior analytics only.
- Names, emails, phone numbers, company names, addresses, and free-text message content are not added to analytics payloads.
- The owned data helper is allowed to send form payloads only to the future owned endpoint, never to analytics.

## How FormSubmit remains active

- The live form `action` still points to FormSubmit.
- Thank-you redirects remain intact.
- The owned data helper is fail-open and does nothing while `ownedDataEndpoint` is blank.

## How Supabase would be tested later

1. Keep FormSubmit active.

2. Turn on the owned endpoint in a controlled environment.

3. Submit real starter-pack and contact tests.

4. Confirm data lands in Supabase and email delivery still works.

5. Review payload shape, consent fields, and shortlist records before any broader rollout.
