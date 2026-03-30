# ihelpwithai familiarity report

Date: 2026-03-29
Repo inspected: `/Users/jorgesanchez/Documents/ihelpwithai`
Git remote: `https://github.com/lplabs26/ihelpwithai.git`

## What this repo is
A static AI tools directory site for **ihelpwithai.com**.

The repo is set up as a generated static site:
- source content lives mainly in `tools-starter.json`, `comparisons.json`, `index.html`, `app.js`, `styles.css`
- `scripts/build-site.mjs` generates:
  - `data.js`
  - `tools/*.html`
  - `guides/*.html`
  - `comparisons/*.html`
  - `tools-starter.csv`
  - `sitemap.xml`
  - mirrored deploy output in `public/`

## Current structure snapshot
- `index.html` — homepage and main directory UX
- `app.js` — client-side rendering, filters, prompt builder, mailto forms, URL state
- `styles.css` — site styling
- `tool.js` — tool-detail-page interactions
- `tools-starter.json` — canonical tool dataset
- `comparisons.json` — comparison-page dataset
- `scripts/build-site.mjs` — static build/generation pipeline
- `tools/` — generated tool detail pages
- `guides/` — generated goal-based guide pages
- `comparisons/` — generated comparison pages
- `public/` — deploy-ready static output, including redirect folders for clean URLs
- `.github/workflows/deploy-github-pages.yml` — GitHub Pages deployment workflow

## Current content footprint
- 31 tool pages in `tools/`
- 13 goal guide pages in `guides/`
- 9 comparison pages in `comparisons/`
- 13 goals represented in the dataset:
  - Automation
  - Design
  - Meetings
  - Presentations
  - Productivity
  - Research
  - SEO
  - Sales
  - Support
  - Training
  - Video
  - Voice
  - Writing

## Major site sections on the homepage
From `index.html`:
- Hero/search
- Popular starting points
- 3-question shortlist matcher
- Featured tools
- Prompt Lab
- Filterable directory
- Goal-specific guides
- Comparison pages
- Browse by company
- "Get help" and "Suggest a tool" forms

## How the site currently works
- Main data source: `tools-starter.json`
- The homepage is mostly a shell; `app.js` hydrates counts, cards, filters, guides, comparisons, and companies from `data.js`
- Detail pages, guides, and comparisons are generated statically by `scripts/build-site.mjs`
- The contact forms are currently **mailto forms** in `index.html`/`app.js`, not live hosted form submissions
- `public/` includes redirect folders like:
  - `public/tools/<slug>/index.html`
  - `public/guides/<slug>/index.html`
  - `public/comparisons/<slug>/index.html`

## Docs already in repo
- `README.md` — short operational overview
- `GITHUB_PAGES_MIGRATION.md` — migration notes and blockers
- `OWNER_AFFILIATE_PLAYBOOK.md` — partner program tracking / monetization notes

## Things that look solid
- Clear static-site architecture with one canonical dataset
- Build script is straightforward and understandable
- Good basic SEO scaffolding: sitemap, per-page titles/descriptions, some schema, redirect folders
- The homepage information architecture is already strong for a directory site
- The mailto fallback avoids dead Netlify-only forms after GitHub Pages migration

## Things that look unfinished or worth tightening
1. **README path drift / repo rename residue**
   - `README.md` still points to `/Users/jorgesanchez/Desktop/IHWAI/...`
   - actual inspected repo is `/Users/jorgesanchez/Documents/ihelpwithai`
   - this is confusing for future maintenance

2. **Affiliate system is wired, but not populated yet**
   - `affiliateUrl` appears unused right now across the dataset
   - the monetization infrastructure exists, but no tools currently seem to be using partner links

3. **Affiliate program metadata is partial**
   - many tools are missing `affiliateProgramUrl` entries in `tools-starter.json`
   - not blocking the site, but it limits owner-side monetization tracking

4. **No obvious automated validation/tests**
   - build script does some validation (duplicate slugs, bad comparison references)
   - but there is no broader content QA, linting, or broken-link check visible

5. **Company count currently equals tool count**
   - each tool appears to have a unique company in the current dataset
   - that means the “browse by company” section may not add much differentiation yet

## Small high-value next additions
If improving this repo without a major redesign, these look like the best next moves:

1. **Fix README and docs paths first**
   - lowest-risk cleanup
   - removes confusion about whether the active repo is `Desktop/IHWAI` or `Documents/ihelpwithai`

2. **Add a simple content QA script**
   - check for missing required fields, duplicate companies, missing affiliate metadata, and bad internal links
   - run it before `npm run build`

3. **Add a few more comparison pages**
   - likely strong SEO + decision-stage value
   - especially around popular “vs” searches that match existing tools in the dataset

4. **Add last-reviewed freshness surfacing on homepage cards**
   - the data already has `reviewedAt`
   - exposing freshness can improve trust without much engineering work

5. **Add a small editorial note or methodology page**
   - explain how tools get selected, how “featured” works, and how recommendations are reviewed
   - good trust/SEO win, small scope

## Other ihelpwithai-related folders found on this machine
These appear to be older builds, exports, or prototypes, not the main git repo I inspected:
- `/Users/jorgesanchez/Documents/ihelpwithai_site`
- `/Users/jorgesanchez/Documents/ihelpwithai_refined_build`
- `/Users/jorgesanchez/Documents/ihelpwithai_refined_build 2`
- `/Users/jorgesanchez/Documents/ihelpwithai_refined_build 3`
- `/Users/jorgesanchez/Documents/ihelpwithai_directory`
- `/Users/jorgesanchez/Desktop/IHWAI/.tmp-export/ihelpwithai-directory`
- `/Users/jorgesanchez/Desktop/IHWAI/ihelpwithai-preview.html`

## Bottom line
The active repo at `/Users/jorgesanchez/Documents/ihelpwithai` is already a respectable static directory site with a clean generator and decent content coverage.

The biggest obvious gaps are not architecture problems. They are mostly:
- path/documentation cleanup
- monetization metadata completion
- more comparison/editorial content
- lightweight QA/validation
