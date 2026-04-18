# ihelpwithai.com

Static source for the rebuilt contractor-first ihelpwithai.com site.

The current direction is a buyer's guide and decision engine for contractor and field-service businesses. The site is built around trade fit, business bottlenecks, shortlist logic, reviews, and compare pages rather than a broad AI directory.

## Source of truth

The main editable source files are:

- `src/data/site-content.mjs` — structured site content, review data, comparisons, templates, learn content, and trust pages
- `src/assets/site.css` — design system and page styling
- `src/assets/site.js` — shortlist logic, nav behavior, CTA tracking, and template copy actions
- `scripts/build-site.mjs` — generates the root site output plus the deploy-ready `public/` mirror

## Generated output

Running the build regenerates:

- route directories such as `trades/`, `problems/`, `reviews/`, `compare/`, `templates/`, and `learn/`
- top-level redirect aliases such as `about.html` and `reviews.html`
- `assets/site-data.js`
- `robots.txt`
- `sitemap.xml`
- the full deploy-ready `public/` mirror

Treat generated route output as build artifacts. Update the source layer under `src/` and regenerate instead of hand-editing generated pages.

## Local workflow

1. Update the source data or frontend assets.
2. Run `npm run build`.
3. Review the generated diff in both the repo root and `public/`.
4. Preview with a local static server if needed.
5. Push through the existing GitHub Pages flow once the diff is ready.

## Build command

```bash
npm run build
```

This runs `node scripts/build-site.mjs`.

## Deployment

Deployment remains static and still publishes from `public/`.

- GitHub Pages workflow: `.github/workflows/deploy-github-pages.yml`
- Custom domain file: `CNAME`
- Jekyll bypass: `.nojekyll`
- Static-host compatibility: `public/` contains the deploy-ready mirror
- Netlify compatibility: `netlify.toml` still points at `public/`

## Content principles

- Start with the contractor bottleneck, not the tool catalog.
- Say who a tool is for and who it is not for.
- Keep setup reality and pricing posture visible.
- Prefer high-intent guidance over breadth.
- Keep the tone practical, specific, and anti-hype.
