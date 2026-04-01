# ihelpwithai.com maintenance playbook

This is the repeatable workflow for building, updating, reviewing, and releasing the site.

## 1. Know the architecture

This is a static site.

Primary editable files:
- `tools-starter.json`
- `comparisons.json`
- `index.html`
- `app.js`
- `tool.js`
- `styles.css`
- `scripts/build-site.mjs`

Generated output:
- `data.js`
- `tools/*.html`
- `guides/*.html`
- `comparisons/*.html`
- `best-free-ai-tools.html`
- `editorial-methodology.html`
- `tools-starter.csv`
- `sitemap.xml`
- `public/`

Rule: edit source files first, then rebuild. Avoid hand-editing generated files.

## 2. Common task types

### A. Add or update a tool

Edit: `tools-starter.json`

Typical fields you will touch:
- `name`
- `slug`
- `company`
- `companySummary`
- `category`
- `goals`
- `audience`
- `difficulty`
- `pricing`
- `officialUrl`
- `affiliateUrl`
- `affiliateProgramUrl`
- `partnerStatus`
- `summary`
- `whatFor`
- `who`
- `useCase`
- `why`
- `watchOuts`
- `firstPrompt`
- `reviewedAt`
- `tags`

After editing, run:

```bash
npm run build
```

Then verify:
- generated tool page looks right
- guide pages changed as expected
- homepage filters still behave correctly
- sitemap updated

### B. Add or update a comparison page

Edit: `comparisons.json`

Each comparison should have:
- `slug`
- `title`
- `summary`
- `question`
- `quickTake`
- `tools`
- `decisionRules`

After editing, run:

```bash
npm run build
```

Then verify:
- referenced tool slugs are valid
- comparison page renders correctly
- comparison-page navigation and links still make sense

### C. Change homepage UX or copy

Usually edit one or more of:
- `index.html`
- `app.js`
- `styles.css`

Typical examples:
- navigation changes
- new call-to-action blocks
- filter behavior
- matcher logic
- directory ranking or shortlist behavior
- help-form copy changes

After editing, run:

```bash
npm run build
```

Even if the change is homepage-only, rebuild so `public/` stays in sync.

### D. Change generated-page behavior

Edit:
- `scripts/build-site.mjs`

Use this for:
- tool page layout/content structure
- guide page layout/content structure
- comparison page layout/content structure
- generated trust pages like best-free or methodology
- sitemap changes
- deploy mirror changes

After editing, run:

```bash
npm run build
```

Then inspect a sample of each affected page type.

## 3. Build workflow

Run:

```bash
npm run build
```

Expected result:
- build completes without errors
- generated files update
- `public/` mirrors the new output

If build fails:
- check JSON syntax first
- check duplicate slugs in `tools-starter.json`
- check invalid comparison tool references in `comparisons.json`
- check template-string syntax in `scripts/build-site.mjs`

## 4. Pre-release review checklist

Before shipping any change:

- review `git diff --stat`
- sanity-check large generated diffs
- open and inspect:
  - homepage
  - one tool page
  - one guide page
  - one comparison page
  - `best-free-ai-tools.html`
  - `editorial-methodology.html`
- confirm `robots.txt` and `sitemap.xml` still exist
- confirm no accidental copy regressions in nav or hero sections

## 5. Production drift check

If the live site seems different from the repo:

1. Compare the live homepage title and nav with local output.
2. Check for live-only pages or links.
3. Decide whether to:
   - restore those pages in repo,
   - replace them with better equivalents, or
   - intentionally retire them and remove inbound references.
4. Update the build and docs so the repo becomes the clear source of truth.

## 6. Deployment checklist

Before deploy:
- run `npm run build`
- review the diff
- make sure generated output is committed if that is the chosen release pattern
- confirm active production host

After deploy:
- open homepage
- open one tool page
- open one guide page
- open one comparison page
- open best-free page
- open methodology page
- verify no broken styling or missing assets

## 7. Content standards

Every tool entry should answer:
- what is it for?
- who should use it?
- one real use case
- why it made the directory
- what are the watch-outs?
- what is a good first prompt?

Writing style:
- plain English
- specific over clever
- useful over exhaustive
- trust-building over hype

## 8. Safe editing rules

- Do not manually edit `public/` unless it is an emergency.
- Do not manually edit generated tool, guide, or comparison pages as the normal workflow.
- Prefer changing source data or generator code.
- Rebuild immediately after any source change.
- Treat deployment docs as part of the product: stale docs cause release mistakes.

## 9. Quick command reference

Build:

```bash
npm run build
```

Preview locally:

```bash
cd public && python3 -m http.server 8000
```

Then open:
- `http://localhost:8000`

Git status:

```bash
git status --short
```

Diff summary:

```bash
git diff --stat
```
