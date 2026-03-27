# GitHub Pages Migration

This site is ready to deploy on GitHub Pages as a static build.

## What is already prepared

- GitHub Pages workflow: `.github/workflows/deploy-github-pages.yml`
- Custom domain file: `CNAME`
- Jekyll bypass file: `.nojekyll`
- Build output already includes redirect folders for old clean URLs such as:
  - `/affiliate-disclosure`
  - `/thanks`
  - `/tools/<slug>`
  - `/guides/<slug>`
  - `/comparisons/<slug>`

## Remaining blockers

1. This folder is now initialized as a local Git repo and points to `https://github.com/ihelpwithai/website.git`, but it has not been pushed yet.
2. GitHub authentication is not set up on this MacBook.
3. GitHub Pages still needs to be enabled for the repo to use `GitHub Actions`.
4. Wix DNS still points `ihelpwithai.com` at Netlify.
5. The two contact forms are Netlify forms and will not submit on GitHub Pages without a replacement form backend.

## Recommended next steps

1. Push this folder to `ihelpwithai/website` on the `main` branch.
2. In the GitHub repo settings, enable Pages using `GitHub Actions`.
3. In Wix DNS, replace the current Netlify records with the GitHub Pages records for your repo and keep the custom domain as `ihelpwithai.com`.
4. Decide how to replace the two Netlify forms before cutover.

## Form warning

These forms currently depend on Netlify:

- `tool-match-request`
- `tool-suggestion`

If the site is moved to GitHub Pages without replacing them, those forms will stop working.
