# Deploy the new ihelpwithai.com site

This `site/` folder is the **complete new site** — ihelpwithai.com only. It replaces
your current ihelpwithai.com content. It's static, so GitHub Pages serves it
as-is (no build step). I can't push to your repo from here, so you run these
steps.

## What's in here

```
site/
  index.html            ihelpwithai.com home + email-capture tool (demo mode)
  skills/
    index.html          Skill Library (searchable gallery + downloads)
    skills.json         sample data (replace with live backend later)
  privacy.html  terms.html  contact.html  404.html
  assets/ihelpwithai.css   shared navy/amber theme
  assets/favicon.svg
  backend/
    schema.sql          Supabase tables: emails (private) + skills (library)
    README.md           how the email + skill repository works
  CNAME  .nojekyll  robots.txt  sitemap.xml
```

## Publish (replaces the old site)

```bash
cd /path/to/your/ihelpwithai      # your site repo
git checkout main && git pull

# Optional safety: keep the old site on a branch first
git checkout -b backup-old-site && git checkout main

# Replace site contents — but KEEP .git and the Pages deploy workflow
git rm -rqf . ':!.github'           # remove old files, preserve .github/
cp -R /path/to/skill-builder/site/. .   # copy new site in (note the trailing /.)

git add -A
git commit -m "Rebuild site as ihelpwithai.com (tool + skill library)"
git push origin main
```

> Important: don't delete `.github/workflows/` — that's what publishes your site
> to GitHub Pages. The `':!.github'` above preserves it.

GitHub Pages redeploys in ~1 minute at **https://ihelpwithai.com/**.

## What works immediately vs. later

- **Now (free):** the site looks done. The home form runs in DEMO mode
  (validates + previews the email flow, sends nothing). The Skill Library shows
  the two sample skills from `skills.json`.
- **To make it real (needs setup):**
  1. Run `backend/schema.sql` in Supabase (creates the email + skill stores).
  2. Stand up the engine worker with an AI key (see the engine project's
     `web/BACKEND_WIRING.md`).
  3. In `index.html`, set `ENDPOINT` to your Supabase function URL.
  4. In `skills/index.html`, set `SKILLS_SOURCE` to your `public_skills` URL.
  5. Turn on the rate-limit guard + email provider before sharing publicly.

## The two repositories you asked for

- **Emails** are saved in the `submissions` table — private, owner-only, export
  as CSV from the Supabase dashboard. Never shown on the site.
- **Built skills** are saved in the `skills` table + storage bucket and appear
  automatically in the Skill Library.
