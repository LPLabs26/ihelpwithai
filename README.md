# ihelpwithai.com

Static source for the ihelpwithai.com website.

The site is a curated AI tool directory for non-technical buyers. It is intentionally job-to-be-done driven: the goal is to help someone choose the right tool faster, not catalog every AI product on the internet.

## Source of truth

The main editable source files are:

- `tools-starter.json` — canonical tool/company data
- `comparisons.json` — comparison-page definitions
- `index.html` — homepage shell and static sections
- `app.js` — homepage filtering, matcher, and mailto flows
- `tool.js` — tool-detail prompt builder logic
- `styles.css` — global styling
- `scripts/build-site.mjs` — generates static pages and deploy output

## Generated artifacts

Running the build regenerates:

- `data.js`
- `tools/*.html`
- `guides/*.html`
- `comparisons/*.html`
- `best-free-ai-tools.html`
- `editorial-methodology.html`
- `tools-starter.csv`
- `sitemap.xml`
- `public/` mirror for deployment

Treat generated files as build output. Do not hand-edit generated tool, guide, comparison, or deploy-mirror files unless you are fixing an emergency and intend to regenerate immediately afterward.

## Local workflow

1. Edit content or UX files.
2. Run `npm run build`.
3. Review the generated diff.
4. Preview locally if needed.
5. Deploy the updated `public/` output through the active hosting flow.

## Build command

```bash
npm run build
```

This runs `node scripts/build-site.mjs`.

## Deployment

This repo is prepared for static deployment.

- GitHub Pages workflow: `.github/workflows/deploy-github-pages.yml`
- Custom domain file: `CNAME`
- Jekyll bypass: `.nojekyll`
- Static-host compatibility: `public/` contains the deploy-ready mirror
- Netlify compatibility: `netlify.toml` still points at `public/`

Because production history has involved more than one hosting path, always confirm the active production target before assuming a push to `main` is what updates the live site.

## Maintenance docs

- `GITHUB_PAGES_MIGRATION.md` — deployment audit and GitHub Pages notes
- `docs/maintenance-playbook.md` — repeatable maintenance workflow for content, UX, build, and release work

## Content principles

- Start with the job to be done.
- Explain tools in plain English.
- Be specific about who each tool is for.
- Show one real use case.
- Keep watch-outs visible.
- Prefer shortlist quality over directory size.
