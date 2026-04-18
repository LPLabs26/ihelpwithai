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
  trades
} from '../src/data/site-content.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const srcAssetsDir = path.join(rootDir, 'src', 'assets');
const publicAssetsDir = path.join(publicDir, 'assets');
const rootAssetsDir = path.join(rootDir, 'assets');

const SITE_URL = 'https://ihelpwithai.com';
const ASSET_VERSION = '20260418b';
const FORM_ACTION = `https://formsubmit.co/${site.contactEmail}`;
const ROUTE_SUFFIX = '/';

const reviewBySlug = new Map(reviews.map((review) => [review.slug, review]));
const tradeBySlug = new Map(trades.map((trade) => [trade.slug, trade]));
const problemBySlug = new Map(problems.map((problem) => [problem.slug, problem]));
const comparisonBySlug = new Map(comparisons.map((comparison) => [comparison.slug, comparison]));
const templateById = new Map(templateSections.map((template) => [template.id, template]));
const learnById = new Map(learnSections.map((entry) => [entry.id, entry]));

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

function routeForTrade(slug) {
  return `/trades/${slug}${ROUTE_SUFFIX}`;
}

function routeForProblem(slug) {
  return `/problems/${slug}${ROUTE_SUFFIX}`;
}

function routeForReview(slug) {
  return `/reviews/${slug}${ROUTE_SUFFIX}`;
}

function routeForComparison(slug) {
  return `/compare/${slug}${ROUTE_SUFFIX}`;
}

function routeForTemplate(id) {
  return `/templates/#${id}`;
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

function renderNav(currentRoute) {
  return site.navLinks
    .map((link) => {
      const active =
        link.href === '/'
          ? currentRoute === '/'
          : currentRoute === link.href || currentRoute.startsWith(link.href);
      return `<a class="${active ? 'is-active' : ''}" href="${link.href}">${escapeHtml(link.label)}</a>`;
    })
    .join('');
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <div class="footer-brand">${escapeHtml(site.title)}</div>
          <p>${escapeHtml(site.description)}</p>
          <p class="microcopy">Built around trade fit, workflow reality, and practical first picks for contractor businesses.</p>
        </div>
        ${site.footerGroups
          .map(
            (group) => `
          <div>
            <h3>${escapeHtml(group.title)}</h3>
            <ul class="footer-links">
              ${group.links
                .map(
                  (link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`
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
        <a class="brand" href="/">
          <span class="brand-mark">IHAI</span>
          <span class="brand-text">
            <strong>${escapeHtml(site.title)}</strong>
            <small>Contractor software and AI that actually help</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" data-menu-toggle>☰</button>
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

function renderLeadFormHiddenFields(subject) {
  return `
    <input type="hidden" name="_subject" value="${escapeHtml(subject)}">
    <input type="hidden" name="_captcha" value="false">
    <input type="hidden" name="_next" value="${absoluteUrl('/thank-you/')}">
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
    <a class="card" href="${routeForReview(review.slug)}">
      <div class="card-kicker">${escapeHtml(review.category)}</div>
      <h3>${escapeHtml(review.toolName)}</h3>
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
    <a class="card" href="${routeForComparison(comparison.slug)}">
      <div class="card-kicker">Comparison</div>
      <h3>${escapeHtml(comparison.shortTitle)}</h3>
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

function renderMetaTags({ title, description, route }) {
  const canonical = absoluteUrl(route);
  const socialImage = absoluteUrl(site.socialImage);
  return `
    <title>${escapeHtml(pageTitle(title))}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:site_name" content="${escapeHtml(site.title)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(pageTitle(title))}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(socialImage)}">
    <meta property="og:image:alt" content="ihelpwithai.com contractor guide preview">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle(title))}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(socialImage)}">`;
}

function renderShell({ route, title, description, body, breadcrumbs = [], faqs = [] }) {
  const schemas = [organizationSchema(), websiteSchema()];
  if (route !== '/') schemas.push(breadcrumbSchema(route, breadcrumbs));
  const faqJson = faqSchema(faqs);
  if (faqJson) schemas.push(faqJson);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${renderMetaTags({ title, description, route })}
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css?v=${ASSET_VERSION}">
  <script defer src="/assets/site-data.js?v=${ASSET_VERSION}"></script>
  <script defer src="/assets/site.js?v=${ASSET_VERSION}"></script>
  <script type="application/ld+json">${JSON.stringify(schemas)}</script>
</head>
<body>
  ${renderHeader(route)}
  ${body}
  ${renderFooter()}
</body>
</html>`;
}

function renderHomePage() {
  const featuredReviewCards = ['jobber', 'housecall-pro', 'nicejob', 'callrail']
    .map((slug) => renderReviewCard(reviewBySlug.get(slug)))
    .join('');
  const featuredCompareCards = comparisons.map(renderComparisonCard).join('');
  const tradeCards = trades.map(renderTradeCard).join('');
  const problemCards = problems.map(renderProblemCard).join('');

  return renderShell({
    route: '/',
    title: 'Choose the right AI and software for your contracting business',
    description: site.description,
    faqs: site.homeFaqs,
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">Contractor-first buyer's guide</div>
              <h1>Choose the right AI and software for your contracting business.</h1>
              <p class="hero-copy">Built for owners, office managers, dispatchers, estimators, and GMs who need clearer next steps around missed calls, quote follow-up, dispatch, reviews, and office admin.</p>
              <div class="hero-actions">
                <a class="btn primary" href="/shortlist/" data-track="home_primary_cta">Start the shortlist</a>
                <a class="btn secondary" href="/problems/" data-track="home_problem_cta">Browse by problem</a>
                <a class="btn ghost" href="/trades/" data-track="home_trade_cta">Browse by trade</a>
              </div>
            </div>
            <aside class="hero-panel">
              <div class="trust-chip">Decision engine, not directory sprawl</div>
              <ul class="checklist">
                <li>Start with the bottleneck, not the brand list.</li>
                <li>See who a tool is for and who it is not for.</li>
                <li>Use compare pages when the stack decision gets murky.</li>
                <li>Grab copyable templates before you buy another tool.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="route-strip">
              <article class="route-card">
                <div class="card-kicker">Path one</div>
                <h3>Start by trade</h3>
                <p>See the stack and bottlenecks that matter most for HVAC, plumbing, electrical, roofing, landscaping, cleaning, handyman, and general contracting.</p>
                <div class="cta-row"><a class="btn secondary small" href="/trades/">Explore trades</a></div>
              </article>
              <article class="route-card">
                <div class="card-kicker">Path two</div>
                <h3>Start by bottleneck</h3>
                <p>Go straight to missed calls, quote follow-up, scheduling, reviews, or office admin if you already know where the leak is.</p>
                <div class="cta-row"><a class="btn secondary small" href="/problems/">Explore problems</a></div>
              </article>
              <article class="route-card">
                <div class="card-kicker">Path three</div>
                <h3>Get a shortlist fast</h3>
                <p>Use the guided shortlist to narrow your next move by trade, team size, current stack, budget, and setup tolerance.</p>
                <div class="cta-row"><a class="btn secondary small" href="/shortlist/">Build shortlist</a></div>
              </article>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Trades</div>
              <h2>Advice built around how service businesses actually run.</h2>
              <p class="section-intro">The first wedge is practical business-side software for trades and field-service teams, not a generic AI catalog.</p>
            </div>
            <div class="grid cols-3">${tradeCards}</div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Core bottlenecks</div>
              <h2>Start where the office or phone is quietly leaking revenue.</h2>
            </div>
            <div class="grid cols-3">${problemCards}</div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Featured comparisons</div>
              <h2>Use compare pages when the stack decision is the real problem.</h2>
            </div>
            <div class="grid cols-2">${featuredCompareCards}</div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-heading">
              <div class="trust-chip">Featured reviews</div>
              <h2>Pressure-test the software before you commit to a demo cycle.</h2>
            </div>
            <div class="grid cols-2">${featuredReviewCards}</div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">What to automate first</div>
              <h2>Automate the leak, not the fantasy.</h2>
              <p>Good first automations usually touch missed calls, estimate follow-up, review requests, or repeat office communication. If the whole operating system is fragmented, fix that first.</p>
            </article>
            ${renderTrustPanel()}
          </div>
        </section>

        <section class="section">
          <div class="container signup-panel">
            <div>
              <div class="trust-chip">Starter pack</div>
              <h2>Get the contractor AI starter pack.</h2>
              <p>The starter pack includes missed-call texts, estimate follow-up examples, review request copy, one SOP prompt pack, and a simple decision checklist.</p>
              ${renderBulletList(legalPages.starterPack.bullets)}
            </div>
            <form class="lead-form" data-lead-form="starter-pack-home" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai starter pack request')}
              <label>Name<input type="text" name="name" placeholder="Your name"></label>
              <label>Work email<input type="email" name="email" required placeholder="Work email"></label>
              <label>Trade
                <select name="trade">
                  <option value="">Select your trade</option>
                  ${trades.map((trade) => `<option value="${trade.slug}">${escapeHtml(trade.title)}</option>`).join('')}
                </select>
              </label>
              <button class="btn primary" type="submit">Send the starter pack</button>
              <p class="microcopy">You can also <a href="/starter-pack/">read what is in the pack first</a>.</p>
            </form>
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

function renderHubPage({ route, title, description, eyebrow, intro, cards, secondaryPanel }) {
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
    title: 'Shortlist contractor software and AI by bottleneck',
    description:
      'Use the contractor shortlist to narrow the right next software decision by trade, team size, bottleneck, budget, and setup tolerance.',
    body: `
      <main class="page">
        <section class="hero">
          <div class="container hero-grid">
            <div>
              <div class="eyebrow">Guided shortlist</div>
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
            </aside>
          </div>
        </section>
        <section class="section">
          <div class="container shortlist-layout">
            <div class="shortlist-shell">
              <div class="step-progress">
                <div class="trust-chip">Quiz progress</div>
                <div class="step-progress-bar"><div class="step-progress-fill" data-shortlist-progress></div></div>
                <div class="microcopy" data-shortlist-progress-label>Step 1 of 4</div>
              </div>
              <form data-shortlist-form>
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
                  <button class="btn secondary" type="button" data-shortlist-next>Next</button>
                  <button class="btn primary" type="submit" data-shortlist-submit hidden>Build my shortlist</button>
                </div>
              </form>
            </div>
            ${renderTrustPanel()}
          </div>
          <div class="container shortlist-output" data-shortlist-output>
            <div class="results-shell" data-shortlist-results>
              <div class="result-primary" data-shortlist-primary>
                <h3>Recommended first move</h3>
                <p>Finish the shortlist to see the first route that best matches your trade, bottleneck, and setup reality.</p>
              </div>
              <div class="result-grid" data-shortlist-grid></div>
            </div>
            <p class="empty-state" data-shortlist-empty hidden>There is not a strong fit inside the current shortlist for that exact combination yet. Loosen the constraints and try again.</p>
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
                <h1 class="page-title">${escapeHtml(review.toolName)} review for contractors</h1>
                <p>${escapeHtml(review.summary)}</p>
                ${renderPills(review.tradeFit, (slug) => tradeBySlug.get(slug)?.title || toSlugLabel(slug))}
                ${renderPills(review.teamSizeFit)}
                <div class="cta-row" style="margin-top:16px">
                  <a class="btn primary" href="${review.officialUrl}" target="_blank" rel="noopener noreferrer" data-track="review_official_click">Visit official site</a>
                  <a class="btn secondary" href="/shortlist/">Run the shortlist</a>
                </div>
              </div>
              ${renderScorecard(review)}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Where it shines</div>
              ${renderBulletList(review.strengths)}
            </article>
            <article class="card">
              <div class="card-kicker">Watch-outs</div>
              ${renderBulletList(review.watchOuts)}
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
                    return `<li><a href="${routeForReview(alternative.slug)}">${escapeHtml(target.toolName)}</a> is a better fit when ${escapeHtml(reason)}.</li>`;
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
                    return `<li><a href="${routeForComparison(slug)}">${escapeHtml(comparison.shortTitle)}</a></li>`;
                  })
                  .join('')}
              </ul>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="banner">
              <div class="trust-chip">Disclosure</div>
              <p>This review is framed around buyer fit, tradeoffs, and alternatives. See the <a href="/affiliate-disclosure/">affiliate disclosure</a> for how referral relationships are handled.</p>
            </article>
            ${renderTrustPanel()}
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
  const leftLabel = comparison.leftLabel || left.toolName;
  const rightLabel = comparison.rightLabel || right.toolName;

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
                <h1 class="page-title">${escapeHtml(comparison.shortTitle)}</h1>
                <p>${escapeHtml(comparison.scenario)}</p>
                <p>${escapeHtml(comparison.summary)}</p>
              </div>
              ${renderTrustPanel()}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container split-panel">
            <article class="card">
              <div class="card-kicker">Choose ${escapeHtml(leftLabel)} if...</div>
              ${renderBulletList(comparison.chooseLeft)}
            </article>
            <article class="card">
              <div class="card-kicker">Choose ${escapeHtml(rightLabel)} if...</div>
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
                  <th>${escapeHtml(leftLabel)}</th>
                  <th>${escapeHtml(rightLabel)}</th>
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
              <div class="card-kicker">Do neither if...</div>
              ${renderBulletList(comparison.doNeither)}
            </article>
            <article class="card">
              <div class="card-kicker">Start here if you are not ready</div>
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
                        <button class="btn secondary small" type="button" data-copy-target="${section.id}-${index}">Copy</button>
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
      'Practical guidance for contractor businesses deciding what AI should handle, what should stay human, and where automation usually pays off first.',
    body: `
      <main class="page">
        <section class="section">
          <div class="container">
            <div class="page-heading">
              ${renderBreadcrumbs([{ label: 'Learn' }])}
              <div class="trust-chip">Practical education</div>
              <h1 class="page-title">Learn what to automate first and what to leave alone.</h1>
              <p>This section is built to keep contractor teams from buying the wrong thing for the wrong reason.</p>
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
    description: 'Common questions about how to use ihelpwithai.com and how the contractor-first recommendations are framed.',
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
            <form class="lead-form" data-lead-form="starter-pack-page" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai starter pack request')}
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
            <form class="contact-form" data-lead-form="contact" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai contact request')}
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
            <form class="contact-form" data-lead-form="vendor" action="${FORM_ACTION}" method="POST">
              ${renderLeadFormHiddenFields('ihelpwithai vendor submission')}
              <label>Company<input type="text" name="company" placeholder="Vendor name"></label>
              <label>Work email<input type="email" name="email" required placeholder="Email"></label>
              <label>Contractor use case<textarea name="use_case" placeholder="Explain the contractor workflow, best-fit shop profile, and where the product does not fit."></textarea></label>
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
                <a class="btn secondary" href="/trades/">Browse by trade</a>
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
              <p>Try the shortlist, the trade guides, or the problem paths to get back into the contractor-first part of the site.</p>
              <div class="cta-row">
                <a class="btn primary" href="/shortlist/">Start the shortlist</a>
                <a class="btn secondary" href="/problems/">Browse problems</a>
                <a class="btn secondary" href="/trades/">Browse trades</a>
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
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(targetRoute)}">${escapeHtml(targetRoute)}</a>.</p>
</body>
</html>`;
}

function renderSiteDataScript() {
  const comparisonLinksBySlug = new Map(
    comparisons.map((comparison) => [
      comparison.slug,
      {
        label: comparison.shortTitle,
        href: routeForComparison(comparison.slug)
      }
    ])
  );

  const tools = reviews.map((review) => ({
    slug: review.slug,
    name: review.toolName,
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
    compareLinks: review.compareLinks.map((slug) => comparisonLinksBySlug.get(slug)).filter(Boolean)
  }));

  return `window.IHWAI_SITE_DATA = ${JSON.stringify({
    tradeOptions: trades.map((trade) => ({ slug: trade.slug, title: trade.title })),
    problemOptions: problems.map((problem) => ({ slug: problem.slug, title: problem.title })),
    tools
  }, null, 2)};\n`;
}

function buildSitemap(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
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
  for (const filename of ['site.css', 'site.js', 'favicon.svg', 'og-default.png']) {
    await fs.copyFile(path.join(srcAssetsDir, filename), path.join(destination, 'assets', filename));
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
    '/about/',
    '/faq/',
    '/methodology/',
    '/affiliate-disclosure/',
    '/privacy/',
    '/terms/',
    '/for-vendors/',
    '/starter-pack/',
    '/contact/',
    '/thank-you/'
  ];
}

async function buildOutput(root) {
  await copyStaticAssets(root);

  const pages = [
    { route: '/', html: renderHomePage() },
    { route: '/shortlist/', html: renderShortlistPage() },
    {
      route: '/trades/',
      html: renderHubPage({
        route: '/trades/',
        title: 'Trades',
        description: 'Browse contractor software and AI guidance by trade.',
        eyebrow: 'Trade hub',
        intro:
          'Use the trade guides when you want to see the bottlenecks, stack choices, and practical next steps that match how your shop actually runs.',
        cards: trades.map(renderTradeCard).join(''),
        secondaryPanel: `
          <aside class="card">
            <div class="card-kicker">How to use this hub</div>
            <p>Start with your trade if the same bottleneck looks different depending on emergency work, route density, repeat service, or project-cycle complexity.</p>
            <div class="cta-row"><a class="btn secondary small" href="/shortlist/">Run the shortlist</a></div>
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
        description: 'Read contractor-first software reviews with best fit, bad fit, setup reality, and alternatives.',
        eyebrow: 'Review hub',
        intro:
          'Review pages are built to answer whether a tool is worth evaluating for a specific contractor profile, not whether the vendor marketing sounds good.',
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
          </aside>`
      })
    },
    {
      route: '/compare/',
      html: renderHubPage({
        route: '/compare/',
        title: 'Compare',
        description: 'Compare contractor software and stack decisions by use case.',
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
          </aside>`
      })
    },
    { route: '/templates/', html: renderTemplatesPage() },
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
    { route: '/contact/', html: renderContactPage() },
    { route: '/thank-you/', html: renderThankYouPage() }
  ];

  for (const trade of trades) {
    pages.push({ route: routeForTrade(trade.slug), html: renderTradePage(trade) });
  }

  for (const problem of problems) {
    pages.push({ route: routeForProblem(problem.slug), html: renderProblemPage(problem) });
  }

  for (const review of reviews) {
    pages.push({ route: routeForReview(review.slug), html: renderReviewPage(review) });
  }

  for (const comparison of comparisons) {
    pages.push({ route: routeForComparison(comparison.slug), html: renderComparisonPage(comparison) });
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
