# Company Discovery Redesign Implementation Plan

> For Hermes: implement this in small verified steps, rebuild after each meaningful UI change, and keep the homepage simpler than before.

Goal: Make ihelpwithai.com better at helping people find the best AI tools and AI companies without turning the homepage back into a crowded directory.

Architecture: Keep the homepage guided and linear, but add a dedicated companies discovery path as a secondary route. Use the existing tool/company data in tools-starter.json and generate any new company-focused page from scripts/build-site.mjs so repo output and public deploy output stay aligned.

Tech Stack: Static HTML, app.js, styles.css, scripts/build-site.mjs, generated pages under public/.

---

## Priority order for today

1. Add a dedicated companies page generated from tool data.
2. Link that page from the homepage and generated-page nav.
3. Keep the homepage focused on guided task-first discovery.
4. Build locally and smoke-test the new route.
5. Identify the next simplification pass after seeing the result in-browser.

## Task list

### Task 1: Create a generated companies discovery page
- Modify: scripts/build-site.mjs
- Add a generated `companies.html` page that:
  - explains when to browse by company versus by task
  - lists companies in a calm list/grid pattern
  - shows each company summary
  - shows associated tools with direct links
  - provides a return path to the homepage shortlist and full directory

### Task 2: Add companies to routing and deploy output
- Modify: scripts/build-site.mjs
- Ensure the build:
  - writes `companies.html`
  - includes it in sitemap.xml
  - copies it into public/
  - creates a `/companies/` redirect folder in public/

### Task 3: Update homepage navigation and entry points
- Modify: index.html
- Replace duplicated nav intent with clearer paths.
- Add a visible but secondary path for people who want to browse AI companies.
- Keep the main CTA pointed at the shortlist flow.

### Task 4: Update generated-page nav consistency
- Modify: scripts/build-site.mjs
- Tool, guide, comparison, and trust pages should link back to the new companies path where it helps users orient themselves.

### Task 5: Build and smoke-test
- Run: npm run build
- Check:
  - homepage
  - one tool page
  - companies page
  - one guide page
  - one comparison page
  - best-free-ai-tools.html
  - editorial-methodology.html

### Task 6: Prepare the next autonomous work queue
- Keep the next passes focused on:
  - reducing visible filter overload on the homepage
  - improving result explanations
  - adding stronger company-to-tool pathways
  - reconciling repo-vs-live drift if needed
