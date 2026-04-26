import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUILD_DATE,
  compatibilityRedirects,
  comparisons,
  legalPages,
  learnSections,
  problems,
  reviews,
  site,
  templateSections,
  trades,
  vendors
} from '../src/data/site-content.mjs';
import {
  beautyBusinesses,
  beautyComparisons,
  beautyProblems,
  beautyReviews,
  beautyShortlistQuestions,
  beautyStarterPack,
  beautyTemplates,
  beautyVertical
} from '../src/data/beauty-content.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const srcAssetsDir = path.join(rootDir, 'src', 'assets');
const publicAssetsDir = path.join(publicDir, 'assets');
const rootAssetsDir = path.join(rootDir, 'assets');

const SITE_URL = 'https://ihelpwithai.com';
const ASSET_VERSION = '20260420a';
const FORM_ACTION = `https://formsubmit.co/${site.contactEmail}`;
const ROUTE_SUFFIX = '/';
const SITEMAP_EXCLUDED_ROUTES = new Set(['/thank-you/']);

const reviewBySlug = new Map(reviews.map((review) => [review.slug, review]));
const tradeBySlug = new Map(trades.map((trade) => [trade.slug, trade]));
const problemBySlug = new Map(problems.map((problem) => [problem.slug, problem]));
const comparisonBySlug = new Map(comparisons.map((comparison) => [comparison.slug, comparison]));
const templateById = new Map(templateSections.map((template) => [template.id, template]));
const learnById = new Map(learnSections.map((entry) => [entry.id, entry]));
const beautyBusinessBySlug = new Map(beautyBusinesses.map((entry) => [entry.slug, entry]));
const beautyProblemBySlug = new Map(beautyProblems.map((entry) => [entry.slug, entry]));
const beautyReviewBySlug = new Map(beautyReviews.map((entry) => [entry.slug, entry]));
const beautyComparisonBySlug = new Map(beautyComparisons.map((entry) => [entry.slug, entry]));
const beautyTemplateById = new Map(beautyTemplates.map((entry) => [entry.id, entry]));
const vendorByName = new Map(
  Object.entries(vendors).map(([slug, vendor]) => [normalizeVendorKey(vendor.name), slug])
);

const legacyRootPaths = [
  'affiliate-disclosure.html',
  'app.js',
  'assets',
  'best-free-ai-tools.html',
  'companies',
  'companies.html',
  'compare.js',
  'comparisons',
  'comparisons.json',
  'contractors',
  'contractors.html',
  'data.js',
  'directory.html',
  'editorial-methodology.html',
  'estimate-follow-up.html',
  'get-help.html',
  'guides',
  'ihelpwithai-preview.html',
  'index.html',
  'marketing.html',
  'missed-calls.html',
  'office-admin.html',
  'post-image-sample.html',
  'problems.html',
  'review-requests.html',
  'reviews.html',
  'robots.txt',
  'shortlist.html',
  'sitemap.xml',
  'styles.css',
  'submit-app.html',
  'thanks.html',
  'tool.js',
  'tools',
  'tools-starter.csv',
  'tools-starter.json'
];

const pageRoutes = [];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeVendorKey(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getVendor(slugOrName = '') {
  const key = String(slugOrName);
  return vendors[key] || vendors[vendorByName.get(normalizeVendorKey(key))] || null;
}

function vendorInitials(name = '') {
  const words =
    String(name)
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .match(/[A-Za-z0-9]+/g) || [];
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function vendorLogoPath(vendor) {
  if (!vendor?.logo) return '';
  const relativeAssetPath = vendor.logo.replace(/^\/assets\//, '');
  return existsSync(path.join(srcAssetsDir, relativeAssetPath)) ? vendor.logo : '';
}

function renderVendorName(slugOrName, fallbackName = '', options = {}) {
  const vendor = getVendor(slugOrName);
  const name = vendor?.name || fallbackName || String(slugOrName);
  const logo = vendorLogoPath(vendor);
  const className = ['vendor-name', options.className].filter(Boolean).join(' ');
  const icon = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)} logo" class="vendor-logo" width="22" height="22" loading="lazy" decoding="async">`
    : `<span class="vendor-logo vendor-logo--fallback" aria-hidden="true">${escapeHtml(vendorInitials(name))}</span>`;

  return `<span class="${escapeHtml(className)}">${icon}<span>${escapeHtml(name)}</span></span>`;
}

function renderReviewName(review, options = {}) {
  return renderVendorName(review.slug, review.toolName, options);
}

function renderVendorPair(leftSlug, leftName, rightSlug, rightName) {
  return `<span class="vendor-pair">${renderVendorName(leftSlug, leftName)}<span class="vendor-pair__separator">vs</span>${renderVendorName(rightSlug, rightName)}</span>`;
}

function renderComparisonTitle(comparison, lookup) {
  const left = lookup.get(comparison.leftTool);
  const right = lookup.get(comparison.rightTool);
  if (!comparison.leftLabel && !comparison.rightLabel && left && right) {
    return renderVendorPair(comparison.leftTool, left.toolName, comparison.rightTool, right.toolName);
  }
  return escapeHtml(comparison.shortTitle);
}

function renderComparisonSideName(comparison, side, review) {
  const customLabel = comparison[`${side}Label`];
  if (customLabel) return escapeHtml(customLabel);
  return renderReviewName(review);
}

function vendorSiteData(slug, fallbackName) {
  const vendor = getVendor(slug);
  const name = vendor?.name || fallbackName;
  return {
    logo: vendorLogoPath(vendor),
    logoFallback: vendorInitials(name)
  };
}

function routeForTrade(slug) {
  return `/trades/${slug}${ROUTE_SUFFIX}`;
}

function routeForBeautyBusiness(slug) {
  return `/beauty/${slug}${ROUTE_SUFFIX}`;
}

function routeForProblem(slug) {
  return `/problems/${slug}${ROUTE_SUFFIX}`;
}

function routeForBeautyProblem(slug) {
  return `/beauty/problems/${slug}${ROUTE_SUFFIX}`;
}

function routeForReview(slug) {
  return `/reviews/${slug}${ROUTE_SUFFIX}`;
}

function routeForBeautyReview(slug) {
  return `/beauty/reviews/${slug}${ROUTE_SUFFIX}`;
}

function routeForComparison(slug) {
  return `/compare/${slug}${ROUTE_SUFFIX}`;
}

function routeForBeautyComparison(slug) {
  return `/beauty/compare/${slug}${ROUTE_SUFFIX}`;
}

function routeForBeautyStarterPack() {
  return `/beauty/starter-pack/`;
}

function routeForTemplate(id) {
  return `/templates/#${id}`;
}

function routeForBeautyTemplate(id) {
  return `/beauty/templates/#${id}`;
}

function routeForLearn(id) {
  return `/learn/#${id}`;
}

function absoluteUrl(route) {
  return route === '/' ? SITE_URL : `${SITE_URL}${route}`;
}

function routeSegments(route) {
  return route.split('/').filter(Boolean);
}

function routeToFilePath(root, route) {
  if (route === '/') {
    return path.join(root, 'index.html');
  }
  return path.join(root, ...routeSegments(route), 'index.html');
}

function routeToAliasPath(root, route) {
  if (route === '/') return null;
  const parts = routeSegments(route);
  return path.join(root, ...parts.slice(0, -1), `${parts.at(-1)}.html`);
}

function pageTitle(title) {
  return title === site.title ? title : `${title} | ${site.title}`;
}

function toSlugLabel(slug) {
  return slug
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function isBeautyRoute(route) {
  return route === '/beauty/' || route.startsWith('/beauty/');
}

function navLinksForRoute(currentRoute) {
  if (!isBeautyRoute(currentRoute)) return site.navLinks;

  return site.navLinks.map((link) => {
    if (link.href === '/shortlist/') {
      return { href: '/beauty/shortlist/', label: 'Beauty Shortlist' };
    }
    if (link.href === '/reviews/') {
      return { href: '/beauty/reviews/', label: 'Beauty Reviews' };
    }
    if (link.href === '/compare/') {
      return { href: '/beauty/compare/', label: 'Beauty Compare' };
    }
    if (link.href === '/templates/') {
      return { href: '/beauty/templates/', label: 'Beauty Templates' };
    }
    return link;
  });
}

function footerGroupsForRoute(currentRoute) {
  if (!isBeautyRoute(currentRoute)) return site.footerGroups;

  return [
    {
      title: 'Start Here',
      links: [
        { href: '/beauty/shortlist/', label: 'Start the beauty shortlist' },
        { href: '/beauty/', label: 'Browse beauty & wellness' },
        { href: '/beauty/problems/', label: 'Browse beauty problems' },
        { href: '/beauty/reviews/', label: 'Browse beauty reviews' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/beauty/compare/', label: 'Beauty comparisons' },
        { href: '/beauty/templates/', label: 'Copy beauty templates' },
        { href: routeForBeautyStarterPack(), label: 'Get the Beauty & Wellness starter pack' },
        { href: '/learn/', label: 'Learn what to automate first' }
      ]
    },
    ...site.footerGroups.slice(2)
  ];
}

function renderNav(currentRoute) {
  return navLinksForRoute(currentRoute)
    .map((link) => {
      const active =
        link.href === '/'
          ? currentRoute === '/'
          : currentRoute === link.href || currentRoute.startsWith(link.href);
      return `<a class="${active ? 'is-active' : ''}" href="${link.href}" data-analytics="nav_click">${escapeHtml(link.label)}</a>`;
    })
    .join('');
}

function renderFooter(currentRoute) {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <div class="footer-brand">${escapeHtml(site.title)}</div>
          <p>${escapeHtml(site.description)}</p>
          <p class="microcopy">Built around workflow reality, setup tolerance, and practical next picks for hands-on service businesses.</p>
          <p class="footer-contact">Need help or have a question? <a href="mailto:${site.contactEmail}">${site.contactEmail}</a></p>
        </div>
        ${footerGroupsForRoute(currentRoute)
          .map(
            (group) => `
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <ul class="footer-links">
              ${group.links
                .map(
                  (link) =>
                    `<li><a href="${link.href}" data-analytics="footer_click">${escapeHtml(link.label)}</a></li>`
                )
                .join('')}
            </ul>
          </div>`
          )
          .join('')}
      </div>
    </footer>`;
}

function renderHeader(currentRoute) {
  return `
    <header class="site-header">
      <div class="container header-inner">
        <a class="site-brand" href="/" aria-label="ihelpwithai.com home">
          <img
            src="/assets/brand/ihelpwithai-logo-horizontal-transparent.png"
            alt="ihelpwithai.com"
            class="site-brand__logo"
            width="1331"
            height="386"
            decoding="async"
            fetchpriority="high">
        </a>
        <button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" data-menu-toggle>&#9776;</button>
        <nav class="site-nav" data-menu>
          ${renderNav(currentRoute)}
        </nav>
      </div>
    </header>`;
}

function renderPills(items, formatter = (value) => value) {
  return `<div class="pill-row">${items
    .map((item) => `<span class="pill">${escapeHtml(formatter(item))}</span>`)
    .join('')}</div>`;
}

function renderBulletList(items, className = 'bullet-list') {
  return `<ul class="${className}">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

function renderLeadFormHiddenFields(subject, metadata = {}) {
  const sourcePage = metadata.sourcePage || '';
  const vertical = metadata.vertical || '';
  const starterPackType = metadata.starterPackType || '';
  return `
    <input type="hidden" name="_subject" value="${escapeHtml(subject)}">
    <input type="hidden" name="_captcha" value="false">
    <input type="hidden" name="_next" value="${absoluteUrl('/thank-you/')}">
    <input type="hidden" name="source_page" value="${escapeHtml(sourcePage)}">
    <input type="hidden" name="vertical" value="${escapeHtml(vertical)}">
    <input type="hidden" name="starter_pack_type" value="${escapeHtml(starterPackType)}">
    <input type="hidden" name="trade_or_business_type" value="">
    <label class="form-honeypot" aria-hidden="true">
      Leave this field blank
      <input type="text" name="_honey" tabindex="-1" autocomplete="off">
    </label>`;
}

function renderFaqList(faqs) {
  return `<div class="faq-list">${faqs
    .map(
      (faq) => `
      <details>
        <summary>${escapeHtml(faq.question)}</summary>
        <p>${escapeHtml(faq.answer)}</p>
      </details>`
    )
    .join('')}</div>`;
}

function renderBreadcrumbs(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return '';
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumbs
    .map((crumb, index) => {
      const isLast = index === breadcrumbs.length - 1;
      if (isLast || !crumb.href) {
        return `<span>${escapeHtml(crumb.label)}</span>`;
      }
      return `<a href="${crumb.href}">${escapeHtml(crumb.label)}</a>`;
    })
    .join('<span>/</span>')}</nav>`;
}

function renderTrustPanel() {
  return `
    <aside class="trust-panel">
      <div class="trust-chip">Trust layer</div>
      <p>This site is intentionally built around best fit, bad fit, setup reality, and next-step clarity.</p>
      <ul class="bullet-list">
        <li><a href="/methodology/">Read the editorial methodology</a></li>
        <li><a href="/affiliate-disclosure/">See the affiliate disclosure</a></li>
        <li>Last review update standard: ${escapeHtml(BUILD_DATE)}</li>
      </ul>
    </aside>`;
}

const POTENTIAL_MONETIZATION_NOTE =
  'Some review and comparison pages may earn referral revenue now or later if you click through or buy from linked vendors. Fit, bad fit, switching cost, and stack reality still come first.';

function renderInfoCard(card) {
  if (!card) return '';
  const hasBullets = Array.isArray(card.bullets) && card.bullets.length > 0;
  return `
    <article class="card">
      <div class="card-kicker">${escapeHtml(card.kicker)}</div>
      ${card.title ? `<h3>${escapeHtml(card.title)}</h3>` : ''}
      ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ''}
      ${hasBullets ? renderBulletList(card.bullets) : ''}
    </article>`;
}

function renderInfoCardSection(cards, containerClass = 'grid cols-3') {
  const activeCards = cards.filter(Boolean);
  if (activeCards.length === 0) return '';

  return `
    <section class="section">
      <div class="container ${containerClass}">
        ${activeCards.map((card) => renderInfoCard(card)).join('')}
      </div>
    </section>`;
}

function renderMonetizationCard(note = POTENTIAL_MONETIZATION_NOTE) {
  return renderInfoCard({
    kicker: 'Potential monetization',
    text: note
  });
}

function renderAudienceChoiceCard({ kicker, title, description, href, cta, detail, className = '' }) {
  return `
    <article class="route-card ${className}">
      <div class="card-kicker">${escapeHtml(kicker)}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
      ${detail ? `<p class="microcopy">${escapeHtml(detail)}</p>` : ''}
      <div class="cta-row"><a class="btn secondary small" href="${href}" data-analytics="home_cta">${escapeHtml(cta)}</a></div>
    </article>`;
}

function renderTradeCard(trade) {
  return `
    <a class="card" href="${routeForTrade(trade.slug)}">
      <div class="card-kicker">Trade guide</div>
      <h3>${escapeHtml(trade.title)}</h3>
      <p>${escapeHtml(trade.description)}</p>
      ${renderPills(trade.featuredProblems.map((slug) => problemBySlug.get(slug).title))}
    </a>`;
}

function renderProblemCard(problem) {
  return `
    <a class="card" href="${routeForProblem(problem.slug)}">
      <div class="card-kicker">Problem path</div>
      <h3>${escapeHtml(problem.title)}</h3>
      <p>${escapeHtml(problem.description)}</p>
    </a>`;
}

function renderReviewCard(review) {
  return `
    <a class="card" href="${routeForReview(review.slug)}" data-analytics="review_cta">
      <div class="card-kicker">${escapeHtml(review.category)}</div>
      <h3>${renderReviewName(review)}</h3>
      <p>${escapeHtml(review.oneLineVerdict)}</p>
      ${renderPills([
        review.setupEffort,
        review.pricingPosture,
        `${review.tradeFit.length} trade fits`
      ])}
    </a>`;
}

function renderComparisonCard(comparison) {
  return `
    <a class="card" href="${routeForComparison(comparison.slug)}" data-analytics="compare_cta">
      <div class="card-kicker">Comparison</div>
      <h3>${renderComparisonTitle(comparison, reviewBySlug)}</h3>
      <p>${escapeHtml(comparison.summary)}</p>
    </a>`;
}

function renderTemplateCard(template) {
  return `
    <a class="card" href="${routeForTemplate(template.id)}">
      <div class="card-kicker">Template</div>
      <h3>${escapeHtml(template.title)}</h3>
      <p>${escapeHtml(template.intro)}</p>
    </a>`;
}

function renderBeautyBusinessCard(entry) {
  return `
    <a class="card" href="${routeForBeautyBusiness(entry.slug)}">
      <div class="card-kicker">Beauty category</div>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.description)}</p>
      ${renderPills(entry.featuredProblems.map((slug) => beautyProblemBySlug.get(slug)?.title || toSlugLabel(slug)))}
    </a>`;
}

function renderBeautyProblemCard(entry) {
  return `
    <a class="card" href="${routeForBeautyProblem(entry.slug)}">
      <div class="card-kicker">Beauty problem</div>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.description)}</p>
    </a>`;
}

function renderBeautyReviewCard(entry) {
  return `
    <a class="card" href="${routeForBeautyReview(entry.slug)}" data-analytics="review_cta beauty_review_cta">
      <div class="card-kicker">${escapeHtml(entry.category)}</div>
      <h3>${renderReviewName(entry)}</h3>
      <p>${escapeHtml(entry.oneLineVerdict)}</p>
      ${renderPills([
        entry.setupEffort,
        entry.pricingPosture,
        `${entry.businessTypeFit.length} business fits`
      ])}
    </a>`;
}

function renderBeautyComparisonCard(entry) {
  return `
    <a class="card" href="${routeForBeautyComparison(entry.slug)}" data-analytics="compare_cta beauty_compare_cta">
      <div class="card-kicker">Beauty comparison</div>
      <h3>${renderComparisonTitle(entry, beautyReviewBySlug)}</h3>
      <p>${escapeHtml(entry.summary)}</p>
    </a>`;
}

function renderBeautyTemplateCard(entry) {
  return `
    <a class="card" href="${routeForBeautyTemplate(entry.id)}">
      <div class="card-kicker">Beauty template</div>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.intro)}</p>
    </a>`;
}

function renderLearnCard(section) {
  return `
    <a class="card" href="${routeForLearn(section.id)}">
      <div class="card-kicker">Learn</div>
      <h3>${escapeHtml(section.title)}</h3>
      <p>${escapeHtml(section.summary)}</p>
    </a>`;
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.title,
    url: SITE_URL,
    email: site.contactEmail
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.title,
    url: SITE_URL,
    description: site.description
  };
}

function breadcrumbSchema(route, breadcrumbs) {
  const fullCrumbs = [{ label: 'Home', href: '/' }, ...(breadcrumbs || [])];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullCrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href || route)
    }))
  };
}

function faqSchema(faqs) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

function renderMetaTags({ title, description, route, robots }) {
  const canonical = absoluteUrl(route);
  const socialImage = absoluteUrl(site.socialImage);
  return `
    <title>${escapeHtml(pageTitle(title))}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${site.googleSiteVerification ? `<meta name="google-site-verification" content="${escapeHtml(site.googleSiteVerification)}">` : ''}
    ${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ''}
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:site_name" content="${escapeHtml(site.title)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(pageTitle(title))}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(socialImage)}">
    <meta property="og:image:alt" content="ihelpwithai.com service business buyer's guide preview">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle(title))}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(socialImage)}">`;
}

function renderShell({
  route,
  title,
  description,
  body,
  breadcrumbs = [],
  faqs = [],
  robots = '',
  themeClass = '',
  pageEvent = '',
  pageEventProps = null
}) {
  const schemas = [organizationSchema(), websiteSchema()];
  if (route !== '/') schemas.push(breadcrumbSchema(route, breadcrumbs));
  const faqJson = faqSchema(faqs);
  if (faqJson) schemas.push(faqJson);
  const bodyClasses = [themeClass].filter(Boolean).join(' ');
  const bodyEventProps = pageEventProps ? escapeHtml(JSON.stringify(pageEventProps)) : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${renderMetaTags({ title, description, route, robots })}
  <link rel="icon" href="/assets/brand/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/apple-touch-icon.png">
  <link rel="manifest" href="/assets/brand/site.webmanifest">
  <meta name="theme-color" content="#071E3D">
  <link rel="stylesheet" href="/assets/site.css?v=${ASSET_VERSION}">
  <script defer src="/assets/site-data.js?v=${ASSET_VERSION}"></script>
  <script defer src="/assets/data-capture.js?v=${ASSET_VERSION}"></script>
  <script defer src="/assets/site.js?v=${ASSET_VERSION}"></script>
  <script type="application/ld+json">${JSON.stringify(schemas)}</script>
</head>
<body${bodyClasses ? ` class="${bodyClasses}"` : ''}${pageEvent ? ` data-page-event="${escapeHtml(pageEvent)}"` : ''}${bodyEventProps ? ` data-page-event-props="${bodyEventProps}"` : ''}>
  ${renderHeader(route)}
  ${body}
  ${renderFooter(route)}
</body>
</html>`;
}

function renderHomePage() {
  const featuredFieldReviewCards = ['jobber', 'housecall-pro', 'nicejob', 'callrail']
    .map((slug) => renderReviewCard(reviewBySlug.get(slug)))
    .join('');
  const featuredBeautyReviewCards = ['glossgenius', 'vagaro', 'boulevard', 'chatgpt']
    .map((slug) => renderBeautyReviewCard(beautyReviewBySlug.get(slug)))
    .join('');
  const featuredCompareCards = [
    renderComparisonCard(comparisonBySlug.get('jobber-vs-housecall-pro')),
    renderComparisonCard(comparisonBySlug.get('all-in-one-field-service-software-vs-separate-ai-tools')),
    renderBeautyComparisonCard(beautyComparisonBySlug.get('vagaro-vs-glossgenius')),
    renderBeautyComparisonCard(beautyComparisonBySlug.get('all-in-one-salon-software-vs-separate-ai-tools'))
  ].join('');
  const featuredFieldTradeCards = trades.slice(0, 4).map(renderTradeCard).join('');
  const featuredBeautyBusinessCards = ['hair-salons', 'barbers', 'medspas', 'tattoo-piercing-studios']
    .map((slug) => renderBeautyBusinessCard(beautyBusinessBySlug.get(slug)))
    .join('');

  return renderShell({
    route: '/',
    title: 'Choose the right AI and software for your service business',
    description: site.description,
    faqs: site.homeFaqs,
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">AI and software buyer's guides for hands-on service businesses</div>
              <h1>Choose the right AI and software for your service business.</h1>
              <p class="hero-copy">Built for hands-on businesses that need fewer missed bookings, better follow-up, smoother scheduling, stronger reviews, and less admin.</p>
              <div class="hero-actions">
                <a class="btn primary" href="/shortlist/" data-analytics="home_cta">Start the shortlist</a>
                <a class="btn secondary" href="/trades/" data-analytics="home_cta">Explore field trades</a>
                <a class="btn ghost" href="/beauty/" data-analytics="home_cta">Explore beauty &amp; wellness</a>
              </div>
            </div>
            <aside class="hero-panel">
              <div class="trust-chip">Decision engine, not directory sprawl</div>
              <ul class="checklist">
                <li>Start with the bottleneck, not the brand list.</li>
                <li>Choose the path that matches how the business actually runs.</li>
                <li>Use compare pages when the stack decision gets murky.</li>
                <li>Grab copyable templates before you buy another tool.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Choose your business type</div>
              <h2>One umbrella site, two clear service-business paths.</h2>
              <p class="section-intro">Use the path that matches the day-to-day reality of the business, then narrow by bottleneck, shortlist, reviews, comparisons, and templates.</p>
            </div>
            <div class="route-strip audience-strip">
              ${renderAudienceChoiceCard({
                kicker: 'Field trades',
                title: 'I run a field-trades business',
                description:
                  'HVAC, plumbing, electrical, roofing, landscaping, handyman, cleaning, and general contracting teams that need better lead handling, follow-up, dispatch, reviews, and office structure.',
                detail:
                  'Use the field-trades hub, field shortlist, contractor reviews, compare pages, and templates.',
                href: '/trades/',
                cta: 'Go to field trades'
              })}
              ${renderAudienceChoiceCard({
                kicker: 'Beauty & wellness',
                title: 'I run a beauty or wellness business',
                description:
                  'Salons, barbers, nails, lashes, brows, esthetics, medspas, massage, makeup, and tattoo or piercing studios that need better booking, rebooking, reviews, content, deposits, and front-desk flow.',
                detail:
                  'Use the Beauty & Wellness hub, beauty shortlist, beauty reviews, beauty comparisons, and beauty templates.',
                href: '/beauty/',
                cta: 'Go to beauty & wellness',
                className: 'theme-beauty-card'
              })}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Field Trades</div>
              <h2>Guidance for crews, dispatch, quotes, reviews, and office follow-up.</h2>
              <p class="section-intro">The field-trades side stays focused on missed calls, quote follow-up, dispatch, reviews, and admin for service teams that live in the field.</p>
            </div>
            <div class="grid cols-2">${featuredFieldTradeCards}</div>
            <div class="cta-row" style="margin-top:18px"><a class="btn secondary" href="/trades/" data-analytics="home_cta">Browse all field-trades guides</a><a class="btn secondary" href="/problems/" data-analytics="home_cta">Browse field-trade problems</a></div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Beauty &amp; Wellness</div>
              <h2>Guidance for booking, rebooking, retention, reviews, content, and front-desk flow.</h2>
              <p class="section-intro">${escapeHtml(beautyVertical.intro)}</p>
            </div>
            <div class="grid cols-2">${featuredBeautyBusinessCards}</div>
            <div class="cta-row" style="margin-top:18px"><a class="btn secondary" href="/beauty/" data-analytics="home_cta">Browse Beauty &amp; Wellness</a><a class="btn secondary" href="/beauty/shortlist/" data-analytics="home_cta">Start the beauty shortlist</a><a class="btn secondary" href="${routeForBeautyStarterPack()}" data-analytics="home_cta">Get the beauty starter pack</a></div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Featured comparisons</div>
              <h2>Use compare pages when the stack decision is the real problem.</h2>
              <p class="section-intro">The compare library now covers both field-trades and Beauty &amp; Wellness software decisions.</p>
            </div>
            <div class="grid cols-2">${featuredCompareCards}</div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <div class="trust-chip">Field-trades reviews</div>
                <h2>Pressure-test field-trades software before you commit to a demo cycle.</h2>
              </div>
              <div class="grid cols-2">${featuredFieldReviewCards}</div>
            </div>
            <div>
              <div class="section-heading">
                <div class="trust-chip">Beauty reviews</div>
                <h2>Compare booking, retention, and content tools for beauty teams.</h2>
              </div>
              <div class="grid cols-2">${featuredBeautyReviewCards}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">What to automate first</div>
              <h2>Automate the leak, not the fantasy.</h2>
              <p>Good first automations usually touch missed calls, estimate follow-up, review requests, rebooking nudges, reminders, deposits, or repeat office communication. If the whole operating system is fragmented, fix that first.</p>
            </article>
            ${renderTrustPanel()}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Starter packs</div>
              <h2>Pick the starter pack that matches the business.</h2>
              <p class="section-intro">Both paths lead with practical copy, fast decision support, and a cleaner next step than opening ten vendor tabs at once.</p>
            </div>
            <div class="grid cols-2">
              <article class="card">
                <div class="card-kicker">Field Trades</div>
                <h3>Get the Field Trades starter pack.</h3>
                <p>The field-trades pack includes missed-call texts, estimate follow-up examples, review request copy, one SOP prompt pack, and a simple decision checklist.</p>
                ${renderBulletList(legalPages.starterPack.bullets)}
                <div class="cta-row" style="margin-top:18px">
                  <a class="btn primary" href="/starter-pack/" data-analytics="home_cta">Get the Field Trades starter pack</a>
                  <a class="btn secondary" href="/shortlist/" data-analytics="home_cta">Start the field-trades shortlist</a>
                </div>
              </article>
              <article class="card">
                <div class="card-kicker">Beauty &amp; Wellness</div>
                <h3>Get the Beauty &amp; Wellness starter pack.</h3>
                <p>The beauty pack helps tighten reminders, no-show policies, deposits, rebooking, review asks, and client follow-up before you add more software.</p>
                ${renderBulletList(beautyStarterPack.bullets)}
                <div class="cta-row" style="margin-top:18px">
                  <a class="btn primary" href="${routeForBeautyStarterPack()}" data-analytics="home_cta">Get the Beauty &amp; Wellness starter pack</a>
                  <a class="btn secondary" href="/beauty/shortlist/" data-analytics="home_cta">Start the beauty shortlist</a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">FAQ</div>
              <h2>Common first-session questions</h2>
            </div>
            ${renderFaqList(site.homeFaqs)}
          </div>
        </section>
      </main>`
  });
}

function renderHubPage({
  route,
  title,
  description,
  eyebrow,
  intro,
  cards,
  secondaryPanel,
  breadcrumbs = [{ label: title }],
  themeClass = '',
  pageEvent = '',
  pageEventProps = null
}) {
  return renderShell({
    route,
    title,
    description,
    themeClass,
    pageEvent,
    pageEventProps,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs(breadcrumbs)}
              <div class="trust-chip">${escapeHtml(eyebrow)}</div>
              <h1 class="page-title">${escapeHtml(title)}</h1>
              <p>${escapeHtml(intro)}</p>
            </div>
            <div class="page-grid">
              <div class="grid cols-2">${cards}</div>
              ${secondaryPanel || renderTrustPanel()}
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderShortlistPage() {
  return renderShell({
    route: '/shortlist/',
    title: 'Shortlist field-trades software and AI by bottleneck',
    description:
      'Use the field-trades shortlist to narrow the right next software decision by trade, team size, bottleneck, budget, and setup tolerance.',
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">Field-trades shortlist</div>
              <h1>Get a practical shortlist in under five minutes.</h1>
              <p class="hero-copy">Answer a few questions about your trade, team, bottleneck, current stack, and setup reality. The goal is to narrow the next move, not create more software tabs to compare.</p>
            </div>
            <aside class="hero-panel">
              <div class="trust-chip">What you get</div>
              <ul class="checklist">
                <li>A primary recommendation</li>
                <li>Two alternative routes to compare</li>
                <li>Context on whether you need an all-in-one or a focused fix</li>
              </ul>
              <p class="microcopy">Need the appointment-based path instead? Start the <a href="/beauty/shortlist/">Beauty &amp; Wellness shortlist</a>.</p>
            </aside>
          </div>
        </section>
        <section class="section">
          <div class="container shortlist-layout" data-shortlist-root>
            <div class="shortlist-shell">
              <div class="step-progress">
                <div class="trust-chip">Quiz progress</div>
                <div class="step-progress-bar"><div class="step-progress-fill" data-shortlist-progress></div></div>
                <div class="microcopy" data-shortlist-progress-label>Step 1 of 4</div>
              </div>
              <form data-shortlist-form="field" data-analytics="shortlist_start">
                <div class="step-panel" data-shortlist-step="trade-team">
                  <h3>Start with the shop profile</h3>
                  <p class="muted">These two answers frame the kind of stack that is realistic for your business right now.</p>
                  <div class="form-grid two">
                    <label>Trade
                      <select name="trade" required>
                        <option value="">Select a trade</option>
                        ${site.shortlistQuestions[0].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>Team size
                      <select name="teamSize" required>
                        <option value="">Select a team size</option>
                        ${site.shortlistQuestions[1].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="step-panel" data-shortlist-step="bottleneck-stack" hidden>
                  <h3>Find the main leak</h3>
                  <p class="muted">Do not describe every problem. Pick the one that is costing the business the most attention or revenue right now.</p>
                  <div class="form-grid two">
                    <label>Biggest bottleneck
                      <select name="bottleneck" required>
                        <option value="">Select the bottleneck</option>
                        ${site.shortlistQuestions[2].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>Current stack
                      <select name="currentStack" required>
                        <option value="">Select the current stack</option>
                        ${site.shortlistQuestions[3].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="step-panel" data-shortlist-step="office-volume" hidden>
                  <h3>Pressure on the office and phone</h3>
                  <p class="muted">This helps the shortlist decide whether the best next move is a phone fix, a process fix, or a broader software change.</p>
                  <div class="form-grid two">
                    <label>Office support
                      <select name="officeSupport" required>
                        <option value="">Select office support</option>
                        ${site.shortlistQuestions[4].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>After-hours call volume
                      <select name="afterHoursLeadVolume" required>
                        <option value="">Select call pressure</option>
                        ${site.shortlistQuestions[5].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="step-panel" data-shortlist-step="budget-setup" hidden>
                  <h3>Budget and setup reality</h3>
                  <p class="muted">This is where a lot of wrong software decisions happen. Be honest about what the team can actually absorb.</p>
                  <div class="form-grid two">
                    <label>Budget posture
                      <select name="budget" required>
                        <option value="">Select budget posture</option>
                        ${site.shortlistQuestions[6].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>Setup tolerance
                      <select name="setupTolerance" required>
                        <option value="">Select setup tolerance</option>
                        ${site.shortlistQuestions[7].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="quiz-nav">
                  <button class="btn secondary" type="button" data-shortlist-back>Back</button>
                  <button class="btn secondary" type="button" data-shortlist-next data-analytics="shortlist_step">Next</button>
                  <button class="btn primary" type="submit" data-shortlist-submit data-analytics="shortlist_submit" hidden>Build my shortlist</button>
                </div>
              </form>
            </div>
            ${renderTrustPanel()}
            <div class="shortlist-output" data-shortlist-output>
              <div class="results-shell" data-shortlist-results>
                <div class="result-primary" data-shortlist-primary>
                  <h3>Recommended first move</h3>
                  <p>Finish the shortlist to see the first route that best matches your trade, bottleneck, and setup reality.</p>
                </div>
                <div class="result-grid" data-shortlist-grid></div>
              </div>
              <p class="empty-state" data-shortlist-empty hidden>There is not a strong fit inside the current shortlist for that exact combination yet. Loosen the constraints and try again.</p>
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderBeautyShortlistPage() {
  return renderShell({
    route: '/beauty/shortlist/',
    title: 'Shortlist beauty and wellness software by bottleneck',
    description:
      'Use the Beauty & Wellness shortlist to narrow the right next software decision by business type, team model, bottleneck, current setup, budget, and setup tolerance.',
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">Beauty &amp; Wellness shortlist</div>
              <h1>Get a practical beauty-tech shortlist in under five minutes.</h1>
              <p class="hero-copy">Answer a few questions about your business type, team model, biggest bottleneck, current setup, budget, and setup reality. The goal is to narrow the next move, not to add more tabs and more software noise.</p>
            </div>
            <aside class="hero-panel">
              <div class="trust-chip">What you get</div>
              <ul class="checklist">
                <li>A primary recommendation for the next software move</li>
                <li>Two alternative routes to compare before you switch</li>
                <li>Clearer separation between operating-system problems and one-tool fixes</li>
              </ul>
              <p class="microcopy">Need the crew, dispatch, and field-service side instead? Start the <a href="/shortlist/">field-trades shortlist</a>.</p>
            </aside>
          </div>
        </section>
        <section class="section">
          <div class="container shortlist-layout" data-shortlist-root>
            <div class="shortlist-shell">
              <div class="step-progress">
                <div class="trust-chip">Quiz progress</div>
                <div class="step-progress-bar"><div class="step-progress-fill" data-shortlist-progress></div></div>
                <div class="microcopy" data-shortlist-progress-label>Step 1 of 3</div>
              </div>
              <form data-shortlist-form="beauty" data-analytics="shortlist_start">
                <div class="step-panel" data-shortlist-step="business-team">
                  <h3>Start with the business model</h3>
                  <p class="muted">These first two answers shape whether the right next move is a solo-friendly booking stack, a stronger front-desk system, or a more team-oriented platform.</p>
                  <div class="form-grid two">
                    <label>Business type
                      <select name="businessType" required>
                        <option value="">Select a business type</option>
                        ${beautyShortlistQuestions[0].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>How you work
                      <select name="teamSize" required>
                        <option value="">Select the team model</option>
                        ${beautyShortlistQuestions[1].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="step-panel" data-shortlist-step="bottleneck-stack" hidden>
                  <h3>Find the main leak</h3>
                  <p class="muted">Pick the bottleneck that is costing the business the most time, revenue, or front-desk energy right now.</p>
                  <div class="form-grid two">
                    <label>Biggest bottleneck
                      <select name="bottleneck" required>
                        <option value="">Select the bottleneck</option>
                        ${beautyShortlistQuestions[2].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>Current setup
                      <select name="currentStack" required>
                        <option value="">Select the current setup</option>
                        ${beautyShortlistQuestions[3].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="step-panel" data-shortlist-step="budget-setup" hidden>
                  <h3>Budget and setup reality</h3>
                  <p class="muted">Be honest about cost tolerance and rollout capacity so the shortlist leans toward tools the business can actually absorb.</p>
                  <div class="form-grid two">
                    <label>Budget
                      <select name="budget" required>
                        <option value="">Select the budget</option>
                        ${beautyShortlistQuestions[4].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                    <label>Setup tolerance
                      <select name="setupTolerance" required>
                        <option value="">Select setup tolerance</option>
                        ${beautyShortlistQuestions[5].options
                          .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                          .join('')}
                      </select>
                    </label>
                  </div>
                </div>
                <div class="quiz-nav">
                  <button class="btn secondary" type="button" data-shortlist-back>Back</button>
                  <button class="btn secondary" type="button" data-shortlist-next data-analytics="shortlist_step">Next</button>
                  <button class="btn primary" type="submit" data-shortlist-submit data-analytics="shortlist_submit" hidden>Build my shortlist</button>
                </div>
              </form>
            </div>
            ${renderTrustPanel()}
            <div class="shortlist-output" data-shortlist-output>
              <div class="results-shell" data-shortlist-results>
                <div class="result-primary" data-shortlist-primary>
                  <h3>Recommended first move</h3>
                  <p>Finish the shortlist to see the first route that best matches your business type, bottleneck, and setup reality.</p>
                </div>
                <div class="result-grid" data-shortlist-grid></div>
              </div>
              <p class="empty-state" data-shortlist-empty hidden>There is not a strong fit inside the current beauty shortlist for that exact mix yet. Loosen the constraints and try again.</p>
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderBeautyHubPage() {
  return renderShell({
    route: '/beauty/',
    title: 'Beauty & Wellness software buyer\'s guide',
    description: beautyVertical.description,
    themeClass: 'theme-beauty',
    pageEvent: 'ihai_beauty_hub_viewed',
    pageEventProps: { vertical: 'beauty' },
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">Beauty &amp; Wellness</div>
              <h1>Choose the right AI and software for the business side of beauty and wellness work.</h1>
              <p class="hero-copy">${escapeHtml(beautyVertical.description)}</p>
              <div class="hero-actions">
                <a class="btn primary" href="/beauty/shortlist/" data-analytics="home_cta">Start the beauty shortlist</a>
                <a class="btn secondary" href="/beauty/reviews/" data-analytics="home_cta">Browse beauty reviews</a>
                <a class="btn ghost" href="${routeForBeautyStarterPack()}" data-analytics="home_cta">Get the beauty starter pack</a>
              </div>
            </div>
            <aside class="hero-panel">
              <div class="trust-chip">What this vertical covers</div>
              <ul class="checklist">
                <li>Online booking, deposits, and no-show protection</li>
                <li>Rebooking, retention, and loyalty follow-up</li>
                <li>DM response, reviews, and social-content workflows</li>
                <li>Front-desk admin, client notes, and service-policy communication</li>
              </ul>
            </aside>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Business categories</div>
              <h2>Find the software fit for how the business actually books, serves, and follows up.</h2>
              <p class="section-intro">${escapeHtml(beautyVertical.homeBlurb)}</p>
            </div>
            <div class="grid cols-3">${beautyBusinesses.map(renderBeautyBusinessCard).join('')}</div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Beauty bottlenecks</div>
              <h2>Start where the calendar, front desk, or client follow-up is leaking revenue.</h2>
              <p class="section-intro">${escapeHtml(beautyVertical.problemBlurb)}</p>
            </div>
            <div class="grid cols-2">${beautyProblems.map(renderBeautyProblemCard).join('')}</div>
            <div class="cta-row" style="margin-top:18px">
              <a class="btn secondary" href="/beauty/problems/">Browse beauty problems</a>
              <a class="btn secondary" href="${routeForBeautyStarterPack()}">Get the beauty starter pack</a>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Beauty reviews</h2>
              </div>
              <div class="grid">${beautyReviews.slice(0, 4).map(renderBeautyReviewCard).join('')}</div>
            </div>
            <div>
              <div class="section-heading">
                <h2>Beauty comparisons</h2>
              </div>
              <div class="grid">${beautyComparisons.map(renderBeautyComparisonCard).join('')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Beauty templates</h2>
              </div>
              <div class="grid">${beautyTemplates.slice(0, 4).map(renderBeautyTemplateCard).join('')}</div>
              <div class="cta-row" style="margin-top:18px"><a class="btn secondary" href="${routeForBeautyStarterPack()}">Get the beauty starter pack</a></div>
            </div>
            <article class="banner">
              <div class="trust-chip">Need a faster answer?</div>
              <h2>Use the beauty shortlist before you demo another tool.</h2>
              <p>${escapeHtml(beautyVertical.shortlistBlurb)}</p>
              <div class="cta-row">
                <a class="btn primary" href="/beauty/shortlist/">Build the beauty shortlist</a>
                <a class="btn secondary" href="/trades/">See the field-trades side</a>
              </div>
            </article>
          </div>
        </section>
      </main>`
  });
}

function renderBeautyReviewScorecard(review) {
  return `
    <aside class="scorecard">
      <div class="scorecard-row">
        <span>One-line verdict</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.oneLineVerdict)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Booking strength</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.bookingStrength)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>No-show and rebooking</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.noShowSupport)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Payments and deposits</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.paymentsSupport)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Pricing posture</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.pricingPosture)}</strong></div>
      </div>
      ${review.reviewBasis ? `
      <div class="scorecard-row">
        <span>Review basis</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.reviewBasis)}</strong></div>
      </div>` : ''}
      ${review.pricingCheckDate ? `
      <div class="scorecard-row">
        <span>Pricing checked</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.pricingCheckDate)}</strong></div>
      </div>` : ''}
      <div class="scorecard-row">
        <span>Last reviewed</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.lastReviewed)}</strong></div>
      </div>
    </aside>`;
}

function renderBeautyBusinessPage(entry) {
  return renderShell({
    route: routeForBeautyBusiness(entry.slug),
    title: `Best AI and software for ${entry.title}`,
    description: entry.description,
    breadcrumbs: [
      { label: 'Beauty & Wellness', href: '/beauty/' },
      { label: entry.title }
    ],
    faqs: entry.faqs,
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Beauty & Wellness', href: '/beauty/' },
              { label: entry.title }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Beauty category guide</div>
                <h1 class="page-title">Best AI and software for ${escapeHtml(entry.title)}</h1>
                <p>${escapeHtml(entry.description)}</p>
                ${renderPills(entry.featuredProblems.map((slug) => beautyProblemBySlug.get(slug)?.title || toSlugLabel(slug)))}
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Top bottlenecks in this category</h2>
            </div>
            <div class="grid cols-3">
              ${entry.bottlenecks
                .map(
                  (item) => `
                <article class="card">
                  <div class="card-kicker">Where teams lose time</div>
                  <p>${escapeHtml(item)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Recommended stack by business stage</h2>
            </div>
            <div class="grid cols-3">
              ${entry.stackStages
                .map(
                  (stage) => `
                <article class="card">
                  <h3>${escapeHtml(stage.title)}</h3>
                  <p>${escapeHtml(stage.body)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Best-fit categories</div>
              <h3>What this business usually needs first</h3>
              ${renderBulletList(entry.categories)}
            </article>
            <article class="banner">
              <div class="trust-chip">Next step</div>
              <h2>If you are still not sure, run the beauty shortlist.</h2>
              <p>The beauty shortlist is built to narrow the next move by business type, team model, bottleneck, budget, and setup tolerance.</p>
              <div class="cta-row"><a class="btn primary" href="/beauty/shortlist/">Build the beauty shortlist</a></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Featured reviews</h2>
            </div>
            <div class="grid cols-3">${entry.featuredReviews
              .map((slug) => renderBeautyReviewCard(beautyReviewBySlug.get(slug)))
              .join('')}</div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Featured comparisons</h2>
              </div>
              <div class="grid">${entry.featuredComparisons
                .map((slug) => renderBeautyComparisonCard(beautyComparisonBySlug.get(slug)))
                .join('')}</div>
            </div>
            <div>
              <div class="section-heading">
                <h2>Related templates</h2>
              </div>
              <div class="grid">${entry.featuredTemplates
                .map((id) => renderBeautyTemplateCard(beautyTemplateById.get(id)))
                .join('')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(entry.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderBeautyProblemPage(entry) {
  return renderShell({
    route: routeForBeautyProblem(entry.slug),
    title: `How beauty and wellness businesses can fix ${entry.title.toLowerCase()}`,
    description: entry.description,
    breadcrumbs: [
      { label: 'Beauty & Wellness', href: '/beauty/' },
      { label: entry.title }
    ],
    faqs: entry.faqs,
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Beauty & Wellness', href: '/beauty/' },
              { label: entry.title }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Beauty problem path</div>
                <h1 class="page-title">How beauty and wellness businesses can fix ${escapeHtml(entry.title.toLowerCase())} without more admin drag</h1>
                <p>${escapeHtml(entry.description)}</p>
                <p>${escapeHtml(entry.whyItMatters)}</p>
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Signs this is the real problem</div>
              ${renderBulletList(entry.symptoms)}
            </article>
            <article class="card">
              <div class="card-kicker">What to measure</div>
              ${renderBulletList(entry.roiFactors)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Solution categories that usually help</h2>
            </div>
            <div class="grid cols-3">
              ${entry.solutionCategories
                .map(
                  (category) => `
                <article class="card">
                  <h3>${escapeHtml(category.title)}</h3>
                  <p>${escapeHtml(category.body)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Recommended reviews</h2>
              </div>
              <div class="grid">${entry.recommendedReviews
                .map((slug) => renderBeautyReviewCard(beautyReviewBySlug.get(slug)))
                .join('')}</div>
            </div>
            <div>
              <div class="section-heading">
                <h2>Related compare pages</h2>
              </div>
              <div class="grid">${entry.recommendedComparisons
                .map((slug) => renderBeautyComparisonCard(beautyComparisonBySlug.get(slug)))
                .join('')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Templates you can use today</h2>
              </div>
              <div class="grid">${entry.recommendedTemplates
                .map((id) => renderBeautyTemplateCard(beautyTemplateById.get(id)))
                .join('')}</div>
            </div>
            <article class="banner">
              <div class="trust-chip">Still unsure?</div>
              <h2>Use the beauty shortlist to choose the first software move.</h2>
              <p>The beauty shortlist helps separate "fix the booking system" problems from "fix one workflow" problems.</p>
              <div class="cta-row"><a class="btn primary" href="/beauty/shortlist/">Start the beauty shortlist</a></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(entry.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderBeautyReviewPage(review) {
  return renderShell({
    route: routeForBeautyReview(review.slug),
    title: `${review.toolName} review for beauty and wellness businesses`,
    description: review.summary,
    breadcrumbs: [
      { label: 'Beauty & Wellness', href: '/beauty/' },
      { label: 'Reviews', href: '/beauty/reviews/' },
      { label: review.toolName }
    ],
    faqs: review.faqs,
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Beauty & Wellness', href: '/beauty/' },
              { label: 'Reviews', href: '/beauty/reviews/' },
              { label: review.toolName }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">${escapeHtml(review.category)}</div>
                <h1 class="page-title">${renderReviewName(review)} review for beauty and wellness businesses</h1>
                <p>${escapeHtml(review.summary)}</p>
                ${renderPills(review.businessTypeFit, (slug) => beautyBusinessBySlug.get(slug)?.title || toSlugLabel(slug))}
                ${renderPills(review.teamSizeFit, toSlugLabel)}
                <div class="cta-row" style="margin-top:16px">
                  <a class="btn primary" href="${review.officialUrl}" target="_blank" rel="noopener noreferrer" data-analytics="review_cta beauty_review_cta outbound_tool_click">Visit official site</a>
                  ${review.compareLinks[0] ? `<a class="btn secondary" href="${routeForBeautyComparison(review.compareLinks[0])}" data-analytics="compare_cta beauty_compare_cta">Read the closest comparison</a>` : ''}
                  <a class="btn secondary" href="/beauty/shortlist/">Run the beauty shortlist</a>
                  <a class="btn secondary" href="${routeForBeautyStarterPack()}">Get the beauty starter pack</a>
                </div>
              </div>
              ${renderBeautyReviewScorecard(review)}
            </div>
          </div>
        </section>

        ${renderInfoCardSection([
          review.reviewBasis || review.pricingCheckDate
            ? {
                kicker: 'Editorial snapshot',
                bullets: [
                  review.reviewBasis ? `Review basis: ${review.reviewBasis}` : '',
                  review.pricingCheckDate ? `Pricing check date: ${review.pricingCheckDate}` : ''
                ].filter(Boolean)
              }
            : null,
          review.bestFitBusinessSize
            ? {
                kicker: 'Best-fit business size',
                text: review.bestFitBusinessSize
              }
            : null,
          review.switchingDifficulty
            ? {
                kicker: 'Switching difficulty',
                text: review.switchingDifficulty
              }
            : null,
          review.integrationsStackFit
            ? {
                kicker: 'Integrations and stack fit',
                bullets: Array.isArray(review.integrationsStackFit)
                  ? review.integrationsStackFit
                  : [review.integrationsStackFit]
              }
            : null
        ])}

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Best fit</div>
              <p>${escapeHtml(review.bestFit)}</p>
            </article>
            <article class="card">
              <div class="card-kicker">Bad fit</div>
              <p>${escapeHtml(review.badFit)}</p>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Business types served</div>
              ${renderBulletList(review.businessTypeFit.map((slug) => beautyBusinessBySlug.get(slug)?.title || toSlugLabel(slug)))}
            </article>
            <article class="card">
              <div class="card-kicker">Solo vs team fit</div>
              ${renderBulletList([review.soloTeamFit, `Works best for: ${review.teamSizeFit.map(toSlugLabel).join(', ')}`])}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container grid cols-3">
            <article class="card">
              <div class="card-kicker">Booking and calendar</div>
              ${renderBulletList([
                `Booking strength: ${review.bookingStrength}`,
                `No-show and rebooking support: ${review.noShowSupport}`,
                `Payments and deposit support: ${review.paymentsSupport}`
              ])}
            </article>
            <article class="card">
              <div class="card-kicker">Marketing and retention</div>
              ${renderBulletList([
                `Marketing and client retention: ${review.marketingSupport}`,
                `Social and content support: ${review.socialSupport}`,
                `Setup reality: ${review.setupEffort}`
              ])}
            </article>
            <article class="card">
              <div class="card-kicker">First workflow to try</div>
              <p>${escapeHtml(review.firstWorkflow)}</p>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Where it shines</div>
              ${renderBulletList(review.strengths)}
            </article>
            <article class="card">
              <div class="card-kicker">Do not buy this if...</div>
              ${renderBulletList([review.doNotBuyIf, ...review.watchOuts])}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Alternatives</div>
              <ul class="bullet-list">
                ${review.alternatives
                  .map((alternative) => {
                    const target = beautyReviewBySlug.get(alternative.slug);
                    const reason = alternative.reason.replace(/^better fit when\s+/i, '');
                    return `<li><a href="${routeForBeautyReview(alternative.slug)}" data-analytics="review_cta beauty_review_cta">${renderReviewName(target)}</a> is a better fit when ${escapeHtml(reason)}.</li>`;
                  })
                  .join('')}
              </ul>
            </article>
            <article class="card">
              <div class="card-kicker">Related comparisons</div>
              <ul class="bullet-list">
                ${review.compareLinks
                  .map((slug) => {
                    const comparison = beautyComparisonBySlug.get(slug);
                    return `<li><a href="${routeForBeautyComparison(slug)}" data-analytics="compare_cta beauty_compare_cta">${renderComparisonTitle(comparison, beautyReviewBySlug)}</a></li>`;
                  })
                  .join('')}
              </ul>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Ready to choose?</div>
              <h2>Use the beauty shortlist if you still need a fit check before you buy.</h2>
              <p>The shortlist helps separate booking-system problems from lighter add-on decisions like content, review response, or automation glue.</p>
              <div class="cta-row">
                <a class="btn primary" href="${review.officialUrl}" target="_blank" rel="noopener noreferrer" data-analytics="review_cta beauty_review_cta outbound_tool_click">Visit official site</a>
                <a class="btn secondary" href="/beauty/shortlist/">Run the beauty shortlist</a>
                <a class="btn secondary" href="${routeForBeautyStarterPack()}">Get the beauty starter pack</a>
              </div>
            </article>
            ${renderMonetizationCard(review.disclosureNote)}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(review.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderBeautyComparisonPage(comparison) {
  const left = beautyReviewBySlug.get(comparison.leftTool);
  const right = beautyReviewBySlug.get(comparison.rightTool);
  const leftDisplay = renderComparisonSideName(comparison, 'left', left);
  const rightDisplay = renderComparisonSideName(comparison, 'right', right);

  return renderShell({
    route: routeForBeautyComparison(comparison.slug),
    title: comparison.title,
    description: comparison.summary,
    breadcrumbs: [
      { label: 'Beauty & Wellness', href: '/beauty/' },
      { label: 'Compare', href: '/beauty/compare/' },
      { label: comparison.shortTitle }
    ],
    faqs: comparison.faqs,
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Beauty & Wellness', href: '/beauty/' },
              { label: 'Compare', href: '/beauty/compare/' },
              { label: comparison.shortTitle }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Beauty comparison</div>
                <h1 class="page-title">${renderComparisonTitle(comparison, beautyReviewBySlug)}</h1>
                <p>${escapeHtml(comparison.scenario)}</p>
                <p>${escapeHtml(comparison.summary)}</p>
                <div class="cta-row" style="margin-top:16px">
                  <a class="btn primary" href="${routeForBeautyReview(comparison.leftTool)}" data-analytics="review_cta beauty_review_cta">Read ${escapeHtml(left.toolName)}</a>
                  <a class="btn secondary" href="${routeForBeautyReview(comparison.rightTool)}" data-analytics="review_cta beauty_review_cta">Read ${escapeHtml(right.toolName)}</a>
                  <a class="btn secondary" href="/beauty/shortlist/">Run the beauty shortlist</a>
                </div>
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        ${renderInfoCardSection([
          comparison.reviewBasis || comparison.pricingCheckDate
            ? {
                kicker: 'Editorial snapshot',
                bullets: [
                  comparison.reviewBasis ? `Review basis: ${comparison.reviewBasis}` : '',
                  comparison.pricingCheckDate ? `Pricing check date: ${comparison.pricingCheckDate}` : ''
                ].filter(Boolean)
              }
            : null,
          comparison.bestFitBusinessSize
            ? {
                kicker: 'Best-fit business size',
                text: comparison.bestFitBusinessSize
              }
            : null,
          comparison.switchingDifficulty
            ? {
                kicker: 'Switching difficulty',
                text: comparison.switchingDifficulty
              }
            : null,
          comparison.integrationsStackFit
            ? {
                kicker: 'Integrations and stack fit',
                bullets: Array.isArray(comparison.integrationsStackFit)
                  ? comparison.integrationsStackFit
                  : [comparison.integrationsStackFit]
              }
            : null,
          comparison.firstWorkflow
            ? {
                kicker: 'First workflow to try',
                text: comparison.firstWorkflow
              }
            : null
        ])}

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Choose ${leftDisplay} if...</div>
              ${renderBulletList(comparison.chooseLeft)}
            </article>
            <article class="card">
              <div class="card-kicker">Choose ${rightDisplay} if...</div>
              ${renderBulletList(comparison.chooseRight)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container table-wrap">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>Decision point</th>
                  <th>${leftDisplay}</th>
                  <th>${rightDisplay}</th>
                </tr>
              </thead>
              <tbody>
                ${comparison.rows
                  .map(
                    (row) => `
                  <tr>
                    <th>${escapeHtml(row[0])}</th>
                    <td>${escapeHtml(row[1])}</td>
                    <td>${escapeHtml(row[2])}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Final recommendation by business type</div>
              ${renderBulletList(comparison.finalRecommendations)}
            </article>
            <article class="banner">
              <div class="trust-chip">Still split?</div>
              <h2>Use the beauty shortlist to narrow the next move.</h2>
              <p>The shortlist helps separate operating-system problems from lighter add-on decisions.</p>
              <div class="cta-row"><a class="btn primary" href="/beauty/shortlist/">Run the beauty shortlist</a></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            ${renderBeautyReviewCard(left)}
            ${renderBeautyReviewCard(right)}
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Still comparing?</div>
              <h2>Read both reviews, then use the shortlist if the fit still feels muddy.</h2>
              <p>That usually clarifies whether the business needs the broader operating system, the lighter setup, or a smaller add-on instead.</p>
              <div class="cta-row">
                <a class="btn primary" href="${routeForBeautyReview(comparison.leftTool)}" data-analytics="review_cta beauty_review_cta">Read ${escapeHtml(left.toolName)}</a>
                <a class="btn secondary" href="${routeForBeautyReview(comparison.rightTool)}" data-analytics="review_cta beauty_review_cta">Read ${escapeHtml(right.toolName)}</a>
                <a class="btn secondary" href="/beauty/shortlist/">Run the beauty shortlist</a>
              </div>
            </article>
            ${renderMonetizationCard(comparison.disclosureNote)}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(comparison.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderBeautyProblemsPage() {
  return renderHubPage({
    route: '/beauty/problems/',
    title: 'Beauty Problems',
    description: 'Browse Beauty & Wellness software and AI guidance by bottleneck.',
    eyebrow: 'Beauty problem hub',
    intro:
      'Start here when you already know the leak. These pages stay focused on booking, rebooking, reviews, deposits, DMs, content, and front-desk admin instead of forcing category jargon first.',
    cards: beautyProblems.map(renderBeautyProblemCard).join(''),
    secondaryPanel: `
      <aside class="card">
        <div class="card-kicker">Most common first moves</div>
        ${renderBulletList([
          'Fix no-shows and deposits before buying more awareness.',
          'Fix rebooking before spending more to refill the calendar.',
          'Fix front-desk admin before piling on more automations.'
        ])}
        <div class="cta-row"><a class="btn secondary small" href="/beauty/shortlist/">Run the beauty shortlist</a><a class="btn secondary small" href="${routeForBeautyStarterPack()}">Get the beauty starter pack</a></div>
      </aside>`,
    breadcrumbs: [
      { label: 'Beauty & Wellness', href: '/beauty/' },
      { label: 'Beauty Problems' }
    ],
    themeClass: 'theme-beauty'
  });
}

function renderBeautyTemplatesPage() {
  return renderShell({
    route: '/beauty/templates/',
    title: 'Copyable templates for beauty and wellness businesses',
    description:
      'Use copyable messages, prompts, policies, rebooking nudges, and follow-up templates built for salons, barbers, medspas, studios, and independent beauty pros.',
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([
                { label: 'Beauty & Wellness', href: '/beauty/' },
                { label: 'Templates' }
              ])}
              <div class="trust-chip">Beauty template library</div>
              <h1 class="page-title">Copyable templates for the business side of beauty and wellness work.</h1>
              <p>These are meant to be useful right away, even before you switch software.</p>
              <p class="microcopy">Want the shortcut version first? Grab the <a href="${routeForBeautyStarterPack()}">Beauty &amp; Wellness starter pack</a>.</p>
            </div>
            <div class="grid">
              ${beautyTemplates
                .map(
                  (section) => `
                <section class="template-block" id="${section.id}">
                  <div class="template-header">
                    <div>
                      <div class="card-kicker">Beauty template</div>
                      <h3>${escapeHtml(section.title)}</h3>
                      <p>${escapeHtml(section.intro)}</p>
                    </div>
                  </div>
                  <div class="split-panel">
                    <article class="note-card">
                      <h3>How to use it</h3>
                      ${renderBulletList(section.tips)}
                    </article>
                    <article class="note-card">
                      <h3>Good companion paths</h3>
                      <div class="inline-links">
                        ${section.relatedProblems
                          .map(
                            (slug) => `<a class="inline-link" href="${routeForBeautyProblem(slug)}">${escapeHtml(beautyProblemBySlug.get(slug).title)}</a>`
                          )
                          .join('')}
                      </div>
                      <div class="inline-links">
                        ${section.relatedBusinesses
                          .map(
                            (slug) => `<a class="inline-link" href="${routeForBeautyBusiness(slug)}">${escapeHtml(beautyBusinessBySlug.get(slug).title)}</a>`
                          )
                          .join('')}
                      </div>
                    </article>
                  </div>
                  ${section.blocks
                    .map(
                      (block, index) => `
                    <div class="template-copy-wrap">
                      <div class="template-header">
                        <div>
                          <div class="card-kicker">Copy block ${index + 1}</div>
                          <h3>${escapeHtml(block.title)}</h3>
                        </div>
                        <button class="btn secondary small" type="button" data-copy-target="${section.id}-${index}" data-analytics="template_copy beauty_template_copy">Copy</button>
                      </div>
                      <pre class="template-copy" id="${section.id}-${index}">${escapeHtml(block.copy)}</pre>
                    </div>`
                    )
                    .join('')}
                </section>`
                )
                .join('')}
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderTradePage(trade) {
  return renderShell({
    route: routeForTrade(trade.slug),
    title: `Best AI and software for ${trade.title} businesses`,
    description: trade.description,
    breadcrumbs: [
      { label: 'Trades', href: '/trades/' },
      { label: trade.title }
    ],
    faqs: trade.faqs,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Trades', href: '/trades/' },
              { label: trade.title }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Trade guide</div>
                <h1 class="page-title">Best AI and software for ${escapeHtml(trade.title)} businesses</h1>
                <p>${escapeHtml(trade.description)}</p>
                ${renderPills(trade.featuredProblems.map((slug) => problemBySlug.get(slug).title))}
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Top bottlenecks in this trade</h2>
            </div>
            <div class="grid cols-3">
              ${trade.bottlenecks
                .map(
                  (item) => `
                <article class="card">
                  <div class="card-kicker">Where teams lose time</div>
                  <p>${escapeHtml(item)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Recommended stack by business stage</h2>
            </div>
            <div class="grid cols-3">
              ${trade.stackStages
                .map(
                  (stage) => `
                <article class="card">
                  <h3>${escapeHtml(stage.title)}</h3>
                  <p>${escapeHtml(stage.body)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Best-fit categories</div>
              <h3>What this trade usually needs first</h3>
              ${renderBulletList(trade.categories)}
            </article>
            <article class="banner">
              <div class="trust-chip">Next step</div>
              <h2>If you are still not sure, run the shortlist.</h2>
              <p>The shortlist is built to narrow the next move by trade, team size, bottleneck, and setup tolerance.</p>
              <div class="cta-row"><a class="btn primary" href="/shortlist/">Build the shortlist</a></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Featured reviews</h2>
            </div>
            <div class="grid cols-3">${trade.featuredReviews
              .map((slug) => renderReviewCard(reviewBySlug.get(slug)))
              .join('')}</div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Featured comparisons</h2>
              </div>
              <div class="grid">${trade.featuredComparisons
                .map((slug) => renderComparisonCard(comparisonBySlug.get(slug)))
                .join('')}</div>
            </div>
            <div>
              <div class="section-heading">
                <h2>Related templates</h2>
              </div>
              <div class="grid">${trade.featuredTemplates
                .map((id) => renderTemplateCard(templateById.get(id)))
                .join('')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(trade.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderProblemPage(problem) {
  return renderShell({
    route: routeForProblem(problem.slug),
    title: `How contractors can fix ${problem.title.toLowerCase()}`,
    description: problem.description,
    breadcrumbs: [
      { label: 'Problems', href: '/problems/' },
      { label: problem.title }
    ],
    faqs: problem.faqs,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Problems', href: '/problems/' },
              { label: problem.title }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Problem path</div>
                <h1 class="page-title">How contractors can fix ${escapeHtml(problem.title.toLowerCase())} without more office chaos</h1>
                <p>${escapeHtml(problem.description)}</p>
                <p>${escapeHtml(problem.whyItMatters)}</p>
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Signs this is the real problem</div>
              ${renderBulletList(problem.symptoms)}
            </article>
            <article class="card">
              <div class="card-kicker">What to measure</div>
              ${renderBulletList(problem.roiFactors)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Solution categories that usually help</h2>
            </div>
            <div class="grid cols-3">
              ${problem.solutionCategories
                .map(
                  (category) => `
                <article class="card">
                  <h3>${escapeHtml(category.title)}</h3>
                  <p>${escapeHtml(category.body)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Recommended reviews</h2>
              </div>
              <div class="grid">${problem.recommendedReviews
                .map((slug) => renderReviewCard(reviewBySlug.get(slug)))
                .join('')}</div>
            </div>
            <div>
              <div class="section-heading">
                <h2>Related compare pages</h2>
              </div>
              <div class="grid">${problem.recommendedComparisons
                .map((slug) => renderComparisonCard(comparisonBySlug.get(slug)))
                .join('')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <div>
              <div class="section-heading">
                <h2>Templates you can use today</h2>
              </div>
              <div class="grid">${problem.recommendedTemplates
                .map((id) => renderTemplateCard(templateById.get(id)))
                .join('')}</div>
            </div>
            <article class="banner">
              <div class="trust-chip">Still unsure?</div>
              <h2>Use the shortlist to choose the first software move.</h2>
              <p>The shortlist helps separate "buy an operating system" problems from "fix one leak with one tool" problems.</p>
              <div class="cta-row"><a class="btn primary" href="/shortlist/">Start the shortlist</a></div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(problem.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderScorecard(review) {
  return `
    <aside class="scorecard">
      <div class="scorecard-row">
        <span>One-line verdict</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.oneLineVerdict)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Best fit</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.bestFit)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Bad fit</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.badFit)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Setup effort</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.setupEffort)}</strong></div>
      </div>
      <div class="scorecard-row">
        <span>Pricing posture</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.pricingPosture)}</strong></div>
      </div>
      ${review.reviewBasis ? `
      <div class="scorecard-row">
        <span>Review basis</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.reviewBasis)}</strong></div>
      </div>` : ''}
      ${review.pricingCheckDate ? `
      <div class="scorecard-row">
        <span>Pricing checked</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.pricingCheckDate)}</strong></div>
      </div>` : ''}
      <div class="scorecard-row">
        <span>Last reviewed</span>
        <div class="scorecard-label"><strong>${escapeHtml(review.lastReviewed)}</strong></div>
      </div>
    </aside>`;
}

function renderReviewPage(review) {
  return renderShell({
    route: routeForReview(review.slug),
    title: `${review.toolName} review for contractors`,
    description: review.summary,
    breadcrumbs: [
      { label: 'Reviews', href: '/reviews/' },
      { label: review.toolName }
    ],
    faqs: review.faqs,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Reviews', href: '/reviews/' },
              { label: review.toolName }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">${escapeHtml(review.category)}</div>
                <h1 class="page-title">${renderReviewName(review)} review for contractors</h1>
                <p>${escapeHtml(review.summary)}</p>
                ${renderPills(review.tradeFit, (slug) => tradeBySlug.get(slug)?.title || toSlugLabel(slug))}
                ${renderPills(review.teamSizeFit)}
                <div class="cta-row" style="margin-top:16px">
                  <a class="btn primary" href="${review.officialUrl}" target="_blank" rel="noopener noreferrer" data-analytics="review_cta outbound_tool_click">Visit official site</a>
                  ${review.compareLinks[0] ? `<a class="btn secondary" href="${routeForComparison(review.compareLinks[0])}" data-analytics="compare_cta">Read the closest comparison</a>` : ''}
                  <a class="btn secondary" href="/shortlist/">Run the shortlist</a>
                </div>
              </div>
              ${renderScorecard(review)}
            </div>
          </div>
        </section>

        ${renderInfoCardSection([
          review.reviewBasis || review.pricingCheckDate
            ? {
                kicker: 'Editorial snapshot',
                bullets: [
                  review.reviewBasis ? `Review basis: ${review.reviewBasis}` : '',
                  review.pricingCheckDate ? `Pricing check date: ${review.pricingCheckDate}` : ''
                ].filter(Boolean)
              }
            : null,
          review.bestFitBusinessSize
            ? {
                kicker: 'Best-fit business size',
                text: review.bestFitBusinessSize
              }
            : null,
          review.switchingDifficulty
            ? {
                kicker: 'Switching difficulty',
                text: review.switchingDifficulty
              }
            : null,
          review.integrationsStackFit
            ? {
                kicker: 'Integrations and stack fit',
                bullets: Array.isArray(review.integrationsStackFit)
                  ? review.integrationsStackFit
                  : [review.integrationsStackFit]
              }
            : null,
          review.firstWorkflow
            ? {
                kicker: 'First workflow to try',
                text: review.firstWorkflow
              }
            : null
        ])}

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Where it shines</div>
              ${renderBulletList(review.strengths)}
            </article>
            <article class="card">
              <div class="card-kicker">Do not buy this if...</div>
              ${renderBulletList([review.doNotBuyIf || review.badFit, ...review.watchOuts])}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Real contractor workflows</h2>
            </div>
            <div class="grid cols-3">
              ${review.workflows
                .map(
                  (workflow) => `
                <article class="card">
                  <p>${escapeHtml(workflow)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Alternatives to consider</div>
              <ul class="bullet-list">
                ${review.alternatives
                  .map((alternative) => {
                    const target = reviewBySlug.get(alternative.slug);
                    const reason = alternative.reason.replace(/^better fit when\s+/i, '');
                    return `<li><a href="${routeForReview(alternative.slug)}" data-analytics="review_cta">${renderReviewName(target)}</a> is a better fit when ${escapeHtml(reason)}.</li>`;
                  })
                  .join('')}
              </ul>
            </article>
            <article class="card">
              <div class="card-kicker">Related compare pages</div>
              <ul class="bullet-list">
                ${review.compareLinks
                  .map((slug) => {
                    const comparison = comparisonBySlug.get(slug);
                    return `<li><a href="${routeForComparison(slug)}" data-analytics="compare_cta">${renderComparisonTitle(comparison, reviewBySlug)}</a></li>`;
                  })
                  .join('')}
              </ul>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Ready to choose?</div>
              <h2>Use the shortlist if you still need fit help before you buy.</h2>
              <p>The shortlist helps separate full operating-system needs from narrower fixes like reviews, calls, or office automation.</p>
              <div class="cta-row">
                <a class="btn primary" href="${review.officialUrl}" target="_blank" rel="noopener noreferrer" data-analytics="review_cta outbound_tool_click">Visit official site</a>
                <a class="btn secondary" href="/shortlist/">Run the shortlist</a>
                ${review.compareLinks[0] ? `<a class="btn secondary" href="${routeForComparison(review.compareLinks[0])}" data-analytics="compare_cta">Read the closest comparison</a>` : ''}
              </div>
            </article>
            ${renderMonetizationCard(review.disclosureNote)}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(review.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderComparisonPage(comparison) {
  const left = reviewBySlug.get(comparison.leftTool);
  const right = reviewBySlug.get(comparison.rightTool);
  const leftDisplay = renderComparisonSideName(comparison, 'left', left);
  const rightDisplay = renderComparisonSideName(comparison, 'right', right);

  return renderShell({
    route: routeForComparison(comparison.slug),
    title: comparison.title,
    description: comparison.summary,
    breadcrumbs: [
      { label: 'Compare', href: '/compare/' },
      { label: comparison.shortTitle }
    ],
    faqs: comparison.faqs,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            ${renderBreadcrumbs([
              { label: 'Compare', href: '/compare/' },
              { label: comparison.shortTitle }
            ])}
            <div class="page-grid">
              <div>
                <div class="trust-chip">Comparison</div>
                <h1 class="page-title">${renderComparisonTitle(comparison, reviewBySlug)}</h1>
                <p>${escapeHtml(comparison.scenario)}</p>
                <p>${escapeHtml(comparison.summary)}</p>
                <div class="cta-row" style="margin-top:16px">
                  <a class="btn primary" href="${routeForReview(comparison.leftTool)}" data-analytics="review_cta">Read ${escapeHtml(left.toolName)}</a>
                  <a class="btn secondary" href="${routeForReview(comparison.rightTool)}" data-analytics="review_cta">Read ${escapeHtml(right.toolName)}</a>
                  <a class="btn secondary" href="/shortlist/">Run the shortlist</a>
                </div>
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        ${renderInfoCardSection([
          comparison.reviewBasis || comparison.pricingCheckDate
            ? {
                kicker: 'Editorial snapshot',
                bullets: [
                  comparison.reviewBasis ? `Review basis: ${comparison.reviewBasis}` : '',
                  comparison.pricingCheckDate ? `Pricing check date: ${comparison.pricingCheckDate}` : ''
                ].filter(Boolean)
              }
            : null,
          comparison.bestFitBusinessSize
            ? {
                kicker: 'Best-fit business size',
                text: comparison.bestFitBusinessSize
              }
            : null,
          comparison.switchingDifficulty
            ? {
                kicker: 'Switching difficulty',
                text: comparison.switchingDifficulty
              }
            : null,
          comparison.integrationsStackFit
            ? {
                kicker: 'Integrations and stack fit',
                bullets: Array.isArray(comparison.integrationsStackFit)
                  ? comparison.integrationsStackFit
                  : [comparison.integrationsStackFit]
              }
            : null,
          comparison.firstWorkflow
            ? {
                kicker: 'First workflow to try',
                text: comparison.firstWorkflow
              }
            : null
        ])}

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Choose ${leftDisplay} if...</div>
              ${renderBulletList(comparison.chooseLeft)}
            </article>
            <article class="card">
              <div class="card-kicker">Choose ${rightDisplay} if...</div>
              ${renderBulletList(comparison.chooseRight)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container table-wrap">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>Decision point</th>
                  <th>${leftDisplay}</th>
                  <th>${rightDisplay}</th>
                </tr>
              </thead>
              <tbody>
                ${comparison.rows
                  .map(
                    (row) => `
                  <tr>
                    <th>${escapeHtml(row[0])}</th>
                    <td>${escapeHtml(row[1])}</td>
                    <td>${escapeHtml(row[2])}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Do not buy either if...</div>
              ${renderBulletList(
                comparison.doNotBuyIf
                  ? [comparison.doNotBuyIf, ...comparison.doNeither]
                  : comparison.doNeither
              )}
            </article>
            <article class="card">
              <div class="card-kicker">First workflow to try</div>
              ${renderBulletList(comparison.startHere)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Recommendations by team type</div>
              ${renderBulletList(comparison.teamRecommendations)}
            </article>
            <article class="card">
              <div class="card-kicker">Common mistakes</div>
              ${renderBulletList(comparison.commonMistakes)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            ${renderReviewCard(left)}
            ${renderReviewCard(right)}
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Still comparing?</div>
              <h2>Read both reviews, then run the shortlist if the operating-system choice is still unclear.</h2>
              <p>That usually makes it obvious whether the team needs the simpler rollout, the deeper platform, or a narrower fix first.</p>
              <div class="cta-row">
                <a class="btn primary" href="${routeForReview(comparison.leftTool)}" data-analytics="review_cta">Read ${escapeHtml(left.toolName)}</a>
                <a class="btn secondary" href="${routeForReview(comparison.rightTool)}" data-analytics="review_cta">Read ${escapeHtml(right.toolName)}</a>
                <a class="btn secondary" href="/shortlist/">Run the shortlist</a>
              </div>
            </article>
            ${renderMonetizationCard(comparison.disclosureNote)}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <h2>Frequently asked questions</h2>
            </div>
            ${renderFaqList(comparison.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderTemplatesPage() {
  return renderShell({
    route: '/templates/',
    title: 'Copyable templates for contractor teams',
    description:
      'Use copyable texts, follow-up sequences, review requests, SOP prompts, and recap templates built for contractor and field-service businesses.',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([{ label: 'Templates' }])}
              <div class="trust-chip">Helpful content layer</div>
              <h1 class="page-title">Copyable templates for the business side of the job.</h1>
              <p>These are meant to be useful right away, even before you change your software stack.</p>
              <p class="microcopy">Need the appointment-based side instead? Browse the <a href="/beauty/templates/">Beauty &amp; Wellness template library</a>.</p>
            </div>
            <div class="grid">
              ${templateSections
                .map(
                  (section) => `
                <section class="template-block" id="${section.id}">
                  <div class="template-header">
                    <div>
                      <div class="card-kicker">Template library</div>
                      <h3>${escapeHtml(section.title)}</h3>
                      <p>${escapeHtml(section.intro)}</p>
                    </div>
                  </div>
                  <div class="split-panel">
                    <article class="note-card">
                      <h3>How to use it</h3>
                      ${renderBulletList(section.tips)}
                    </article>
                    <article class="note-card">
                      <h3>Good companion paths</h3>
                      <div class="inline-links">
                        ${section.relatedProblems
                          .map(
                            (slug) => `<a class="inline-link" href="${routeForProblem(slug)}">${escapeHtml(problemBySlug.get(slug).title)}</a>`
                          )
                          .join('')}
                      </div>
                      <div class="inline-links">
                        ${section.relatedTrades
                          .map(
                            (slug) => `<a class="inline-link" href="${routeForTrade(slug)}">${escapeHtml(tradeBySlug.get(slug).title)}</a>`
                          )
                          .join('')}
                      </div>
                    </article>
                  </div>
                  ${section.blocks
                    .map(
                      (block, index) => `
                    <div class="template-copy-wrap">
                      <div class="template-header">
                        <div>
                          <div class="card-kicker">Copy block ${index + 1}</div>
                          <h3>${escapeHtml(block.title)}</h3>
                        </div>
                        <button class="btn secondary small" type="button" data-copy-target="${section.id}-${index}" data-analytics="template_copy">Copy</button>
                      </div>
                      <pre class="template-copy" id="${section.id}-${index}">${escapeHtml(block.copy)}</pre>
                    </div>`
                    )
                    .join('')}
                </section>`
                )
                .join('')}
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderLearnPage() {
  return renderShell({
    route: '/learn/',
    title: 'Learn what to automate first',
    description:
      'Practical guidance for hands-on service businesses deciding what AI should handle, what should stay human, and where automation usually pays off first.',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([{ label: 'Learn' }])}
              <div class="trust-chip">Practical education</div>
              <h1 class="page-title">Learn what to automate first and what to leave alone.</h1>
              <p>This section is built to keep hands-on service teams from buying the wrong thing for the wrong reason.</p>
            </div>
            <div class="grid">
              ${learnSections
                .map(
                  (section) => `
                <section class="card" id="${section.id}">
                  <div class="card-kicker">Learn guide</div>
                  <h3>${escapeHtml(section.title)}</h3>
                  <p>${escapeHtml(section.summary)}</p>
                  ${renderBulletList(section.bullets)}
                </section>`
                )
                .join('')}
            </div>
          </div>
        </section>
        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Field Trades</div>
              <p>Use the field-trades side when the business runs on crews, jobs, dispatch, quotes, and after-hours lead handling.</p>
              <div class="cta-row"><a class="btn secondary small" href="/trades/">Browse field trades</a><a class="btn secondary small" href="/shortlist/">Run the field shortlist</a></div>
            </article>
            <article class="card">
              <div class="card-kicker">Beauty &amp; Wellness</div>
              <p>Use the beauty side when the business runs on booking, rebooking, retention, front-desk flow, reviews, content, and deposits.</p>
              <div class="cta-row"><a class="btn secondary small" href="/beauty/">Browse Beauty &amp; Wellness</a><a class="btn secondary small" href="/beauty/shortlist/">Run the beauty shortlist</a></div>
            </article>
          </div>
        </section>
      </main>`
  });
}

function renderSimpleSectionsPage({ route, title, description, page }) {
  return renderShell({
    route,
    title,
    description,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([{ label: title }])}
              <div class="trust-chip">Trust and policy</div>
              <h1 class="page-title">${escapeHtml(page.title)}</h1>
              <p>${escapeHtml(page.intro)}</p>
            </div>
            <div class="grid">
              ${(page.sections || [])
                .map(
                  (section) => `
                <article class="card">
                  <h3>${escapeHtml(section.title)}</h3>
                  <p>${escapeHtml(section.body)}</p>
                </article>`
                )
                .join('')}
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderFaqPage() {
  return renderShell({
    route: '/faq/',
    title: legalPages.faq.title,
    description: 'Common questions about how to use ihelpwithai.com and how the service-business recommendations are framed.',
    faqs: legalPages.faq.faqs,
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([{ label: 'FAQ' }])}
              <div class="trust-chip">FAQ</div>
              <h1 class="page-title">${escapeHtml(legalPages.faq.title)}</h1>
            </div>
            ${renderFaqList(legalPages.faq.faqs)}
          </div>
        </section>
      </main>`
  });
}

function renderStarterPackPage() {
  return renderShell({
    route: '/starter-pack/',
    title: legalPages.starterPack.title,
    description: legalPages.starterPack.intro,
    body: `
      <main class="page">
        <section class="section">
          <div class="container signup-panel">
            <div>
              ${renderBreadcrumbs([{ label: 'Starter Pack' }])}
              <div class="trust-chip">Lead magnet</div>
              <h1 class="page-title">${escapeHtml(legalPages.starterPack.title)}</h1>
              <p>${escapeHtml(legalPages.starterPack.intro)}</p>
              ${renderBulletList(legalPages.starterPack.bullets)}
            </div>
            <form class="lead-form" data-lead-form="starter-pack-page" data-form-type="field_starter_pack" data-vertical="field_trades" data-starter-pack-type="field_trades" data-analytics="starter_pack_form" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai starter pack request', {
                sourcePage: '/starter-pack/',
                vertical: 'field_trades',
                starterPackType: 'field_trades'
              })}
              <label>Name<input type="text" name="name" placeholder="Your name"></label>
              <label>Email<input type="email" name="email" required placeholder="Work email"></label>
              <label>Trade
                <select name="trade">
                  <option value="">Select a trade</option>
                  ${trades.map((trade) => `<option value="${trade.slug}">${escapeHtml(trade.title)}</option>`).join('')}
                </select>
              </label>
              <label>Biggest bottleneck
                <select name="bottleneck">
                  <option value="">Select a bottleneck</option>
                  ${problems.map((problem) => `<option value="${problem.slug}">${escapeHtml(problem.title)}</option>`).join('')}
                </select>
              </label>
              <button class="btn primary" type="submit">Send the pack</button>
              <p class="microcopy">The pack is meant to help you act before buying more software.</p>
            </form>
          </div>
        </section>
      </main>`
  });
}

function renderBeautyStarterPackPage() {
  return renderShell({
    route: routeForBeautyStarterPack(),
    title: beautyStarterPack.title,
    description: beautyStarterPack.intro,
    themeClass: 'theme-beauty',
    body: `
      <main class="page">
        <section class="section">
          <div class="container signup-panel">
            <div>
              ${renderBreadcrumbs([
                { label: 'Beauty & Wellness', href: '/beauty/' },
                { label: 'Starter Pack' }
              ])}
              <div class="trust-chip">Lead magnet</div>
              <h1 class="page-title">${escapeHtml(beautyStarterPack.title)}</h1>
              <p>${escapeHtml(beautyStarterPack.intro)}</p>
              ${renderBulletList(beautyStarterPack.bullets)}
              <p class="microcopy">This pack is meant to help you tighten booking, rebooking, reviews, and client follow-up before you add more software.</p>
            </div>
            <form class="lead-form" data-lead-form="beauty-starter-pack" data-form-type="beauty_starter_pack" data-vertical="beauty" data-starter-pack-type="beauty" data-analytics="beauty_starter_pack_form" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai beauty starter pack request', {
                sourcePage: routeForBeautyStarterPack(),
                vertical: 'beauty',
                starterPackType: 'beauty'
              })}
              <label>Name<input type="text" name="name" placeholder="Your name"></label>
              <label>Email<input type="email" name="email" required placeholder="Work email"></label>
              <label>Business type
                <select name="businessType">
                  <option value="">Select a business type</option>
                  ${beautyShortlistQuestions[0].options
                    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
                    .join('')}
                </select>
              </label>
              <button class="btn primary" type="submit">Send the beauty starter pack</button>
              <p class="microcopy">Prefer to compare software first? Run the <a href="/beauty/shortlist/">beauty shortlist</a>.</p>
            </form>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Inside the pack</div>
              <h2>The most useful booking, policy, rebooking, review, and follow-up templates in one place.</h2>
            </div>
            <div class="grid cols-2">
              ${beautyStarterPack.templateIds
                .map((id) => renderBeautyTemplateCard(beautyTemplateById.get(id)))
                .join('')}
            </div>
          </div>
        </section>
      </main>`
  });
}

function renderContactPage() {
  return renderShell({
    route: '/contact/',
    title: legalPages.contact.title,
    description: legalPages.contact.intro,
    body: `
      <main class="page">
        <section class="section">
          <div class="container signup-panel">
            <div>
              ${renderBreadcrumbs([{ label: 'Contact' }])}
              <div class="trust-chip">Contact</div>
              <h1 class="page-title">${escapeHtml(legalPages.contact.title)}</h1>
              <p>${escapeHtml(legalPages.contact.intro)}</p>
              ${renderBulletList(legalPages.contact.bullets)}
            </div>
            <form class="contact-form" data-lead-form="contact" data-form-type="contact" data-analytics="contact_form" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai contact request', { sourcePage: '/contact/' })}
              <label>Name<input type="text" name="name" placeholder="Your name"></label>
              <label>Email<input type="email" name="email" required placeholder="Best email"></label>
              <label>What do you need help with?<textarea name="message" required placeholder="Tell us the trade, the bottleneck, and what you are deciding between."></textarea></label>
              <button class="btn primary" type="submit">Send message</button>
              <p class="microcopy">Prefer email? Write directly to <a href="mailto:${site.contactEmail}">${site.contactEmail}</a>.</p>
            </form>
          </div>
        </section>
      </main>`
  });
}

function renderForVendorsPage() {
  return renderShell({
    route: '/for-vendors/',
    title: legalPages.forVendors.title,
    description: legalPages.forVendors.intro,
    body: `
      <main class="page">
        <section class="section">
          <div class="container page-grid">
            <div>
              ${renderBreadcrumbs([{ label: 'For Vendors' }])}
              <div class="trust-chip">Vendor path</div>
              <h1 class="page-title">${escapeHtml(legalPages.forVendors.title)}</h1>
              <p>${escapeHtml(legalPages.forVendors.intro)}</p>
              <div class="grid">
                ${legalPages.forVendors.sections
                  .map(
                    (section) => `
                  <article class="card">
                    <h3>${escapeHtml(section.title)}</h3>
                    <p>${escapeHtml(section.body)}</p>
                  </article>`
                  )
                  .join('')}
              </div>
            </div>
            <form class="contact-form" data-lead-form="vendor" data-form-type="vendor" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai vendor submission', { sourcePage: '/for-vendors/' })}
              <label>Company<input type="text" name="company" placeholder="Vendor name"></label>
              <label>Work email<input type="email" name="email" required placeholder="Email"></label>
              <label>Service-business use case<textarea name="use_case" placeholder="Explain the field-trades or beauty-and-wellness workflow, best-fit shop profile, and where the product does not fit."></textarea></label>
              <button class="btn primary" type="submit">Submit vendor context</button>
            </form>
          </div>
        </section>
      </main>`
  });
}

function renderThankYouPage() {
  return renderShell({
    route: '/thank-you/',
    title: legalPages.thankYou.title,
    description: legalPages.thankYou.intro,
    robots: 'noindex, nofollow',
    body: `
      <main class="page">
        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Thank you</div>
              <h1 class="page-title">${escapeHtml(legalPages.thankYou.title)}</h1>
              <p>${escapeHtml(legalPages.thankYou.intro)}</p>
              <div class="cta-row">
                <a class="btn primary" href="/shortlist/">Run the shortlist</a>
                <a class="btn secondary" href="/beauty/">Browse Beauty &amp; Wellness</a>
              </div>
            </article>
            ${renderTrustPanel()}
          </div>
        </section>
      </main>`
  });
}

function render404Page() {
  return renderShell({
    route: '/404/',
    title: 'Page not found',
    description: 'This page could not be found on ihelpwithai.com.',
    body: `
      <main class="page">
        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">404</div>
              <h1 class="page-title">That page is not here.</h1>
              <p>Try the shortlist, the field-trades guides, the Beauty &amp; Wellness hub, or the problem paths to get back into the main decision paths on the site.</p>
              <div class="cta-row">
                <a class="btn primary" href="/shortlist/">Start the shortlist</a>
                <a class="btn secondary" href="/problems/">Browse problems</a>
                <a class="btn secondary" href="/beauty/">Browse Beauty &amp; Wellness</a>
              </div>
            </article>
            ${renderTrustPanel()}
          </div>
        </section>
      </main>`
  });
}

function renderRedirectPage(targetRoute, title = 'Redirecting') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(targetRoute)}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtml(absoluteUrl(targetRoute))}">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(targetRoute)}">${escapeHtml(targetRoute)}</a>.</p>
</body>
</html>`;
}

function renderSiteDataScript() {
  const fieldComparisonLinksBySlug = new Map(
    comparisons.map((comparison) => [
      comparison.slug,
      {
        label: comparison.shortTitle,
        href: routeForComparison(comparison.slug)
      }
    ])
  );

  const beautyComparisonLinksBySlug = new Map(
    beautyComparisons.map((comparison) => [
      comparison.slug,
      {
        label: comparison.shortTitle,
        href: routeForBeautyComparison(comparison.slug)
      }
    ])
  );

  const fieldTools = reviews.map((review) => ({
    slug: review.slug,
    name: review.toolName,
    ...vendorSiteData(review.slug, review.toolName),
    summary: review.summary,
    categoryLabel: review.category,
    setupLabel: `${review.setupEffort} setup`,
    pricingLabel: review.pricingPosture,
    shortlistReason: review.bestFit,
    tradeFit: review.tradeFit,
    teamSizeFit: review.teamSizeFit,
    reviewPath: routeForReview(review.slug),
    officialUrl: review.officialUrl,
    problems: review.shortlist.problems,
    currentStackFit: review.shortlist.currentStackFit,
    budgetLevel: review.shortlist.budgetLevel,
    setupLevel: review.shortlist.setupLevel,
    afterHoursStrength: review.shortlist.afterHoursStrength,
    officeStrength: review.shortlist.officeStrength,
    compareLinks: review.compareLinks.map((slug) => fieldComparisonLinksBySlug.get(slug)).filter(Boolean)
  }));

  const beautyTools = beautyReviews.map((review) => ({
    slug: review.slug,
    name: review.toolName,
    ...vendorSiteData(review.slug, review.toolName),
    summary: review.summary,
    categoryLabel: review.category,
    setupLabel: `${review.setupEffort} setup`,
    pricingLabel: review.pricingPosture,
    shortlistReason: review.bestFit,
    businessTypeFit: review.shortlist.businessTypeFit,
    teamSizeFit: review.shortlist.teamSizeFit,
    reviewPath: routeForBeautyReview(review.slug),
    officialUrl: review.officialUrl,
    problems: review.shortlist.problems,
    currentStackFit: review.shortlist.currentStackFit,
    budgetLevel: review.shortlist.budgetLevel,
    setupLevel: review.shortlist.setupLevel,
    bookingStrength: review.shortlist.bookingStrength,
    noShowStrength: review.shortlist.noShowStrength,
    retentionStrength: review.shortlist.retentionStrength,
    leadResponseStrength: review.shortlist.leadResponseStrength,
    socialStrength: review.shortlist.socialStrength,
    adminStrength: review.shortlist.adminStrength,
    depositStrength: review.shortlist.depositStrength,
    compareLinks: review.compareLinks.map((slug) => beautyComparisonLinksBySlug.get(slug)).filter(Boolean)
  }));

  return `window.IHWAI_SITE_DATA = ${JSON.stringify({
    analytics: site.analytics,
    ownedDataEndpoint: site.ownedDataEndpoint,
    ownedDataAllowedHosts: site.ownedDataAllowedHosts,
    shortlists: {
      field: {
        stepIds: ['trade-team', 'bottleneck-stack', 'office-volume', 'budget-setup'],
        tools: fieldTools
      },
      beauty: {
        stepIds: ['business-team', 'bottleneck-stack', 'budget-setup'],
        tools: beautyTools
      }
    }
  }, null, 2)};\n`;
}

function buildSitemap(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .filter((route) => !SITEMAP_EXCLUDED_ROUTES.has(route))
  .map(
    (route) => `  <url>
    <loc>${escapeHtml(absoluteUrl(route))}</loc>
  </url>`
  )
  .join('\n')}
</urlset>\n`;
}

async function ensureDir(target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
}

async function writeFile(target, contents) {
  await ensureDir(target);
  await fs.writeFile(target, contents);
}

async function writeRoute(root, route, html) {
  const target = routeToFilePath(root, route);
  await writeFile(target, html);
  const aliasTarget = routeToAliasPath(root, route);
  if (aliasTarget) {
    await writeFile(aliasTarget, renderRedirectPage(route, `Redirecting to ${route}`));
  }
}

async function writeCompatibilityRedirect(root, relativePath, targetRoute) {
  await writeFile(path.join(root, relativePath), renderRedirectPage(targetRoute));
}

async function cleanRoot() {
  for (const relativePath of legacyRootPaths) {
    await fs.rm(path.join(rootDir, relativePath), { recursive: true, force: true });
  }
}

async function copyStaticAssets(destination) {
  await fs.mkdir(path.join(destination, 'assets'), { recursive: true });
  for (const filename of ['site.css', 'site.js', 'data-capture.js', 'og-default.png']) {
    await fs.copyFile(path.join(srcAssetsDir, filename), path.join(destination, 'assets', filename));
  }
  for (const directory of ['brand', 'vendors']) {
    const sourceDir = path.join(srcAssetsDir, directory);
    if (existsSync(sourceDir)) {
      await fs.cp(sourceDir, path.join(destination, 'assets', directory), { recursive: true });
    }
  }
  await writeFile(path.join(destination, 'assets', 'site-data.js'), renderSiteDataScript());
}

async function copyDeploymentFiles() {
  await fs.mkdir(publicDir, { recursive: true });
  for (const filename of ['CNAME', '.nojekyll', '059b83d9707b0046c1b4fdb5cb8e3d68.txt']) {
    await fs.copyFile(path.join(rootDir, filename), path.join(publicDir, filename));
  }
}

function validateReferences() {
  for (const trade of trades) {
    for (const slug of trade.featuredReviews) {
      if (!reviewBySlug.has(slug)) {
        throw new Error(`Trade "${trade.slug}" references unknown review "${slug}"`);
      }
    }
    for (const slug of trade.featuredComparisons) {
      if (!comparisonBySlug.has(slug)) {
        throw new Error(`Trade "${trade.slug}" references unknown comparison "${slug}"`);
      }
    }
    for (const id of trade.featuredTemplates) {
      if (!templateById.has(id)) {
        throw new Error(`Trade "${trade.slug}" references unknown template "${id}"`);
      }
    }
    for (const slug of trade.featuredProblems) {
      if (!problemBySlug.has(slug)) {
        throw new Error(`Trade "${trade.slug}" references unknown problem "${slug}"`);
      }
    }
  }

  for (const problem of problems) {
    for (const slug of problem.recommendedReviews) {
      if (!reviewBySlug.has(slug)) {
        throw new Error(`Problem "${problem.slug}" references unknown review "${slug}"`);
      }
    }
    for (const slug of problem.recommendedComparisons) {
      if (!comparisonBySlug.has(slug)) {
        throw new Error(`Problem "${problem.slug}" references unknown comparison "${slug}"`);
      }
    }
    for (const id of problem.recommendedTemplates) {
      if (!templateById.has(id)) {
        throw new Error(`Problem "${problem.slug}" references unknown template "${id}"`);
      }
    }
  }

  for (const review of reviews) {
    for (const alternative of review.alternatives) {
      if (!reviewBySlug.has(alternative.slug)) {
        throw new Error(`Review "${review.slug}" references unknown alternative "${alternative.slug}"`);
      }
    }
    for (const slug of review.compareLinks) {
      if (!comparisonBySlug.has(slug)) {
        throw new Error(`Review "${review.slug}" references unknown comparison "${slug}"`);
      }
    }
  }

  for (const comparison of comparisons) {
    if (!reviewBySlug.has(comparison.leftTool)) {
      throw new Error(`Comparison "${comparison.slug}" references unknown left tool "${comparison.leftTool}"`);
    }
    if (!reviewBySlug.has(comparison.rightTool)) {
      throw new Error(`Comparison "${comparison.slug}" references unknown right tool "${comparison.rightTool}"`);
    }
  }

  for (const entry of beautyBusinesses) {
    for (const slug of entry.featuredReviews) {
      if (!beautyReviewBySlug.has(slug)) {
        throw new Error(`Beauty business "${entry.slug}" references unknown review "${slug}"`);
      }
    }
    for (const slug of entry.featuredComparisons) {
      if (!beautyComparisonBySlug.has(slug)) {
        throw new Error(`Beauty business "${entry.slug}" references unknown comparison "${slug}"`);
      }
    }
    for (const id of entry.featuredTemplates) {
      if (!beautyTemplateById.has(id)) {
        throw new Error(`Beauty business "${entry.slug}" references unknown template "${id}"`);
      }
    }
    for (const slug of entry.featuredProblems) {
      if (!beautyProblemBySlug.has(slug)) {
        throw new Error(`Beauty business "${entry.slug}" references unknown problem "${slug}"`);
      }
    }
  }

  for (const entry of beautyProblems) {
    for (const slug of entry.recommendedReviews) {
      if (!beautyReviewBySlug.has(slug)) {
        throw new Error(`Beauty problem "${entry.slug}" references unknown review "${slug}"`);
      }
    }
    for (const slug of entry.recommendedComparisons) {
      if (!beautyComparisonBySlug.has(slug)) {
        throw new Error(`Beauty problem "${entry.slug}" references unknown comparison "${slug}"`);
      }
    }
    for (const id of entry.recommendedTemplates) {
      if (!beautyTemplateById.has(id)) {
        throw new Error(`Beauty problem "${entry.slug}" references unknown template "${id}"`);
      }
    }
  }

  for (const review of beautyReviews) {
    for (const alternative of review.alternatives) {
      if (!beautyReviewBySlug.has(alternative.slug)) {
        throw new Error(`Beauty review "${review.slug}" references unknown alternative "${alternative.slug}"`);
      }
    }
    for (const slug of review.compareLinks) {
      if (!beautyComparisonBySlug.has(slug)) {
        throw new Error(`Beauty review "${review.slug}" references unknown comparison "${slug}"`);
      }
    }
  }

  for (const comparison of beautyComparisons) {
    if (!beautyReviewBySlug.has(comparison.leftTool)) {
      throw new Error(`Beauty comparison "${comparison.slug}" references unknown left tool "${comparison.leftTool}"`);
    }
    if (!beautyReviewBySlug.has(comparison.rightTool)) {
      throw new Error(`Beauty comparison "${comparison.slug}" references unknown right tool "${comparison.rightTool}"`);
    }
  }
}

function collectCanonicalRoutes() {
  return [
    '/',
    '/shortlist/',
    '/trades/',
    ...trades.map((trade) => routeForTrade(trade.slug)),
    '/problems/',
    ...problems.map((problem) => routeForProblem(problem.slug)),
    '/reviews/',
    ...reviews.map((review) => routeForReview(review.slug)),
    '/compare/',
    ...comparisons.map((comparison) => routeForComparison(comparison.slug)),
    '/templates/',
    '/learn/',
    '/beauty/',
    '/beauty/problems/',
    '/beauty/shortlist/',
    ...beautyBusinesses.map((entry) => routeForBeautyBusiness(entry.slug)),
    ...beautyProblems.map((entry) => routeForBeautyProblem(entry.slug)),
    '/beauty/reviews/',
    ...beautyReviews.map((entry) => routeForBeautyReview(entry.slug)),
    '/beauty/compare/',
    ...beautyComparisons.map((entry) => routeForBeautyComparison(entry.slug)),
    '/beauty/templates/',
    routeForBeautyStarterPack(),
    '/about/',
    '/faq/',
    '/methodology/',
    '/affiliate-disclosure/',
    '/privacy/',
    '/terms/',
    '/for-vendors/',
    '/starter-pack/',
    '/contact/'
  ];
}

async function buildOutput(root) {
  await copyStaticAssets(root);

  const pages = [
    { route: '/', html: renderHomePage() },
    { route: '/shortlist/', html: renderShortlistPage() },
    { route: '/beauty/', html: renderBeautyHubPage() },
    { route: '/beauty/problems/', html: renderBeautyProblemsPage() },
    { route: '/beauty/shortlist/', html: renderBeautyShortlistPage() },
    {
      route: '/trades/',
      html: renderHubPage({
        route: '/trades/',
        title: 'Field Trades',
        description: 'Browse field-trades software and AI guidance by trade.',
        eyebrow: 'Field-trades hub',
        intro:
          'Use the field-trades guides when you want to see the bottlenecks, stack choices, and practical next steps that match how your shop actually runs.',
        cards: trades.map(renderTradeCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">How to use this hub</div>
            <p>Start with your trade if the same bottleneck looks different depending on emergency work, route density, repeat service, or project-cycle complexity.</p>
            <div class="cta-row"><a class="btn secondary small" href="/shortlist/">Run the field shortlist</a><a class="btn secondary small" href="/beauty/">See Beauty &amp; Wellness</a></div>
          </aside>`
      })
    },
    {
      route: '/problems/',
      html: renderHubPage({
        route: '/problems/',
        title: 'Problems',
        description: 'Browse contractor software and AI guidance by business bottleneck.',
        eyebrow: 'Problem hub',
        intro:
          'Start here when you already know the pain point. These pages are framed around the workflow leak, not around software categories.',
        cards: problems.map(renderProblemCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">Most common first moves</div>
            ${renderBulletList([
              'Fix missed calls before adding more marketing.',
              'Fix quote follow-up before buying more lead gen.',
              'Fix office admin before layering fancy automation.'
            ])}
          </aside>`
      })
    },
    {
      route: '/reviews/',
      html: renderHubPage({
        route: '/reviews/',
        title: 'Reviews',
        description: 'Read field-trades software reviews with best fit, bad fit, setup reality, and alternatives.',
        eyebrow: 'Review hub',
        intro:
          'Review pages are built to answer whether a tool is worth evaluating for a specific field-trades profile, not whether the vendor marketing sounds good.',
        cards: reviews.map(renderReviewCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">What every review includes</div>
            ${renderBulletList([
              'Best fit and bad fit',
              'Trade and team-size fit',
              'Setup effort and pricing posture',
              'Alternatives and compare links'
            ])}
            <div class="cta-row"><a class="btn secondary small" href="/beauty/reviews/">See beauty reviews</a></div>
          </aside>`
      })
    },
    {
      route: '/beauty/reviews/',
      html: renderHubPage({
        route: '/beauty/reviews/',
        title: 'Beauty Reviews',
        description: 'Read Beauty & Wellness software reviews with best fit, bad fit, setup reality, and alternatives.',
        eyebrow: 'Beauty review hub',
        intro:
          'These review pages are built around booking fit, no-show protection, deposits, client retention, content workflows, and front-desk reality for beauty and wellness businesses.',
        cards: beautyReviews.map(renderBeautyReviewCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">What every beauty review includes</div>
            ${renderBulletList([
              'Best fit and bad fit',
              'Business-type and team fit',
              'Booking, deposit, and retention support',
              'Alternatives and related compare pages'
            ])}
            <div class="cta-row"><a class="btn secondary small" href="/reviews/">See field-trades reviews</a></div>
          </aside>`,
        breadcrumbs: [
          { label: 'Beauty & Wellness', href: '/beauty/' },
          { label: 'Beauty Reviews' }
        ],
        themeClass: 'theme-beauty'
      })
    },
    {
      route: '/compare/',
      html: renderHubPage({
        route: '/compare/',
        title: 'Compare',
        description: 'Compare field-trades software and stack decisions by use case.',
        eyebrow: 'Compare hub',
        intro:
          'These pages are for high-intent decisions where the buyer already has two paths in mind and needs help choosing the better fit.',
        cards: comparisons.map(renderComparisonCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">Good compare pages do this</div>
            ${renderBulletList([
              'Name the scenario clearly',
              'Show where each option wins',
              'Say when the right move is neither option'
            ])}
            <div class="cta-row"><a class="btn secondary small" href="/beauty/compare/">See beauty comparisons</a></div>
          </aside>`
      })
    },
    {
      route: '/beauty/compare/',
      html: renderHubPage({
        route: '/beauty/compare/',
        title: 'Beauty Compare',
        description: 'Compare Beauty & Wellness software and stack decisions by use case.',
        eyebrow: 'Beauty compare hub',
        intro:
          'These pages are for higher-intent beauty and wellness decisions where the owner or manager is deciding between two real platform paths.',
        cards: beautyComparisons.map(renderBeautyComparisonCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">Good beauty compare pages do this</div>
            ${renderBulletList([
              'Separate solo fit from team fit',
              'Call out booking, deposits, and client experience clearly',
              'Finish with a recommendation by business type'
            ])}
            <div class="cta-row"><a class="btn secondary small" href="/compare/">See field-trades comparisons</a></div>
          </aside>`,
        breadcrumbs: [
          { label: 'Beauty & Wellness', href: '/beauty/' },
          { label: 'Beauty Compare' }
        ],
        themeClass: 'theme-beauty'
      })
    },
    { route: '/templates/', html: renderTemplatesPage() },
    { route: '/beauty/templates/', html: renderBeautyTemplatesPage() },
    { route: '/learn/', html: renderLearnPage() },
    {
      route: '/about/',
      html: renderSimpleSectionsPage({
        route: '/about/',
        title: legalPages.about.title,
        description: legalPages.about.intro,
        page: legalPages.about
      })
    },
    { route: '/faq/', html: renderFaqPage() },
    {
      route: '/methodology/',
      html: renderSimpleSectionsPage({
        route: '/methodology/',
        title: legalPages.methodology.title,
        description: legalPages.methodology.intro,
        page: legalPages.methodology
      })
    },
    {
      route: '/affiliate-disclosure/',
      html: renderSimpleSectionsPage({
        route: '/affiliate-disclosure/',
        title: legalPages.affiliateDisclosure.title,
        description: legalPages.affiliateDisclosure.intro,
        page: legalPages.affiliateDisclosure
      })
    },
    {
      route: '/privacy/',
      html: renderSimpleSectionsPage({
        route: '/privacy/',
        title: legalPages.privacy.title,
        description: legalPages.privacy.intro,
        page: legalPages.privacy
      })
    },
    {
      route: '/terms/',
      html: renderSimpleSectionsPage({
        route: '/terms/',
        title: legalPages.terms.title,
        description: legalPages.terms.intro,
        page: legalPages.terms
      })
    },
    { route: '/for-vendors/', html: renderForVendorsPage() },
    { route: '/starter-pack/', html: renderStarterPackPage() },
    { route: routeForBeautyStarterPack(), html: renderBeautyStarterPackPage() },
    { route: '/contact/', html: renderContactPage() },
    { route: '/thank-you/', html: renderThankYouPage() }
  ];

  for (const trade of trades) {
    pages.push({ route: routeForTrade(trade.slug), html: renderTradePage(trade) });
  }

  for (const entry of beautyBusinesses) {
    pages.push({ route: routeForBeautyBusiness(entry.slug), html: renderBeautyBusinessPage(entry) });
  }

  for (const problem of problems) {
    pages.push({ route: routeForProblem(problem.slug), html: renderProblemPage(problem) });
  }

  for (const entry of beautyProblems) {
    pages.push({ route: routeForBeautyProblem(entry.slug), html: renderBeautyProblemPage(entry) });
  }

  for (const review of reviews) {
    pages.push({ route: routeForReview(review.slug), html: renderReviewPage(review) });
  }

  for (const review of beautyReviews) {
    pages.push({ route: routeForBeautyReview(review.slug), html: renderBeautyReviewPage(review) });
  }

  for (const comparison of comparisons) {
    pages.push({ route: routeForComparison(comparison.slug), html: renderComparisonPage(comparison) });
  }

  for (const comparison of beautyComparisons) {
    pages.push({ route: routeForBeautyComparison(comparison.slug), html: renderBeautyComparisonPage(comparison) });
  }

  for (const page of pages) {
    if (!pageRoutes.includes(page.route)) pageRoutes.push(page.route);
    await writeRoute(root, page.route, page.html);
  }

  await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`);
  await writeFile(path.join(root, 'sitemap.xml'), buildSitemap(pageRoutes));
  await writeFile(path.join(root, '404.html'), render404Page());

  for (const [relativePath, targetRoute] of Object.entries(compatibilityRedirects)) {
    await writeCompatibilityRedirect(root, relativePath, targetRoute);
  }
}

async function main() {
  validateReferences();
  await cleanRoot();
  await fs.rm(publicDir, { recursive: true, force: true });
  await copyDeploymentFiles();
  await buildOutput(rootDir);
  await buildOutput(publicDir);
}

await main();
