# Brand Logo Refresh

## Scope

- Added the new ihelpwithai.com brand logo, mark, favicon, Apple touch icon, and web manifest assets from the provided brand package.
- Replaced the text-style header brand with the horizontal transparent logo.
- Added favicon, Apple touch icon, web manifest, and theme-color metadata to the global generated head.
- Removed the stale root `assets/favicon.svg` copy path so generated pages no longer advertise the old SVG favicon.
- Added a reusable vendor-name pattern with local official-logo support and initials fallback.
- Added a vendor registry for promoted field-trades and Beauty & Wellness companies.
- Updated review cards, comparison cards, comparison tables, review alternatives, related comparison links, review page titles, comparison page titles, and shortlist result cards to use the vendor-name pattern.

## Official Vendor Logo Status

The brand package did not include official vendor logo files. Official first-party logo assets were added locally for these vendors:

- `src/assets/vendors/housecall-pro.svg`
- `src/assets/vendors/servicetitan.svg`
- `src/assets/vendors/nicejob.svg`
- `src/assets/vendors/zapier.svg`
- `src/assets/vendors/chatgpt.svg`
- `src/assets/vendors/vagaro.svg`
- `src/assets/vendors/glossgenius.svg`
- `src/assets/vendors/square-appointments.svg`
- `src/assets/vendors/boulevard.svg`
- `src/assets/vendors/booksy.svg`
- `src/assets/vendors/fresha.svg`
- `src/assets/vendors/mangomint.svg`
- `src/assets/vendors/canva.svg`

These use official vendor-owned pages, official brand pages, official media assets, or official CDN assets. PNG/WebP source logos are embedded into local SVG wrappers so the registry filenames stay stable and the site never hotlinks remote logos.

To avoid committing unofficial or scraped third-party assets, the site still renders clean initials fallbacks for these vendors:

- `src/assets/vendors/jobber.svg` - official homepage access was Cloudflare-blocked from the CLI and no first-party brand/media asset was verified.
- `src/assets/vendors/callrail.svg` - the official site references a `callrail-logotype.svg` path, but that path currently resolves to the app shell HTML rather than a usable logo file.
- `src/assets/vendors/openphone.svg` - the official OpenPhone site redirects to Quo, so a current first-party OpenPhone logo file was not verified without changing the displayed vendor name.

When official vendor-provided brand/media-kit SVG or PNG files are added with those filenames, the generator will render the image logos automatically.

## Source Notes

- Housecall Pro: official `housecallpro.com` favicon/logo asset.
- ServiceTitan: official ServiceTitan brand page logo mark.
- NiceJob: official `get.nicejob.com` favicon/logo asset.
- Zapier: official `cdn.zapier.com` logo asset linked from Zapier legal/trademark pages.
- ChatGPT: official OpenAI Help Center article image for the ChatGPT app icon.
- Vagaro: official `vagaro.azureedge.net` public logo asset.
- GlossGenius: official `glossgenius.com` Webflow logo asset.
- Square Appointments: official Square press logo asset.
- Boulevard: official `joinblvd.com` horizontal logo asset, cropped to the mark for small UI use.
- Booksy: official Booksy CloudFront app logo asset.
- Fresha: official `fresha.com` app/logo asset.
- Mangomint: official inline SVG logo data from `mangomint.com`, cropped to the mark for small UI use.
- Canva: official inline Canva logo from the Canva developer brand guidelines page.

## Visual Verification

- Homepage mobile header: new ihelpwithai logo stays compact and does not crop.
- Homepage/review cards: sourced vendor logos render next to company names, with initials fallbacks only for the documented missing files.
- `/reviews/`: review cards preserve spacing and use the logo/fallback pattern.
- `/reviews/housecall-pro/`: field review page title renders the official Housecall Pro mark.
- `/beauty/reviews/vagaro/`: beauty review page title renders the official Vagaro mark.
- `/compare/jobber-vs-housecall-pro/`: comparison title/table pattern renders a fallback for Jobber and the official Housecall Pro mark.
- `/beauty/compare/vagaro-vs-glossgenius/`: comparison title renders the Vagaro and GlossGenius logos cleanly on mobile.
- Beauty shortlist result cards: generated recommendation cards render vendor logos next to result names.

## Validation

- `npm run build`: passed
- `npm run qa:live`: passed
- `npm run test:owned-intake`: passed
- `npm run check:owned-intake-config`: passed
- `npm run verify:owned-intake-live`: passed, smoke skipped
- `node --check scripts/build-site.mjs`: passed
- `node --check src/assets/site.js`: passed
- `node --check src/assets/data-capture.js`: passed
- `node --check scripts/live-site-qa.mjs`: passed
- `node --check scripts/validate-owned-intake.mjs`: passed
- `node --check scripts/smoke-owned-intake.mjs`: passed
- `node --check scripts/check-owned-intake-config.mjs`: passed
- `node --check scripts/verify-owned-intake-live.mjs`: passed
- `node --check supabase/functions/owned-intake/shared.mjs`: passed
- `/tmp/deno-local/bin/deno check supabase/functions/owned-intake/index.ts`: passed
- Brand/vendor asset verification: passed; generated output no longer references `favicon.svg`, generated vendor logo assets exist in `assets/vendors/` and `public/assets/vendors/`, and all local vendor SVG files pass `xmllint --noout`.
