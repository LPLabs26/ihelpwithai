import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'reports');

const BASE_URL = 'https://ihelpwithai.com';
const PLACEHOLDER_PATTERN = /\b(?:lorem ipsum|todo|placeholder|undefined)\b/i;
const INTERNAL_ASSET_PATTERN = /\.(?:css|js|png|jpe?g|gif|svg|webp|ico|txt|xml|json|csv|pdf)$/i;

const criticalPaths = [
  '/',
  '/shortlist/',
  '/trades/',
  '/beauty/',
  '/beauty/problems/',
  '/beauty/shortlist/',
  '/problems/',
  '/reviews/',
  '/compare/',
  '/templates/',
  '/learn/',
  '/beauty/reviews/',
  '/beauty/compare/',
  '/beauty/templates/',
  '/beauty/starter-pack/',
  '/reviews/jobber/',
  '/reviews/housecall-pro/',
  '/reviews/servicetitan/',
  '/reviews/nicejob/',
  '/reviews/callrail/',
  '/beauty/reviews/vagaro/',
  '/beauty/reviews/glossgenius/',
  '/beauty/reviews/square-appointments/',
  '/beauty/reviews/boulevard/',
  '/beauty/reviews/fresha/',
  '/beauty/reviews/booksy/',
  '/beauty/reviews/mangomint/',
  '/beauty/reviews/chatgpt/',
  '/beauty/reviews/canva/',
  '/beauty/reviews/zapier/',
  '/compare/jobber-vs-housecall-pro/',
  '/compare/all-in-one-field-service-software-vs-separate-ai-tools/',
  '/beauty/compare/vagaro-vs-glossgenius/',
  '/beauty/compare/square-appointments-vs-glossgenius/',
  '/beauty/compare/boulevard-vs-vagaro/',
  '/beauty/compare/all-in-one-salon-software-vs-separate-ai-tools/',
  '/starter-pack/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/affiliate-disclosure/',
  '/methodology/'
];

const coreLaunchPaths = [
  '/',
  '/shortlist/',
  '/trades/',
  '/beauty/',
  '/beauty/shortlist/',
  '/starter-pack/',
  '/beauty/starter-pack/',
  '/reviews/jobber/',
  '/reviews/housecall-pro/',
  '/reviews/servicetitan/',
  '/beauty/reviews/vagaro/',
  '/beauty/reviews/glossgenius/',
  '/beauty/reviews/boulevard/',
  '/compare/jobber-vs-housecall-pro/',
  '/beauty/compare/vagaro-vs-glossgenius/',
  '/privacy/',
  '/terms/'
];

const analyticsEvents = [
  'ihai_page_view',
  'ihai_home_cta_click',
  'ihai_shortlist_started',
  'ihai_shortlist_completed',
  'ihai_beauty_shortlist_started',
  'ihai_beauty_shortlist_completed',
  'ihai_starter_pack_form_started',
  'ihai_starter_pack_form_submitted',
  'ihai_beauty_starter_pack_form_started',
  'ihai_beauty_starter_pack_form_submitted',
  'ihai_review_cta_clicked',
  'ihai_beauty_review_cta_clicked',
  'ihai_compare_cta_clicked',
  'ihai_beauty_compare_cta_clicked',
  'ihai_outbound_tool_click'
];

const localAnalyticsFiles = [
  path.join(rootDir, 'src', 'assets', 'site.js'),
  path.join(rootDir, 'assets', 'site.js'),
  path.join(rootDir, 'public', 'assets', 'site.js')
];

const crawlSeeds = [
  '/',
  '/shortlist/',
  '/trades/',
  '/beauty/',
  '/beauty/problems/',
  '/beauty/shortlist/',
  '/problems/',
  '/reviews/',
  '/beauty/reviews/',
  '/compare/',
  '/beauty/compare/',
  '/templates/',
  '/beauty/templates/',
  '/beauty/starter-pack/',
  '/learn/'
];

const legacyChecks = [
  { source: '/tools/chatgpt.html', expected: ['/reviews/chatgpt/'] },
  { source: '/tools/zapier.html', expected: ['/reviews/zapier/'] },
  { source: '/tools/jobber.html', expected: ['/reviews/jobber/'] },
  { source: '/tools/housecall-pro.html', expected: ['/reviews/housecall-pro/'] },
  { source: '/tools/callrail.html', expected: ['/reviews/callrail/'] },
  { source: '/directory.html', expected: ['/shortlist/'] },
  { source: '/companies.html', expected: ['/reviews/', '/shortlist/'] },
  { source: '/guides/best-ai-tools-for-productivity.html', expected: ['/learn/'] },
  { source: '/comparisons.html', expected: ['/compare/'] },
  { source: '/estimate-follow-up.html', expected: ['/problems/quote-follow-up/'] },
  { source: '/missed-calls.html', expected: ['/problems/missed-calls/'] },
  { source: '/office-admin.html', expected: ['/problems/office-admin/'] }
];

const sections = [];
const failures = [];
const fetchCache = new Map();

function section(title) {
  const entry = { title, checks: [] };
  sections.push(entry);
  return entry;
}

function record(entry, pass, message, details = {}) {
  entry.checks.push({ pass, message, details });
  if (!pass) {
    failures.push({ section: entry.title, message, details });
  }
}

function absoluteUrl(input) {
  if (input === '/') return BASE_URL;
  return new URL(input, BASE_URL).toString();
}

function normalizeComparableUrl(value) {
  const url = new URL(value, BASE_URL);
  const pathname = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return `${url.origin}${pathname}${url.search}`;
}

function toPathname(urlString) {
  const url = new URL(urlString, BASE_URL);
  return url.pathname + url.search;
}

function normalizeInternalTarget(href, currentUrl) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return '';
  }

  let url;
  try {
    url = new URL(href, currentUrl);
  } catch (error) {
    return '';
  }

  if (url.origin !== BASE_URL) return '';
  if (INTERNAL_ASSET_PATTERN.test(url.pathname)) return '';

  url.hash = '';

  if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
    url.pathname += '/';
  }

  return url.pathname + url.search;
}

function decodeEntities(value) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function visibleText(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const source = bodyMatch ? bodyMatch[1] : html;
  return decodeEntities(
    source
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|template|svg)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : '';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=(["'])description\1[^>]+content=(["'])([\s\S]*?)\2/i);
  return match ? decodeEntities(match[3].trim()) : '';
}

function extractCanonical(html) {
  const match = html.match(/<link[^>]+rel=(["'])canonical\1[^>]+href=(["'])([\s\S]*?)\2/i);
  return match ? match[3].trim() : '';
}

function extractRobots(html) {
  const match = html.match(/<meta[^>]+name=(["'])robots\1[^>]+content=(["'])([\s\S]*?)\2/i);
  return match ? match[3].trim() : '';
}

function extractInternalNavLink(html) {
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  if (!navMatch) return '';
  const linkMatch = navMatch[0].match(/<a[^>]+href=(["'])(\/[^"']*)\1/i);
  return linkMatch ? linkMatch[2] : '';
}

function extractLinks(html, currentUrl) {
  const links = new Set();
  const pattern = /<a\b[^>]*\bhref=(["'])(.*?)\1/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const normalized = normalizeInternalTarget(match[2], currentUrl);
    if (normalized) links.add(normalized);
  }

  return Array.from(links);
}

async function fetchUrl(pathOrUrl, options = {}) {
  const url = absoluteUrl(pathOrUrl);
  const cacheKey = `${options.redirect || 'follow'}:${url}`;
  if (!fetchCache.has(cacheKey)) {
    fetchCache.set(
      cacheKey,
      (async () => {
        const response = await fetch(url, {
          redirect: options.redirect || 'follow',
          headers: {
            'user-agent': 'ihelpwithai-live-qa/1.0'
          }
        });
        const contentType = response.headers.get('content-type') || '';
        const text =
          options.skipText || /(?:text|json|xml)/i.test(contentType)
            ? await response.text()
            : '';
        return {
          url: response.url,
          status: response.status,
          headers: response.headers,
          contentType,
          text
        };
      })()
    );
  }

  return fetchCache.get(cacheKey);
}

async function runCriticalPages(entry) {
  for (const route of criticalPaths) {
    const page = await fetchUrl(route);
    const title = extractTitle(page.text);
    const description = extractMetaDescription(page.text);
    const canonical = extractCanonical(page.text);
    const navLink = extractInternalNavLink(page.text);
    const text = visibleText(page.text);
    const forbiddenMatch = text.match(PLACEHOLDER_PATTERN);

    record(entry, page.status === 200, `${route} returns HTTP 200`, { status: page.status });
    record(entry, /text\/html/i.test(page.contentType), `${route} returns HTML`, {
      contentType: page.contentType
    });
    record(entry, Boolean(title), `${route} includes a title`, { title });
    record(entry, Boolean(description), `${route} includes a meta description`, {
      description
    });
    record(
      entry,
      normalizeComparableUrl(canonical) === normalizeComparableUrl(absoluteUrl(route)),
      `${route} includes the expected canonical`,
      {
      canonical
      }
    );
    record(entry, Boolean(navLink), `${route} includes an internal nav link`, {
      navLink
    });
    record(entry, !forbiddenMatch, `${route} has no placeholder copy in visible text`, {
      forbiddenMatch: forbiddenMatch ? forbiddenMatch[0] : ''
    });
  }
}

async function runIndexingChecks(entry) {
  const thankYou = await fetchUrl('/thank-you/');
  const robotsValue = extractRobots(thankYou.text);
  record(entry, thankYou.status === 200, '/thank-you/ is fetchable', { status: thankYou.status });
  record(
    entry,
    robotsValue.toLowerCase() === 'noindex, nofollow',
    '/thank-you/ includes the noindex robots directive',
    { robots: robotsValue }
  );

  const sitemap = await fetchUrl('/sitemap.xml');
  record(entry, sitemap.status === 200, '/sitemap.xml returns HTTP 200', {
    status: sitemap.status
  });
  record(
    entry,
    !sitemap.text.includes('/thank-you/'),
    '/thank-you/ is absent from sitemap.xml'
  );
}

async function runSitemapAndRobotsChecks(entry) {
  const sitemap = await fetchUrl('/sitemap.xml');
  const robots = await fetchUrl('/robots.txt');

  for (const route of coreLaunchPaths) {
    record(entry, sitemap.text.includes(absoluteUrl(route)), `sitemap.xml includes ${route}`);
  }

  record(entry, robots.status === 200, '/robots.txt returns HTTP 200', {
    status: robots.status
  });
  record(
    entry,
    /sitemap:\s*https:\/\/ihelpwithai\.com\/sitemap\.xml/i.test(robots.text),
    '/robots.txt references sitemap.xml'
  );
}

function matchesExpectedTarget(targets, candidate) {
  return targets.some(
    (target) => normalizeComparableUrl(target) === normalizeComparableUrl(candidate)
  );
}

function redirectPageMatches(html, expectedTargets) {
  const canonical = extractCanonical(html);
  if (canonical && matchesExpectedTarget(expectedTargets, canonical)) return true;

  const refreshMatch = html.match(/<meta[^>]+http-equiv=(["'])refresh\1[^>]+content=(["'])([\s\S]*?)\2/i);
  if (refreshMatch) {
    const value = refreshMatch[3];
    const urlMatch = value.match(/url\s*=\s*([^;]+)/i);
    if (urlMatch && matchesExpectedTarget(expectedTargets, urlMatch[1].trim())) return true;
  }

  const anchorMatch = html.match(/<a[^>]+href=(["'])(.*?)\1/i);
  if (anchorMatch && matchesExpectedTarget(expectedTargets, anchorMatch[2])) return true;

  return false;
}

async function runLegacyChecks(entry) {
  for (const legacy of legacyChecks) {
    const manual = await fetchUrl(legacy.source, { redirect: 'manual' });
    const location = manual.headers.get('location') || '';

    if (manual.status >= 300 && manual.status < 400 && location) {
      record(
        entry,
        matchesExpectedTarget(legacy.expected, location),
        `${legacy.source} redirects to an expected destination`,
        { status: manual.status, location }
      );
      continue;
    }

    const page = await fetchUrl(legacy.source);
    const finalPath = toPathname(page.url);
    const matchedRedirect = matchesExpectedTarget(legacy.expected, page.url);
    const matchedStaticRedirect = page.status === 200 && redirectPageMatches(page.text, legacy.expected);

    record(
      entry,
      page.status === 200 && (matchedRedirect || matchedStaticRedirect),
      `${legacy.source} lands on a useful replacement`,
      {
        status: page.status,
        finalPath,
        expected: legacy.expected
      }
    );
  }
}

async function runInternalCrawl(entry) {
  const visited = new Set();
  const queue = [...crawlSeeds];
  const checkedLinks = new Set();
  const brokenLinks = [];
  const maxPages = 250;

  while (queue.length && visited.size < maxPages) {
    const route = queue.shift();
    if (!route || visited.has(route)) continue;
    visited.add(route);

    const page = await fetchUrl(route);
    if (page.status !== 200 || !/text\/html/i.test(page.contentType)) continue;

    const links = extractLinks(page.text, page.url);
    for (const link of links) {
      if (!checkedLinks.has(link)) {
        checkedLinks.add(link);
        const response = await fetchUrl(link);
        if (response.status >= 400) {
          brokenLinks.push({
            from: route,
            to: link,
            status: response.status
          });
        }
      }

      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
  }

  record(entry, brokenLinks.length === 0, 'Internal crawl found no same-origin 404/500 links', {
    brokenLinks,
    visitedPages: visited.size,
    checkedLinks: checkedLinks.size
  });
}

async function runAnalyticsChecks(entry) {
  const siteScript = await fetchUrl('/assets/site.js', { skipText: true });
  const siteData = await fetchUrl('/assets/site-data.js', { skipText: true });

  record(entry, siteScript.status === 200, '/assets/site.js returns HTTP 200', {
    status: siteScript.status
  });
  record(entry, siteData.status === 200, '/assets/site-data.js returns HTTP 200', {
    status: siteData.status
  });

  for (const eventName of analyticsEvents) {
    record(
      entry,
      siteScript.text.includes(eventName),
      `${eventName} is present in the live analytics script`
    );
  }

  record(
    entry,
    !siteData.text.includes('phc_REPLACE_ME'),
    'Live site data does not use the PostHog placeholder token'
  );
  record(
    entry,
    /posthogHost/i.test(siteData.text),
    'Live site data includes a PostHog host configuration'
  );
}

async function runAnalyticsGuardrailChecks(entry) {
  for (const filePath of localAnalyticsFiles) {
    const source = await fs.readFile(filePath, 'utf8');
    const relative = path.relative(rootDir, filePath);

    record(
      entry,
      source.includes('$current_url: window.location.origin + window.location.pathname'),
      `${relative} sanitizes $current_url to origin plus pathname`
    );
    record(
      entry,
      source.includes('$pathname: window.location.pathname'),
      `${relative} keeps $pathname based on window.location.pathname`
    );
    record(
      entry,
      !source.includes('$current_url: window.location.href'),
      `${relative} does not send window.location.href as $current_url`
    );
  }
}

function buildMarkdownReport() {
  const lines = [
    '# Live Site QA Report',
    '',
    `- Site: ${BASE_URL}`,
    `- Generated: ${new Date().toISOString()}`,
    `- Sections: ${sections.length}`,
    `- Failures: ${failures.length}`,
    ''
  ];

  for (const entry of sections) {
    const passed = entry.checks.filter((check) => check.pass).length;
    const failed = entry.checks.length - passed;
    lines.push(`## ${entry.title}`);
    lines.push('');
    lines.push(`- Passed: ${passed}`);
    lines.push(`- Failed: ${failed}`);
    lines.push('');

    const failedChecks = entry.checks.filter((check) => !check.pass);
    if (failedChecks.length === 0) {
      lines.push('- No failures in this section.');
      lines.push('');
      continue;
    }

    for (const check of failedChecks) {
      lines.push(`- ${check.message}`);
      if (Object.keys(check.details || {}).length > 0) {
        lines.push(`  - Details: \`${JSON.stringify(check.details)}\``);
      }
    }
    lines.push('');
  }

  if (failures.length === 0) {
    lines.push('## Overall');
    lines.push('');
    lines.push('- All live QA checks passed.');
    lines.push('');
  }

  return lines.join('\n');
}

async function writeReports() {
  await fs.mkdir(reportsDir, { recursive: true });
  const jsonReport = {
    generatedAt: new Date().toISOString(),
    site: BASE_URL,
    summary: {
      sections: sections.length,
      checks: sections.reduce((total, entry) => total + entry.checks.length, 0),
      failures: failures.length
    },
    sections,
    failures
  };

  await fs.writeFile(
    path.join(reportsDir, 'live-site-qa.json'),
    JSON.stringify(jsonReport, null, 2) + '\n'
  );
  await fs.writeFile(path.join(reportsDir, 'live-site-qa.md'), buildMarkdownReport());
}

async function main() {
  await runCriticalPages(section('Critical Pages'));
  await runIndexingChecks(section('Indexing Rules'));
  await runSitemapAndRobotsChecks(section('Sitemap And Robots'));
  await runAnalyticsChecks(section('Analytics Instrumentation'));
  await runAnalyticsGuardrailChecks(section('Analytics Guardrails'));
  await runLegacyChecks(section('Legacy Compatibility'));
  await runInternalCrawl(section('Internal Link Crawl'));
  await writeReports();

  if (failures.length > 0) {
    console.error(`live-site-qa failed with ${failures.length} issue(s). See reports/live-site-qa.md`);
    process.exitCode = 1;
    return;
  }

  console.log('live-site-qa passed');
}

await main();
