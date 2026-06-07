# ihelpwithai.com backend — emails + skills repository

This is what makes the site *actually work* (email delivery + saved skills).
The static site can't do it alone; it runs on Supabase + a small worker.

## The two repositories

- **Emails** → `submissions` table. Every email + URL someone enters is stored
  here with its status. **Private (owner-only)** — row-level security blocks
  public access, so emails are never exposed on the site. Export them anytime
  from the Supabase dashboard (Table editor → submissions → Export CSV).
- **Built skills** → `skills` table + `skills` storage bucket. The Skill
  Library reads these through `public_skills`, a view that exposes only safe
  fields (name, description, category, source, date) — **no emails**.

Run `schema.sql` once in the Supabase SQL editor to create both.

## How data flows

1. Visitor submits URL + email on the homepage → edge function inserts a row in
   `submissions` (the email is now saved).
2. The Python worker (engine) picks up the job, builds + verifies the skill.
3. On success: worker uploads the `.skill` to storage, inserts a row in
   `skills`, sets `submissions.status = verified`, and emails the visitor a link.
4. On failure after retries: status = `needs_review`, the visitor gets a
   "couldn't verify" email — never a broken skill presented as working.
5. The Skill Library auto-shows the new skill (it reads `public_skills`).

## Wiring the library to live data

In `skills/index.html` set:

```js
const SKILLS_SOURCE = "https://YOURPROJECT.supabase.co/rest/v1/public_skills?select=*";
```

(Add your anon key via a header if your project requires it.) Until then it
reads the bundled `skills/skills.json` sample so the page works today.

## Still required before going live

- An AI key on the worker (Anthropic / OpenAI) — the engine can't run without one.
- The rate-limit guard in the edge function (you pay per conversion).
- A transactional email provider (Resend / Postmark) with your domain verified.

Full edge-function + worker code is in the engine project's
`web/BACKEND_WIRING.md`.
