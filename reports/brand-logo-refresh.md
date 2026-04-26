# Brand Logo Refresh

## Scope

- Added the new ihelpwithai.com brand logo, mark, favicon, Apple touch icon, and web manifest assets from the provided brand package.
- Fixed the header logo visibility issue by replacing the compressed horizontal raster image with a clearer mark-plus-live-text lockup.
- Kept the full horizontal logo available as a brand/social asset, and added `src/assets/brand/ihelpwithai-logo-header-clear.png` for a readable header-style lockup asset.
- Added favicon, Apple touch icon, web manifest, and theme-color metadata to the global generated head.
- Regenerated the favicon, Apple touch icon, and Android app icons with a simplified high-contrast navy/teal growth-arrow mark so the icon remains readable at 16px and 32px.
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
- `src/assets/vendors/jobber.svg`
- `src/assets/vendors/callrail.svg`
- `src/assets/vendors/openphone.svg`

These use official vendor-owned pages, official brand pages, official media assets, official CDN assets, or first-party favicon/app-icon files where a full media-kit logo was not available. PNG/WebP/favicon source logos are embedded into local SVG wrappers so the registry filenames stay stable and the site never hotlinks remote logos.

No promoted vendor currently falls back to initials in generated review/comparison/card UI. If an official asset is removed or fails to copy later, the existing vendor-name helper still renders the clean initials fallback instead of a broken image.

OpenPhone now redirects to Quo. This PR keeps the displayed site copy as `OpenPhone` and uses a first-party Quo/OpenPhone app-icon asset in `openphone.svg`; a future editorial pass can decide whether to rename the vendor everywhere.

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
- Jobber: official `getjobber.com` app-icon asset.
- CallRail: official `callrail.com/favicon.png` asset.
- OpenPhone: official Quo/OpenPhone app-icon asset from the redirected first-party `quo.com`/`cdn.quo.com` experience.

## Visual Verification

- Homepage desktop header: clear mark-plus-live-text lockup is readable against the dark header, with the `.com` visible.
- Homepage mobile header: clear mark-plus-live-text lockup is readable against the dark header and does not crop; `.com` hides only on very narrow screens.
- Homepage/review cards: sourced vendor logos render next to company names with no initials fallbacks in generated output.
- `/reviews/`: review cards preserve spacing and use the logo/fallback pattern.
- `/reviews/jobber/`: field review page title renders the first-party Jobber app icon next to the company name.
- `/reviews/callrail/`: field review page title renders the first-party CallRail app icon next to the company name.
- `/reviews/openphone/`: field review page title renders the first-party Quo/OpenPhone app icon next to the current OpenPhone display name.
- `/beauty/reviews/vagaro/`: beauty review page title renders the official Vagaro mark.
- `/compare/jobber-vs-housecall-pro/`: comparison title/table pattern renders the Jobber and Housecall Pro logos.
- `/beauty/compare/vagaro-vs-glossgenius/`: comparison title renders the Vagaro and GlossGenius logos cleanly on mobile.
- Shortlist result cards: the shared runtime renderer now emits 24px vendor images when a tool has a logo and retains initials fallback only for missing future assets.

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
- Brand/vendor asset verification: passed; generated output no longer references `favicon.svg`, generated vendor logo assets exist in `assets/vendors/` and `public/assets/vendors/`, all local vendor SVG files pass `xmllint --noout`, and generated review/comparison/card output no longer includes vendor initials fallbacks.
