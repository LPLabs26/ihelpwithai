# Brand Logo Refresh

## Scope

- Added the new ihelpwithai.com brand logo, mark, favicon, Apple touch icon, and web manifest assets from the provided brand package.
- Replaced the text-style header brand with the horizontal transparent logo.
- Added favicon, Apple touch icon, web manifest, and theme-color metadata to the global generated head.
- Added a reusable vendor-name pattern with local official-logo support and initials fallback.
- Added a vendor registry for promoted field-trades and Beauty & Wellness companies.
- Updated review cards, comparison cards, comparison tables, review alternatives, related comparison links, review page titles, comparison page titles, and shortlist result cards to use the vendor-name pattern.

## Official Vendor Logo Status

The brand package did not include official vendor logo files. To avoid committing unofficial or scraped third-party assets, the site currently renders clean initials fallbacks for these missing official files:

- `src/assets/vendors/jobber.svg`
- `src/assets/vendors/housecall-pro.svg`
- `src/assets/vendors/servicetitan.svg`
- `src/assets/vendors/nicejob.svg`
- `src/assets/vendors/callrail.svg`
- `src/assets/vendors/openphone.svg`
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

When official vendor-provided brand/media-kit SVG or PNG files are added with those filenames, the generator will render the image logos automatically.

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
- Brand/vendor asset verification script: passed
