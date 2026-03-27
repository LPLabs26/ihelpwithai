# ihelpwithai.com directory

This project is the static MacBook-hosted source for the live ihelpwithai.com directory.

## What is included

- `index.html` — homepage shell for the interactive directory
- `tools-starter.json` — canonical tool and company data
- `scripts/build-site.mjs` — generates `data.js`, tool pages, CSV, sitemap, and syncs `public/`
- `tools/` — generated tool detail pages
- `affiliate-disclosure.html` — public disclosure page
- `OWNER_AFFILIATE_PLAYBOOK.md` — private owner notes for partner program signup

## How to update the site

1. Edit [`tools-starter.json`](/Users/jorgesanchez/Desktop/IHWAI/tools-starter.json).
2. Run `npm run build`.
3. Deploy the [`public`](/Users/jorgesanchez/Desktop/IHWAI/public) folder to Netlify.

## How monetization works

- Keep `officialUrl` for the default public destination.
- Add your approved tracking link to `affiliateUrl` when you have one.
- The site will automatically switch the CTA to the partner link and mark it with sponsored link attributes.
- Use [`OWNER_AFFILIATE_PLAYBOOK.md`](/Users/jorgesanchez/Desktop/IHWAI/OWNER_AFFILIATE_PLAYBOOK.md) to track which programs to apply for.

## Content principles

- Start with the job to be done.
- Explain the tool in plain English.
- Say who it is for.
- Show one real use case.
- Include honest watch-outs.
