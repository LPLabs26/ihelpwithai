# Google Search Console Setup

Use this checklist to make `ihelpwithai.com` Search Console-ready without inventing a verification token or changing the live indexing rules.

## 1. Verify The Site

Preferred:
- Verify the domain property for `ihelpwithai.com` in Google Search Console through DNS if you already control the DNS provider.

URL-prefix fallback:
- Verify `https://ihelpwithai.com/` as a URL-prefix property.
- If Google gives you an HTML meta verification token, paste the real token into `site.googleSiteVerification` in [src/data/site-content.mjs](/Users/jorgesanchez/Documents/ihelpwithai/src/data/site-content.mjs).
- Leave that value blank until you have a real token. Do not add a fake token.

## 2. Submit The Sitemap

Submit:
- `https://ihelpwithai.com/sitemap.xml`

## 3. Use URL Inspection / Request Indexing

Request indexing for these pages first:
- `/`
- `/trades/`
- `/beauty/`
- `/shortlist/`
- `/beauty/shortlist/`
- `/reviews/jobber/`
- `/beauty/reviews/vagaro/`
- `/compare/jobber-vs-housecall-pro/`
- `/beauty/compare/vagaro-vs-glossgenius/`

## 4. Confirm Crawl Controls

Verify these before or during submission:
- `robots.txt` includes the sitemap line for `https://ihelpwithai.com/sitemap.xml`
- `/thank-you/` is still `noindex, nofollow`
- `/thank-you/` is not listed in `sitemap.xml`

## 5. Recommended First Checks Inside Search Console

After verification:
- Check the Coverage / Pages report for unexpected exclusions
- Check the Indexing report for the key hub pages above
- Watch the Performance report for branded queries, review pages, and compare pages

## 6. What Not To Change

Do not:
- add a fake Google verification token
- remove the thank-you noindex directive
- add `/thank-you/` back to the sitemap
