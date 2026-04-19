# Post-Launch Stabilization QA

## Build Result

- `npm run build` passed
- `node --check scripts/build-site.mjs` passed
- `node --check scripts/live-site-qa.mjs` passed
- `node --check src/assets/site.js` passed

## Live QA Result

- `npm run qa:live` passed after fixing the QA script to read live JS assets as text for analytics verification
- Verified live critical pages include the homepage, both vertical hubs, both shortlists, both starter-pack pages, targeted review pages, and targeted compare pages
- Verified on the live site:
  - HTTP 200 responses
  - title tags
  - meta descriptions
  - canonical tags
  - internal nav links
  - no visible `TODO`, `placeholder`, `undefined`, or `lorem ipsum`
  - `/thank-you/` remains `noindex, nofollow`
  - `sitemap.xml` excludes `/thank-you/`
  - `robots.txt` references `https://ihelpwithai.com/sitemap.xml`
- Local generated-output visible-text sweep also returned `0` hits for `TODO`, `placeholder`, `undefined`, and `lorem ipsum`

## Analytics Events Verified In Code

Confirmed in [src/assets/site.js](/Users/jorgesanchez/Documents/ihelpwithai/src/assets/site.js):
- `ihai_page_view`
- `ihai_home_cta_click`
- `ihai_shortlist_started`
- `ihai_shortlist_completed`
- `ihai_beauty_shortlist_started`
- `ihai_beauty_shortlist_completed`
- `ihai_starter_pack_form_started`
- `ihai_starter_pack_form_submitted`
- `ihai_beauty_starter_pack_form_started`
- `ihai_beauty_starter_pack_form_submitted`
- `ihai_review_cta_clicked`
- `ihai_beauty_review_cta_clicked`
- `ihai_compare_cta_clicked`
- `ihai_beauty_compare_cta_clicked`
- `ihai_outbound_tool_click`

## Analytics Privacy Audit

Manual code audit of [src/assets/site.js](/Users/jorgesanchez/Documents/ihelpwithai/src/assets/site.js) confirms:
- shortlist analytics send only business-fit properties such as trade, business type, team size, bottleneck, budget, setup tolerance, current stack, and vertical
- form analytics send only path, form type, trade, business type, and vertical where relevant
- outbound tool analytics send destination hostname only
- names, emails, phone numbers, addresses, messages, and free-text user input are not added as event properties

## Trust / Conversion Pages Deepened In This PR

Field Trades:
- `/reviews/jobber/`
- `/reviews/housecall-pro/`
- `/reviews/servicetitan/`
- `/reviews/callrail/`
- `/compare/jobber-vs-housecall-pro/`

Beauty & Wellness:
- `/beauty/reviews/vagaro/`
- `/beauty/reviews/glossgenius/`
- `/beauty/reviews/boulevard/`
- `/beauty/reviews/square-appointments/`
- `/beauty/compare/vagaro-vs-glossgenius/`

Each targeted page now carries stronger trust/conversion depth through pricing-check date, review basis, best-fit size guidance, switching difficulty, integrations / stack fit, clearer CTAs, and a potential monetization note.

## Manual Tests Still Required By Owner

- Confirm real starter-pack emails continue arriving in the true `info@ihelpwithai.com` inbox
- Check the PostHog dashboard for live event flow after a few real visits and clicks
- Manually review the deepest money pages on mobile for spacing and CTA balance
- Manually click through the updated top and bottom CTAs on the targeted review and compare pages

## Search Console Manual Steps

- Verify `ihelpwithai.com` in Google Search Console
- Submit `https://ihelpwithai.com/sitemap.xml`
- Use URL Inspection / Request indexing for:
  - `/`
  - `/trades/`
  - `/beauty/`
  - `/shortlist/`
  - `/beauty/shortlist/`
  - `/reviews/jobber/`
  - `/beauty/reviews/vagaro/`
  - `/compare/jobber-vs-housecall-pro/`
  - `/beauty/compare/vagaro-vs-glossgenius/`

## Notes

- Search Console verification support already exists at the source layer through `site.googleSiteVerification` in [src/data/site-content.mjs](/Users/jorgesanchez/Documents/ihelpwithai/src/data/site-content.mjs)
- That token remains blank in this PR because no real Google verification token was provided
