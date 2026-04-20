# Data Architecture

## Current state

Today the site stack is intentionally split across static delivery, behavior analytics, and email-based lead handling.

- The site is a static GitHub Pages deployment generated from this repo.
- Live forms still post to FormSubmit and arrive through `info@ihelpwithai.com`.
- PostHog handles behavior analytics and funnel-style event tracking.
- There is no owned lead database yet, so lead records, shortlist outcomes, and tool-intent context are not stored in a first-party system.

## Target state

The long-term goal is a cleaner ownership split between analytics, operational data, and follow-up tooling.

- GitHub Pages continues to serve the static marketing site.
- Supabase becomes the owned source of truth for leads, form submissions, shortlist sessions, and tool-intent events.
- A secure Edge Function or another server-side intake endpoint sits between the browser and Supabase.
- PostHog remains the behavior analytics layer for page views, funnel steps, and outbound intent.
- Email delivery and a future CRM or lifecycle tool handle follow-up sequences and notifications.

## Why PostHog should not be the CRM

- PostHog is good at product analytics, event funnels, and behavior trends.
- It is not designed to be the long-term source of truth for lead records, outreach state, notes, or contact lifecycle management.
- Analytics tooling should avoid storing personal contact data when category-level behavior data is enough.
- Sending names, emails, phone numbers, or free-text form content into analytics increases privacy risk without creating a clean operational lead system.

## Why Supabase should become the owned source of truth

- Supabase can store structured lead and shortlist data in a schema the team controls.
- It creates a clean bridge from static-site forms into future email, CRM, or operations workflows.
- The data model can separate behavior analytics from contact records and consent-aware follow-up.
- The same data layer can support lead dashboards, shortlist history, tool-intent scoring, and future internal ops tooling without changing the static frontend architecture.

## Recommended migration path

1. Add schema, docs, and config hooks in the site repo.

2. Create the Supabase project manually.

3. Add a Supabase Edge Function or another secure serverless intake endpoint.

4. Test owned intake while keeping FormSubmit live in parallel.

5. Decide whether to keep FormSubmit as an email backup or replace it after the owned flow is proven stable.
