import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const toolsDir = path.join(rootDir, 'tools');
const publicToolsDir = path.join(publicDir, 'tools');
const guidesDir = path.join(rootDir, 'guides');
const publicGuidesDir = path.join(publicDir, 'guides');
const comparisonsDir = path.join(rootDir, 'comparisons');
const publicComparisonsDir = path.join(publicDir, 'comparisons');
const companyReviewsDir = path.join(rootDir, 'companies');
const publicCompanyReviewsDir = path.join(publicDir, 'companies');
const toolsJsonPath = path.join(rootDir, 'tools-starter.json');
const comparisonsJsonPath = path.join(rootDir, 'comparisons.json');

const SITE_URL = 'https://ihelpwithai.com';
const STYLES_VERSION = '20260416a';
const DATA_VERSION = '20260416a';
const COMPARE_VERSION = '20260416a';
const GOAL_META = {
  Automation: {
    title: 'Best AI tools for automation',
    description: 'Use these when the real goal is moving work across apps, routing data, and reducing repetitive manual steps.',
    hero: 'These are the tools worth starting with when you want AI to trigger useful business actions instead of just chatting in a box.'
  },
  Design: {
    title: 'Best AI tools for design',
    description: 'Start here for social graphics, decks, visual directions, and fast brand-friendly design work.',
    hero: 'These tools help non-designers and lean teams make visuals faster without waiting on a full creative process.'
  },
  Meetings: {
    title: 'Best AI tools for meetings and notes',
    description: 'Start here for transcripts, meeting summaries, action items, and cleaner follow-up after calls.',
    hero: 'If the pain is losing details after calls or spending too much time writing follow-up notes, these are the smartest first tools to compare.'
  },
  Presentations: {
    title: 'Best AI tools for presentations',
    description: 'Use these for pitch decks, explainers, and turning rough notes into polished visual communication.',
    hero: 'These tools are strongest when you need to explain an idea clearly and quickly without designing every slide by hand.'
  },
  Productivity: {
    title: 'Best AI tools for productivity',
    description: 'Compare these if you want a general assistant that helps you think, plan, write, and move faster every day.',
    hero: 'This is the right place to start when you are not looking for one narrow feature. You want a dependable AI sidekick for everyday work.'
  },
  Research: {
    title: 'Best AI tools for research',
    description: 'Start here if you need current information, source-backed answers, and faster market or competitor scans.',
    hero: 'These are the best first tools when your job depends on finding information quickly and turning it into a useful next step.'
  },
  Sales: {
    title: 'Best AI tools for sales',
    description: 'Use these for outbound messaging, lead handling, and revenue-team workflows.',
    hero: 'These tools are worth comparing when you need help with prospecting, outreach, follow-up, and sales enablement work.'
  },
  SEO: {
    title: 'Best AI tools for SEO',
    description: 'Use these to find content gaps, refresh weak pages, and improve visibility in search and AI-driven discovery.',
    hero: 'These picks are best when traffic, search visibility, and content operations matter more than generic chatbot help.'
  },
  Support: {
    title: 'Best AI tools for support teams',
    description: 'Start here for voice, response quality, and support workflows that scale better.',
    hero: 'These are the better fits when customer conversations and support quality matter more than general brainstorming.'
  },
  Training: {
    title: 'Best AI tools for training content',
    description: 'Use these for onboarding, instructional video, and scalable internal education.',
    hero: 'If your team needs repeatable training materials without re-recording everything by hand, these tools are worth a close look.'
  },
  Video: {
    title: 'Best AI tools for video',
    description: 'Compare these for recording, editing, repurposing, generating, and publishing video faster.',
    hero: 'These are the most useful AI tools to compare when video is part of the job and you need speed without a big production budget.'
  },
  Voice: {
    title: 'Best AI tools for voice and audio',
    description: 'Start here for voiceovers, narration, dubbing, and voice-first content workflows.',
    hero: 'These tools make the most sense when spoken output matters, whether that means narration, dubbing, or business-friendly audio content.'
  },
  Writing: {
    title: 'Best AI tools for writing',
    description: 'Use these for emails, proposals, editing, content drafts, and clearer everyday communication.',
    hero: 'These are the strongest first tools to compare when the job is writing faster, rewriting better, or tightening a message without losing your voice.'
  }
};

const CATEGORY_LABELS = {
  Assistant: 'General assistant',
  Automation: 'Automation workflow',
  Design: 'Design workflow',
  Image: 'Image workflow',
  Marketing: 'Marketing workflow',
  Meetings: 'Meeting workflow',
  Presentations: 'Presentation workflow',
  Research: 'Research workflow',
  Sales: 'Sales workflow',
  SEO: 'SEO workflow',
  Support: 'Support workflow',
  Training: 'Training workflow',
  Video: 'Video workflow',
  Voice: 'Voice workflow',
  Workspace: 'Workspace AI',
  Writing: 'Writing workflow'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function csvValue(value) {
  const stringValue = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function relFor(url) {
  return url ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
}

function getPrimaryUrl(tool) {
  return tool.affiliateUrl || tool.officialUrl;
}

function getPrimaryLabel(tool) {
  return tool.affiliateUrl ? 'Visit partner offer' : 'Visit official site';
}

function renderCompareButton(tool) {
  return `<button class="clear-button compare-button" type="button" data-compare-tool="${escapeHtml(tool.slug)}">Add to compare</button>`;
}

function renderCompareScripts(basePath = '.') {
  return `
  <script src="${basePath}/data.js?v=${DATA_VERSION}"></script>
  <script src="${basePath}/compare.js?v=${COMPARE_VERSION}"></script>
`;
}

function companyHost(url = '') {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function companyLogoUrl(url = '') {
  const host = companyHost(url);
  if (!host) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function renderCompanyLink(name, url, className = 'company-link') {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url || '#');
  const logoUrl = companyLogoUrl(url);

  if (!logoUrl || !url) {
    return `<span class="${className}"><span>${safeName}</span></span>`;
  }

  return `
    <a class="${className}" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
      <img class="company-logo" src="${escapeHtml(logoUrl)}" alt="${safeName} logo" loading="lazy" decoding="async">
      <span>${safeName}</span>
    </a>
  `;
}

function renderCompanyChip(name, url) {
  return renderCompanyLink(name, url, 'chip company-chip');
}

function cleanPreviewText(value = '') {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function toolPreviewDescription(tool) {
  return cleanPreviewText(tool.summary || tool.whatFor || tool.useCase);
}

function toolReviewParagraphs(tool) {
  const first = cleanPreviewText(tool.summary || tool.whatFor || tool.useCase);
  const second = cleanPreviewText(
    [tool.why, tool.watchOuts]
      .filter(Boolean)
      .join(' ')
  );

  return [first, second].filter(Boolean).slice(0, 2);
}

function companyPreviewDescription(company) {
  return cleanPreviewText(
    company.summary
      || `${company.name} is represented here for ${company.categories.slice(0, 2).join(' and ').toLowerCase()} tools.`
  );
}

function comparisonPreviewDescription(comparison) {
  return cleanPreviewText(comparison.summary || comparison.quickTake || comparison.question);
}

function categoryLabel(category = '') {
  return CATEGORY_LABELS[category] || category || 'AI tool';
}

function toolFitLabel(tool) {
  return categoryLabel(tool.category);
}

function companyFitLabel(company) {
  return categoryLabel(company.categories?.[0] || '');
}

function renderHeaderSearch(basePath = '.') {
  return `
      <form class="nav-search" action="${basePath}/directory.html" method="get">
        <input type="search" name="search" placeholder="Search problems or tools">
        <button type="submit">Search</button>
      </form>`;
}

function renderStartHereMenu(basePath = '.') {
  return `
      <nav class="navlinks">
        <details class="nav-dropdown">
          <summary class="nav-summary">Choose path</summary>
          <div class="nav-dropdown-menu">
            <a href="${basePath}/shortlist.html">Start the shortlist</a>
            <a href="${basePath}/problems.html">Browse by problem</a>
            <a href="${basePath}/reviews.html">Browse reviews</a>
            <a href="${basePath}/companies.html">Browse companies</a>
            <a href="${basePath}/directory.html">Search full directory</a>
            <a href="${basePath}/submit-app.html">For vendors</a>
          </div>
        </details>
      </nav>`;
}

function renderSiteFooter(basePath = '.') {
  return `
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <strong>ihelpwithai.com</strong>
        <div>A buyer's guide for small teams choosing AI tools.</div>
      </div>
      <div>
        <div>Built around workflows, tradeoffs, and practical first picks.</div>
        <div class="footer-links"><a class="small-link" href="${basePath}/shortlist.html">Start shortlist</a><a class="small-link" href="${basePath}/editorial-methodology.html">Review methodology</a><a class="small-link" href="${basePath}/submit-app.html">For vendors</a><a class="footer-email" href="mailto:info@ihelpwithai.com">info@ihelpwithai.com</a></div>
      </div>
    </div>
  </footer>`;
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function guideFilename(goal) {
  return `best-ai-tools-for-${slugify(goal)}.html`;
}

function companyReviewFilename(companyName) {
  return `${slugify(companyName)}.html`;
}

function uniqueStrings(list) {
  return [...new Set(list.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function absoluteUrl(pathname = '/') {
  if (!pathname || pathname === '/') {
    return SITE_URL;
  }
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function renderMetaTags({ title, description, pathname, type = 'website' }) {
  const canonicalUrl = absoluteUrl(pathname);
  return `
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:site_name" content="ihelpwithai.com">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">`;
}

function reviewTimestamp(tool) {
  const timestamp = Date.parse(tool?.reviewedAt || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortByFeaturedThenReview(left, right) {
  if (left.featured !== right.featured) {
    return Number(right.featured) - Number(left.featured);
  }

  const reviewDelta = reviewTimestamp(right) - reviewTimestamp(left);
  if (reviewDelta !== 0) {
    return reviewDelta;
  }

  return left.name.localeCompare(right.name);
}

function groupCompanies(tools) {
  const groups = new Map();

  for (const tool of tools) {
    if (!groups.has(tool.company)) {
      groups.set(tool.company, {
        name: tool.company,
        summary: tool.companySummary,
        officialUrl: tool.officialUrl,
        tools: [],
        categories: new Set(),
        goals: new Set(),
        featuredCount: 0
      });
    }

    const group = groups.get(tool.company);
    group.tools.push(tool);
    group.categories.add(tool.category);
    for (const goal of tool.goals || []) {
      group.goals.add(goal);
    }
    if (tool.featured) {
      group.featuredCount += 1;
    }
  }

  return [...groups.values()]
    .map(group => ({
      ...group,
      tools: [...group.tools].sort(sortByFeaturedThenReview),
      categories: [...group.categories].sort((left, right) => left.localeCompare(right)),
      goals: [...group.goals].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => right.featuredCount - left.featuredCount || right.tools.length - left.tools.length || left.name.localeCompare(right.name));
}

function getRelatedTools(tool, tools) {
  if (Array.isArray(tool.relatedToolSlugs) && tool.relatedToolSlugs.length > 0) {
    const toolBySlug = new Map(tools.map(candidate => [candidate.slug, candidate]));
    return tool.relatedToolSlugs
      .map(slug => toolBySlug.get(slug))
      .filter(Boolean)
      .slice(0, 3);
  }

  return tools
    .filter(candidate => candidate.slug !== tool.slug)
    .map(candidate => {
      let score = 0;
      if (candidate.category === tool.category) score += 3;
      score += candidate.goals.filter(goal => tool.goals.includes(goal)).length * 2;
      score += candidate.audience.filter(persona => tool.audience.includes(persona)).length;
      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score || left.candidate.name.localeCompare(right.candidate.name))
    .slice(0, 3)
    .map(entry => entry.candidate);
}

function renderOptionalCard(title, body) {
  if (!body) return '';
  return `
              <article class="trust-card">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(body)}</p>
              </article>
            `;
}

function renderOptionalListCard(title, items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return `
              <article class="trust-card">
                <h3>${escapeHtml(title)}</h3>
                <ul class="mini-list">
                  ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
              </article>
            `;
}

function renderToolPage(tool, tools) {
  const relatedTools = getRelatedTools(tool, tools);
  const tags = tool.tags.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('');
  const audiences = tool.audience.map(audience => `<span class="chip">${escapeHtml(audience)}</span>`).join('');
  const goals = tool.goals.map(goal => `<span class="chip">${escapeHtml(goal)}</span>`).join('');
  const related = relatedTools.map(relatedTool => `
        <a class="related-item" href="./${escapeHtml(relatedTool.slug)}.html">
          <strong>${escapeHtml(relatedTool.name)}</strong>
          <div class="related-copy">${escapeHtml(toolPreviewDescription(relatedTool))}</div>
        </a>
      `).join('');

  const primaryUrl = getPrimaryUrl(tool);
  const primaryLabel = getPrimaryLabel(tool);
  const buyerGuideSection = [tool.bestFit, tool.badFit, tool.pricingSnapshot, tool.setupReality].some(Boolean)
    ? `
          <div class="detail-section">
            <h2>Buyer guide</h2>
            <div class="trust-grid">
              ${renderOptionalCard('Best fit', tool.bestFit)}
              ${renderOptionalCard('Bad fit', tool.badFit)}
              ${renderOptionalCard('Pricing snapshot', tool.pricingSnapshot)}
              ${renderOptionalCard('Setup reality', tool.setupReality)}
            </div>
          </div>
        `
    : '';
  const prosConsSection = (Array.isArray(tool.pros) && tool.pros.length > 0) || (Array.isArray(tool.cons) && tool.cons.length > 0)
    ? `
          <div class="detail-section">
            <h2>Pros and cons</h2>
            <div class="trust-grid">
              ${renderOptionalListCard('Pros', tool.pros)}
              ${renderOptionalListCard('Cons', tool.cons)}
            </div>
          </div>
        `
    : '';
  const partnerNote = tool.affiliateUrl
    ? `<p class="notice" style="margin-top:18px">This page uses a partner link for ${escapeHtml(tool.name)}. If you buy through it, ihelpwithai.com may earn a commission at no extra cost to you. <a href="../affiliate-disclosure.html">Read the disclosure</a>.</p>`
    : '';
  const youtubeSection = tool.youtubeVideoId
    ? `
          <div class="detail-section">
            <h2>Watch a quick overview</h2>
            <p>Here is one YouTube video to help you understand what ${escapeHtml(tool.name)} does before you click out.</p>
            <a class="video-card" href="${escapeHtml(tool.youtubeVideoUrl || `https://www.youtube.com/watch?v=${tool.youtubeVideoId}`)}" target="_blank" rel="noopener noreferrer">
              <div class="video-thumb-wrap">
                <img class="video-thumb" src="https://i.ytimg.com/vi/${escapeHtml(tool.youtubeVideoId)}/hqdefault.jpg" alt="${escapeHtml(tool.youtubeVideoTitle || `${tool.name} YouTube thumbnail`)}" loading="lazy" decoding="async">
                <span class="video-play">▶</span>
              </div>
              <div class="video-card-copy">
                <strong>${escapeHtml(tool.youtubeVideoTitle || `Watch ${tool.name} on YouTube`)}</strong>
                <span>Open on YouTube</span>
              </div>
            </a>
          </div>
        `
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(tool.name)} — ihelpwithai.com</title>
  <meta name="description" content="${escapeHtml(tool.summary)}">
  ${renderMetaTags({
    title: `${tool.name} — ihelpwithai.com`,
    description: tool.summary,
    pathname: `/tools/${tool.slug}.html`,
    type: 'article'
  })}
  <link rel="stylesheet" href="../styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="../index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('..')}
${renderStartHereMenu('..')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="tagrow">
            <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
            <span class="chip">${escapeHtml(tool.pricing)}</span>
            <span class="chip">${escapeHtml(tool.difficulty)}</span>
            <span class="chip">Reviewed ${escapeHtml(tool.reviewedAt)}</span>
          </div>
          <div class="detail-company-row">
            <div class="avatar detail-avatar">${escapeHtml(initials(tool.name))}</div>
            <div>
              <div class="eyebrow">Company</div>
              ${renderCompanyLink(tool.company, tool.officialUrl, 'company-link company-link-lg')}
              <h1>${escapeHtml(tool.name)}</h1>
              <p class="summary">${escapeHtml(toolPreviewDescription(tool))}</p>
            </div>
          </div>

          <div class="detail-section">
            <h2>What it’s for</h2>
            <p>${escapeHtml(tool.whatFor)}</p>
          </div>

          <div class="detail-section">
            <h2>Who should use it</h2>
            <p>${escapeHtml(tool.who)}</p>
          </div>

          ${buyerGuideSection}

          ${youtubeSection}

          <div class="detail-section">
            <h2>One real use case</h2>
            <p>${escapeHtml(tool.useCase)}</p>
          </div>

          <div class="detail-section">
            <h2>Why it made the directory</h2>
            <p>${escapeHtml(tool.why)}</p>
          </div>

          <div class="detail-section">
            <h2>Watch-outs</h2>
            <p>${escapeHtml(tool.watchOuts)}</p>
          </div>

          ${prosConsSection}

          <div class="detail-section">
            <h2>Good first prompt</h2>
            <p class="prompt-box">${escapeHtml(tool.firstPrompt)}</p>
            <div class="card-links" style="margin-top:14px">
              <button class="small-link" type="button" data-copy-starter-prompt="${escapeHtml(tool.firstPrompt)}">Copy starter prompt</button>
            </div>
          </div>

          <div class="detail-section">
            <h2>Prompt maker</h2>
            <p>Start with the tool's best first prompt, then make it specific to your actual job, audience, and output.</p>
            <div
              class="prompt-builder"
              data-prompt-builder
              data-tool-name="${escapeHtml(tool.name)}"
              data-tool-what-for="${escapeHtml(tool.whatFor)}"
              data-tool-use-case="${escapeHtml(tool.useCase)}"
              data-tool-first-prompt="${escapeHtml(tool.firstPrompt)}"
            >
              <div class="field-grid">
                <label class="field">
                  <span>Main task</span>
                  <input type="text" data-prompt-task value="${escapeHtml(tool.useCase)}" placeholder="${escapeHtml(tool.useCase)}">
                </label>
                <label class="field">
                  <span>Tone or style</span>
                  <input type="text" data-prompt-tone placeholder="Clear, concise, practical, polished">
                </label>
              </div>

              <label class="field">
                <span>Context</span>
                <textarea data-prompt-context rows="4" placeholder="Add notes, audience details, pasted source material, or background that would help the model."></textarea>
              </label>

              <div class="field-grid">
                <label class="field">
                  <span>What output do you want back?</span>
                  <input type="text" data-prompt-output-format placeholder="Email draft, outline, checklist, summary, table">
                </label>
                <label class="field">
                  <span>Constraints</span>
                  <input type="text" data-prompt-constraints placeholder="Under 200 words, include sources, bullet list, no jargon">
                </label>
              </div>

              <div class="prompt-actions">
                <button class="button primary" type="button" data-build-prompt>Build custom prompt</button>
                <button class="clear-button" type="button" data-copy-custom-prompt>Copy custom prompt</button>
              </div>

              <pre class="prompt-box prompt-output" data-prompt-output></pre>
            </div>
          </div>

          <div class="detail-section">
            <h2>Company snapshot</h2>
            <p>${escapeHtml(tool.companySummary)}</p>
          </div>

          <div class="card-links" style="margin-top:18px">
            <a class="small-link primary" href="${escapeHtml(primaryUrl)}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(primaryLabel)}</a>
            <a class="small-link" href="../directory.html">Compare more tools</a>
            ${renderCompareButton(tool)}
          </div>
          ${partnerNote}
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">Quick fit</h2>
          <div class="detail-section">
            <h3>Best for</h3>
            <div class="meta">${audiences}</div>
          </div>

          <div class="detail-section">
            <h3>Best jobs</h3>
            <div class="meta">${goals}</div>
          </div>

          <div class="detail-section">
            <h3>Useful tags</h3>
            <div class="meta">${tags}</div>
          </div>

          <div class="detail-section">
            <h3>Related tools</h3>
            <div class="related-list">
              ${related}
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter('..')}
${renderCompareScripts('..')}
  <script src="../tool.js?v=20260404a"></script>
</body>
</html>
`;
}

function renderGuidePage(goal, tools) {
  const meta = GOAL_META[goal] || {
    title: `Best AI tools for ${goal.toLowerCase()}`,
    description: `A plain-English guide to the best AI tools for ${goal.toLowerCase()}.`,
    hero: `These are the tools to compare when ${goal.toLowerCase()} is the real job to be done.`
  };
  const guideTools = tools
    .filter(tool => (tool.goals || []).includes(goal))
    .sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name))
    .slice(0, 6);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.title,
    url: `${SITE_URL}/guides/${guideFilename(goal)}`,
    about: goal,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: guideTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        url: `${SITE_URL}/tools/${tool.slug}.html`
      }))
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(meta.title)} — ihelpwithai.com</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  ${renderMetaTags({
    title: `${meta.title} — ihelpwithai.com`,
    description: meta.description,
    pathname: `/guides/${guideFilename(goal)}`,
    type: 'article'
  })}
  <link rel="stylesheet" href="../styles.css?v=${STYLES_VERSION}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="../index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('..')}
${renderStartHereMenu('..')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Guide</div>
          <h1>${escapeHtml(meta.title)}</h1>
          <p class="summary">${escapeHtml(meta.hero)}</p>

          <div class="detail-section">
            <h2>What this guide helps with</h2>
            <p>${escapeHtml(meta.description)}</p>
          </div>

          <div class="detail-section">
            <h2>Best tools to compare first</h2>
            <div class="guide-stack">
              ${guideTools.map(tool => `
                <article class="guide-tool">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(toolPreviewDescription(tool))}</p>
                  <p><strong>Use it when:</strong> ${escapeHtml(tool.whatFor)}</p>
                  <p><strong>Real use case:</strong> ${escapeHtml(tool.useCase)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="../tools/${escapeHtml(tool.slug)}.html">Read the full review</a>
                    <a class="small-link" href="${escapeHtml(getPrimaryUrl(tool))}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(getPrimaryLabel(tool))}</a>
                    ${renderCompareButton(tool)}
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">Next smart move</h2>
          <div class="detail-section">
            <h3>Open the filtered directory</h3>
            <p>Jump into the live directory with the ${escapeHtml(goal)} filter already applied, then narrow the list by price, audience, company, or search term.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="../directory.html?goal=${encodeURIComponent(goal)}">Open filtered directory</a>
            </div>
          </div>
          <div class="detail-section">
            <h3>Why this guide exists</h3>
            <p>People usually search by the job they need done, not by the model vendor. These guide pages help them land on a useful shortlist faster.</p>
          </div>
          <div class="detail-section">
            <h3>Disclosure</h3>
            <p>If a recommendation ever uses a partner link, ihelpwithai.com may earn a commission at no extra cost to the reader.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link" href="../affiliate-disclosure.html">Read the disclosure</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
${renderCompareScripts('..')}
</body>
</html>
`;
}

function renderComparisonPage(comparison, tools) {
  const comparisonTools = comparison.tools
    .map(slug => tools.find(tool => tool.slug === slug))
    .filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: comparison.title,
    url: `${SITE_URL}/comparisons/${comparison.slug}.html`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: comparisonTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        url: `${SITE_URL}/tools/${tool.slug}.html`
      }))
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(comparison.title)} — ihelpwithai.com</title>
  <meta name="description" content="${escapeHtml(comparison.summary)}">
  ${renderMetaTags({
    title: `${comparison.title} — ihelpwithai.com`,
    description: comparison.summary,
    pathname: `/comparisons/${comparison.slug}.html`,
    type: 'article'
  })}
  <link rel="stylesheet" href="../styles.css?v=${STYLES_VERSION}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="../index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('..')}
${renderStartHereMenu('..')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Comparison</div>
          <h1>${escapeHtml(comparison.title)}</h1>
          <p class="summary">${escapeHtml(comparisonPreviewDescription(comparison))}</p>

          <div class="detail-section">
            <h2>The short answer</h2>
            <p>${escapeHtml(comparison.quickTake)}</p>
          </div>

          <div class="detail-section">
            <h2>Compare the tools</h2>
            <div class="compare-board">
              ${comparisonTools.map(tool => `
                <article class="compare-card">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(toolPreviewDescription(tool))}</p>
                  <p><strong>Best for:</strong> ${escapeHtml(tool.who)}</p>
                  <p><strong>Real use case:</strong> ${escapeHtml(tool.useCase)}</p>
                  <p><strong>Watch-outs:</strong> ${escapeHtml(tool.watchOuts)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="../tools/${escapeHtml(tool.slug)}.html">Read full review</a>
                    <a class="small-link" href="${escapeHtml(getPrimaryUrl(tool))}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(getPrimaryLabel(tool))}</a>
                    ${renderCompareButton(tool)}
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">${escapeHtml(comparison.question)}</h2>
          <div class="detail-section">
            <h3>Decision rules</h3>
            <ul class="mini-list">
              ${comparison.decisionRules.map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}
            </ul>
          </div>
          <div class="detail-section">
            <h3>Keep exploring</h3>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="../directory.html">Open the full directory</a>
              <a class="small-link" href="../affiliate-disclosure.html">Read the disclosure</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
${renderCompareScripts('..')}
</body>
</html>
`;
}

function renderBestFreePage(tools) {
  const availableFreeTools = tools
    .filter(tool => tool.pricing === 'Free to try')
    .sort(sortByFeaturedThenReview);
  const freeTools = availableFreeTools.slice(0, 8);

  const coveredGoals = uniqueStrings(freeTools.flatMap(tool => tool.goals || [])).length;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Best free AI tools — ihelpwithai.com</title>
  <meta name="description" content="Start with the best free-to-try AI tools across common jobs, without guessing which free option is actually worth your time.">
  ${renderMetaTags({
    title: 'Best free AI tools — ihelpwithai.com',
    description: 'Start with the best free-to-try AI tools across common jobs, without guessing which free option is actually worth your time.',
    pathname: '/best-free-ai-tools.html',
    type: 'article'
  })}
  <link rel="stylesheet" href="./styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="./index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('.')}
${renderStartHereMenu('.')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="./directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Entry path</div>
          <h1>Best free AI tools to try first</h1>
          <p class="summary">If you want the smartest low-risk starting point, begin with tools that offer real free access and enough utility to prove the value quickly.</p>

          <div class="detail-section">
            <h2>What “free” means here</h2>
            <p>This page focuses on tools labeled <strong>Free to try</strong>. Some are generous free plans. Others are better thought of as strong trial paths. Either way, they are the best place to start if you want proof before budget commitment.</p>
            <p>This page highlights <strong>${freeTools.length}</strong> of the strongest free-entry options from <strong>${availableFreeTools.length}</strong> free-to-try tools in the directory, covering <strong>${coveredGoals}</strong> common jobs.</p>
          </div>

          <div class="detail-section">
            <h2>Selected free AI tools worth trying first</h2>
            <div class="guide-stack">
              ${freeTools.map(tool => `
                <article class="guide-tool">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                    <span class="chip">Reviewed ${escapeHtml(tool.reviewedAt)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(toolPreviewDescription(tool))}</p>
                  <p><strong>Use it when:</strong> ${escapeHtml(tool.whatFor)}</p>
                  <p><strong>Real use case:</strong> ${escapeHtml(tool.useCase)}</p>
                  <p><strong>Watch-outs:</strong> ${escapeHtml(tool.watchOuts)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="./tools/${escapeHtml(tool.slug)}.html">Read the full review</a>
                    <a class="small-link" href="${escapeHtml(getPrimaryUrl(tool))}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(getPrimaryLabel(tool))}</a>
                    ${renderCompareButton(tool)}
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">How to use this page</h2>
          <div class="detail-section">
            <h3>Start cheap, then narrow</h3>
            <p>Use this as a lower-risk entry point, then switch to the full directory once you know whether your real priority is writing, meetings, research, video, or something else.</p>
          </div>
          <div class="detail-section">
            <h3>Open the free-only directory</h3>
            <p>Jump into the full directory with the price filter already set, then narrow by job, audience, or company.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="./directory.html?price=Free%20to%20try">Open free-only directory</a>
            </div>
          </div>
          <div class="detail-section">
            <h3>See how picks are made</h3>
            <p>If you want to know why these tools made the shortlist, review the editorial rules and trust model.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link" href="./editorial-methodology.html">Read the methodology</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
${renderCompareScripts('.')}
</body>
</html>
`;
}

function renderEditorialMethodologyPage(tools, comparisons) {
  const recentlyReviewed = [...tools]
    .sort((left, right) => reviewTimestamp(right) - reviewTimestamp(left) || sortByFeaturedThenReview(left, right))
    .slice(0, 5);

  const goalCount = uniqueStrings(tools.flatMap(tool => tool.goals || [])).length;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Editorial methodology — ihelpwithai.com</title>
  <meta name="description" content="How ihelpwithai.com decides which AI tools make the shortlist, how reviews stay useful, and how trust is handled.">
  ${renderMetaTags({
    title: 'Editorial methodology — ihelpwithai.com',
    description: 'How ihelpwithai.com decides which AI tools make the shortlist, how reviews stay useful, and how trust is handled.',
    pathname: '/editorial-methodology.html',
    type: 'article'
  })}
  <link rel="stylesheet" href="./styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="./index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('.')}
${renderStartHereMenu('.')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="./directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Editorial trust</div>
          <h1>How ihelpwithai.com reviews tools</h1>
          <p class="summary">The goal is not to list everything. The goal is to help someone choose faster with enough context to avoid bad-fit tools.</p>

          <div class="detail-section">
            <h2>What makes a tool worth including</h2>
            <ul class="mini-list">
              <li>It solves a recurring job in a way a real buyer can explain quickly.</li>
              <li>It earns a clear recommendation for a specific audience, not everybody.</li>
              <li>It has visible tradeoffs, setup limits, or watch-outs worth calling out.</li>
              <li>It belongs in a shortlist someone could realistically compare this week.</li>
            </ul>
          </div>

          <div class="detail-section">
            <h2>What goes into each review</h2>
            <div class="trust-grid">
              <article class="trust-card">
                <h3>Fit first</h3>
                <p>Every page explains what the tool is for, who should use it, and one real use case. That keeps the recommendation anchored to work, not hype.</p>
              </article>
              <article class="trust-card">
                <h3>Tradeoffs stay visible</h3>
                <p>Every tool includes watch-outs so the page does not read like a sales page. The right answer depends on setup tolerance, budget, and desired output quality.</p>
              </article>
              <article class="trust-card">
                <h3>Plain-English summaries</h3>
                <p>Reviews are written to help non-experts decide quickly. If a tool needs too much explanation to justify itself, it is usually not a great first recommendation.</p>
              </article>
            </div>
          </div>

          <div class="detail-section">
            <h2>What every review should include</h2>
            <div class="trust-grid">
              <article class="trust-card">
                <h3>Best fit and bad fit</h3>
                <p>Every useful review should make it obvious who the tool is for, who should probably skip it, and what kind of workflow it actually improves.</p>
              </article>
              <article class="trust-card">
                <h3>Setup and pricing reality</h3>
                <p>We look for setup difficulty, pricing shape, and the practical cost of adopting the tool, not just the most flattering plan or feature list.</p>
              </article>
              <article class="trust-card">
                <h3>Pros, cons, and shortlist case</h3>
                <p>A review should explain the strongest reason to consider the tool, the main drawback to watch, and why it still deserves shortlist attention.</p>
              </article>
            </div>
            <ul class="mini-list">
              <li><strong>Reviewer:</strong> ihelpwithai.com editorial review process.</li>
              <li><strong>Last reviewed or tested:</strong> visible freshness signals so buyers can judge recency.</li>
              <li><strong>Setup difficulty:</strong> how much effort it takes to get value, not just to create an account.</li>
              <li><strong>Pricing snapshot:</strong> the likely starting point a small team or operator will care about first.</li>
              <li><strong>Best fit and bad fit:</strong> where the tool earns a recommendation and where it starts to become the wrong choice.</li>
              <li><strong>Pros and cons:</strong> the practical upside and the most important tradeoff.</li>
            </ul>
          </div>

          <div class="detail-section">
            <h2>How we evaluate tools</h2>
            <div class="trust-grid">
              <article class="trust-card">
                <h3>Workflow fit</h3>
                <p>Does the tool clearly solve a recurring job for a real team, founder, or operator without needing too much explanation?</p>
              </article>
              <article class="trust-card">
                <h3>Ease to start</h3>
                <p>How much setup, prompt engineering, process change, or team training is required before the tool becomes genuinely useful?</p>
              </article>
              <article class="trust-card">
                <h3>Value for cost</h3>
                <p>Would a small team feel good about the spend once the tool is part of real work, or does the value stay too vague for the price?</p>
              </article>
            </div>
            <div class="trust-grid" style="margin-top:16px">
              <article class="trust-card">
                <h3>Output quality</h3>
                <p>Are the results good enough to create leverage, or does the user still need too much cleanup before the work is usable?</p>
              </article>
              <article class="trust-card">
                <h3>Team readiness</h3>
                <p>Does the tool work for the kind of buyer we serve, or is it really aimed at a much larger org, a hobby user, or a specialist team?</p>
              </article>
              <article class="trust-card">
                <h3>Editorial confidence</h3>
                <p>Can we explain the recommendation clearly, defend the tradeoffs, and name adjacent alternatives without hand-wavy filler?</p>
              </article>
            </div>
          </div>

          <div class="detail-section">
            <h2>How we test</h2>
            <ul class="mini-list">
              <li>Check the tool's official positioning, pricing, and onboarding flow.</li>
              <li>Review the workflow claim against the kind of buyer the site is actually built for.</li>
              <li>Compare the tool against adjacent alternatives so the recommendation is not made in isolation.</li>
              <li>Refresh priority pages when positioning, pricing, or quality signals materially change.</li>
            </ul>
          </div>

          <div class="detail-section">
            <h2>How updates work</h2>
            <p>The directory tracks review recency directly in the tool data. That makes it easier to show which pages were reviewed most recently and keep the shortlist from feeling stale.</p>
            <p>Current coverage: <strong>${tools.length} tools</strong>, <strong>${goalCount} guide paths</strong>, and <strong>${comparisons.length} comparison pages</strong>.</p>
          </div>

          <div class="detail-section">
            <h2>What we do not do</h2>
            <ul class="mini-list">
              <li>We do not treat every AI tool as equally relevant to every buyer.</li>
              <li>We do not let affiliate payouts override fit, tradeoffs, or recommendation quality.</li>
              <li>We do not assume a broad directory page is enough to earn trust on its own.</li>
            </ul>
          </div>

          <div class="detail-section">
            <h2>How monetization is handled</h2>
            <p>Some pages may use partner links. That never changes the basic rule: if a tool is a bad fit, the review should say so. Partner links are disclosed and are not meant to replace fit-based recommendations.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link" href="./affiliate-disclosure.html">Read the affiliate disclosure</a>
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">Fresh review signals</h2>
          <div class="detail-section">
            <h3>Recently reviewed</h3>
            <div class="related-list">
              ${recentlyReviewed.map(tool => `
                <a class="related-item" href="./tools/${escapeHtml(tool.slug)}.html">
                  <strong>${escapeHtml(tool.name)}</strong>
                  <div class="related-copy">Reviewed ${escapeHtml(tool.reviewedAt)}</div>
                </a>
              `).join('')}
            </div>
          </div>
          <div class="detail-section">
            <h3>Low-risk entry point</h3>
            <p>If someone is new to AI buying, start them on the free-to-try page before asking them to compare the whole market.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="./best-free-ai-tools.html">See best free tools</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
</body>
</html>
`;
}

function renderCompanyReviewPage(company) {
  const leadTool = company.tools[0];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(company.name)} review — ihelpwithai.com</title>
  <meta name="description" content="${escapeHtml(companyPreviewDescription(company))}">
  ${renderMetaTags({
    title: `${company.name} review — ihelpwithai.com`,
    description: companyPreviewDescription(company),
    pathname: `/companies/${companyReviewFilename(company.name)}`,
    type: 'article'
  })}
  <link rel="stylesheet" href="../styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="../index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('..')}
${renderStartHereMenu('..')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../companies.html">← Back to companies</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="tagrow">
            <span class="tag">${escapeHtml(companyFitLabel(company))}</span>
            <span class="chip">${company.tools.length} reviewed tool${company.tools.length === 1 ? '' : 's'}</span>
            ${company.featuredCount ? `<span class="chip">${company.featuredCount} first-pick${company.featuredCount === 1 ? '' : 's'}</span>` : ''}
          </div>
          <div class="detail-company-row">
            <div class="avatar detail-avatar">${escapeHtml(initials(company.name))}</div>
            <div>
              <div class="eyebrow">Company review</div>
              ${renderCompanyLink(company.name, company.officialUrl, 'company-link company-link-lg')}
              <h1>${escapeHtml(company.name)}</h1>
              <p class="summary">${escapeHtml(companyPreviewDescription(company))}</p>
            </div>
          </div>

          <div class="detail-section">
            <h2>What this company is strongest for here</h2>
            <p>${escapeHtml(company.name)} is covered here because it shows up in ${escapeHtml(company.goals.slice(0, 4).join(', ') || 'general AI work')} and is especially relevant for ${escapeHtml(company.categories.slice(0, 3).join(', ') || 'AI tooling')}.</p>
          </div>

          <div class="detail-section">
            <h2>Reviewed tools from ${escapeHtml(company.name)}</h2>
            <div class="guide-stack">
              ${company.tools.map(tool => `
                <article class="guide-tool">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                    <span class="chip">Reviewed ${escapeHtml(tool.reviewedAt)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(toolPreviewDescription(tool))}</p>
                  <p><strong>Use it when:</strong> ${escapeHtml(tool.whatFor)}</p>
                  <p><strong>Watch-outs:</strong> ${escapeHtml(tool.watchOuts)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="../tools/${escapeHtml(tool.slug)}.html">Read tool review</a>
                    <a class="small-link" href="../directory.html?company=${encodeURIComponent(company.name)}">Compare in directory</a>
                    ${renderCompareButton(tool)}
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">Quick take</h2>
          <div class="detail-section">
            <h3>Best jobs</h3>
            <div class="company-goal-links">
              ${(company.goals || []).length ? company.goals.slice(0, 6).map(goal => `<a class="chip chip-link" href="../directory.html?company=${encodeURIComponent(company.name)}&goal=${encodeURIComponent(goal)}">${escapeHtml(goal)}</a>`).join('') : '<span class="micro-note">General AI work</span>'}
            </div>
          </div>
          <div class="detail-section">
            <h3>Best place to start</h3>
            <p>${leadTool ? `Start with ${leadTool.name} if you want the cleanest first review from ${company.name}.` : `Start with the directory if you want to compare ${company.name} with other vendors.`}</p>
            <div class="card-links" style="margin-top:14px">
              ${leadTool ? `<a class="small-link primary" href="../tools/${escapeHtml(leadTool.slug)}.html">Start with ${escapeHtml(leadTool.name)}</a>` : ''}
              <a class="small-link" href="../companies.html">Back to companies</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter('..')}
${renderCompareScripts('..')}
</body>
</html>
`;
}

function renderCompaniesPage(tools) {
  const companies = groupCompanies(tools);
  const companyJumpList = [...companies].sort((left, right) => left.name.localeCompare(right.name));
  const goalCounts = new Map();

  for (const company of companies) {
    for (const goal of company.goals || []) {
      goalCounts.set(goal, (goalCounts.get(goal) || 0) + 1);
    }
  }

  const popularGoals = [...goalCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([goal]) => goal);

  const companyGoalRows = popularGoals.slice(0, 6).map(goal => {
    const matchingCompanies = companies
      .filter(company => (company.goals || []).includes(goal))
      .sort((left, right) => right.featuredCount - left.featuredCount || right.tools.length - left.tools.length || left.name.localeCompare(right.name));
    const topCompanies = matchingCompanies.slice(0, 4);
    const firstPickTrail = topCompanies
      .filter(company => company.tools[0])
      .map(company => `${escapeHtml(company.name)} → <a href="./tools/${escapeHtml(company.tools[0].slug)}.html">${escapeHtml(company.tools[0].name)}</a>`)
      .join(' • ');

    return `
      <article class="guide-tool">
        <div class="tagrow">
          <span class="tag">${escapeHtml(goal)}</span>
          <span class="chip">${matchingCompanies.length} compan${matchingCompanies.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <h3>Start with these companies for ${escapeHtml(goal.toLowerCase())}</h3>
        <p>${escapeHtml(GOAL_META[goal]?.description || `Use these companies when ${goal.toLowerCase()} is the main job to be done.`)}</p>
        <div class="company-goal-links" style="margin-top:12px">
          ${topCompanies.map(company => `<a class="chip chip-link" href="#company-${slugify(company.name)}">${escapeHtml(company.name)}</a>`).join('')}
        </div>
        ${firstPickTrail ? `<div class="micro-note" style="margin-top:12px"><strong>Best first picks:</strong> ${firstPickTrail}</div>` : ''}
        <div class="card-links" style="margin-top:14px">
          <a class="small-link primary" href="./directory.html?goal=${encodeURIComponent(goal)}">Open ${escapeHtml(goal)} tools</a>
          <a class="small-link" href="./guides/${escapeHtml(guideFilename(goal))}">See the ${escapeHtml(goal.toLowerCase())} guide</a>
        </div>
      </article>
    `;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI companies and their tools — ihelpwithai.com</title>
  <meta name="description" content="Browse AI companies in one place, see which tools each company is known for here, and jump straight to the best first tool or compare the full lineup.">
  ${renderMetaTags({
    title: 'AI companies and their tools — ihelpwithai.com',
    description: 'Browse AI companies in one place, see which tools each company is known for here, and jump straight to the best first tool or compare the full lineup.',
    pathname: '/companies.html',
    type: 'article'
  })}
  <link rel="stylesheet" href="./styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="./index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('.')}
${renderStartHereMenu('.')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="./directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Company path</div>
          <h1>Use companies as a supporting path, not the first step.</h1>
          <p class="summary">This page is most useful when you already trust a brand, need to compare one company's lineup, or want to sanity-check a vendor after you already know the job to be done.</p>

          <div class="detail-section">
            <h2>When this path is useful</h2>
            <p>If you already know names like OpenAI, Anthropic, Canva, Adobe, or Zapier, this page gives you the shortest route from brand to tool review without making you sift through the entire directory first.</p>
            <p>Current coverage: <strong>${companies.length} companies</strong> represented in the directory.</p>
          </div>

          <div class="detail-section">
            <h2>Quick ways to narrow this page</h2>
            <p>Jump straight to a company if you already trust the vendor, or bounce back to the shortlist and problem paths if you realize the company-first view is still too broad.</p>
            <div class="jump-stack">
              <div>
                <div class="jump-label">Jump to a company</div>
                <div class="company-jump-grid">
                  ${companyJumpList.map(company => `<a class="chip chip-link" href="#company-${slugify(company.name)}">${escapeHtml(company.name)}</a>`).join('')}
                </div>
              </div>
              <div>
                <div class="jump-label">Or start from a job instead</div>
                <div class="company-jump-grid">
                  ${popularGoals.map(goal => `<a class="chip chip-link" href="./directory.html?goal=${encodeURIComponent(goal)}">${escapeHtml(goal)}</a>`).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Start by the job, then pick a company</h2>
            <p>If you know the work but still want a familiar vendor, these rows give you a calmer way to move from job to brand to first tool instead of browsing the full market cold.</p>
            <div class="guide-stack">
              ${companyGoalRows}
            </div>
          </div>

          <div class="detail-section">
            <h2>AI companies covered</h2>
            <div class="guide-stack">
              ${companies.map(company => `
                <article class="guide-tool company-anchor" id="company-${slugify(company.name)}">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(companyFitLabel(company) || 'AI company')}</span>
                    ${renderCompanyChip(company.name, company.officialUrl)}
                    <span class="chip">${company.tools.length} tool${company.tools.length === 1 ? '' : 's'}</span>
                    ${company.featuredCount ? `<span class="chip">${company.featuredCount} first-pick${company.featuredCount === 1 ? '' : 's'}</span>` : ''}
                  </div>
                  <h3>${escapeHtml(company.name)}</h3>
                  <p>${escapeHtml(companyPreviewDescription(company))}</p>
                  <p><strong>Best known here for:</strong> ${escapeHtml(company.categories.slice(0, 3).join(', ') || 'general AI tooling')}</p>
                  ${company.tools[0] ? `<p><strong>Best place to start:</strong> <a href="./tools/${escapeHtml(company.tools[0].slug)}.html">${escapeHtml(company.tools[0].name)}</a> — ${escapeHtml(toolPreviewDescription(company.tools[0]))}</p>` : ''}
                  <div class="company-goal-block">
                    <strong>Useful jobs:</strong>
                    <div class="company-goal-links">
                      ${(company.goals || []).length ? company.goals.slice(0, 4).map(goal => `<a class="chip chip-link" href="./directory.html?company=${encodeURIComponent(company.name)}&goal=${encodeURIComponent(goal)}">${escapeHtml(goal)}</a>`).join('') : '<span class="micro-note">General AI work</span>'}
                    </div>
                  </div>
                  <div class="related-list" style="margin-top:14px">
                    ${company.tools.slice(0, 4).map(tool => `
                      <a class="related-item" href="./tools/${escapeHtml(tool.slug)}.html">
                        <strong>${escapeHtml(tool.name)}</strong>
                        <div class="related-copy">${escapeHtml(toolPreviewDescription(tool))}</div>
                      </a>
                    `).join('')}
                  </div>
                  ${company.tools.length > 4 ? `<div class="micro-note" style="margin-top:12px">+${company.tools.length - 4} more tool${company.tools.length - 4 === 1 ? '' : 's'} from ${escapeHtml(company.name)} can still be filtered in the full directory.</div>` : ''}
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="./companies/${escapeHtml(companyReviewFilename(company.name))}">Read company review</a>
                    <a class="small-link" href="./directory.html?company=${encodeURIComponent(company.name)}">Compare ${escapeHtml(company.name)} tools</a>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">How to use this page</h2>
          <div class="detail-section">
            <h3>Start by company when brand trust matters</h3>
            <p>If procurement, brand familiarity, or an existing subscription matters more than the exact workflow, this path is usually faster than starting from the whole directory.</p>
          </div>
          <div class="detail-section">
            <h3>Need a better first pick?</h3>
            <p>If you do not already have a company in mind, the shortlist flow is still the best starting point.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="./shortlist.html">Go to the shortlist</a>
            </div>
          </div>
          <div class="detail-section">
            <h3>Want the cheapest low-risk start?</h3>
            <p>Use the free-to-try page if budget is the first screen instead of brand trust.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link" href="./best-free-ai-tools.html">See best free tools</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
</body>
</html>
`;
}

function renderReviewsPage(tools) {
  const reviewedTools = [...tools].sort(sortByFeaturedThenReview);
  const companies = groupCompanies(tools);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI reviews — ihelpwithai.com</title>
  <meta name="description" content="Browse product and company review coverage from ihelpwithai.com and jump straight to the reviews that matter.">
  ${renderMetaTags({
    title: 'AI reviews — ihelpwithai.com',
    description: 'Browse product and company review coverage from ihelpwithai.com and jump straight to the reviews that matter.',
    pathname: '/reviews.html',
    type: 'article'
  })}
  <link rel="stylesheet" href="./styles.css?v=${STYLES_VERSION}">
</head>
<body class="detail-body">
  <header class="topbar">
    <div class="container nav">
      <a href="./index.html" class="brand">
        <div class="logo"><span>IHAI</span></div>
        <div>
          <div>ihelpwithai.com</div>
          <div class="brand-sub">AI tools that actually help</div>
        </div>
      </a>
${renderHeaderSearch('.')}
${renderStartHereMenu('.')}
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="./directory.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Review coverage</div>
          <h1>Reviews for AI tools and companies</h1>
          <p class="summary">Use this page after the shortlist when you want to pressure-test the final options. It is the fastest way to see where a tool fits, where it breaks down, and how current the recommendation is.</p>

          <div class="card-links" style="margin-top:18px">
            <a class="small-link primary" href="./shortlist.html">Start with the shortlist</a>
            <a class="small-link" href="./problems.html">Browse by problem</a>
          </div>

          <div class="detail-section">
            <h2>How these reviews work</h2>
            <div class="trust-grid">
              <article class="trust-card">
                <h3>Last reviewed dates</h3>
                <p>Freshness signals stay visible so you can tell whether a page has been checked recently enough to trust for a current buying decision.</p>
              </article>
              <article class="trust-card">
                <h3>Best fit and bad fit</h3>
                <p>Reviews are meant to help you rule tools in and out, not just collect more tabs with vague AI claims.</p>
              </article>
              <article class="trust-card">
                <h3>Setup, pricing, and tradeoffs</h3>
                <p>We care about adoption friction, likely cost, and where a tool stops making sense for a small team or operator.</p>
              </article>
            </div>
            <p>Every review is checked against the same five buyer questions: workflow fit, setup difficulty, value for cost, output quality, and editorial confidence.</p>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="./editorial-methodology.html">See full review methodology</a>
            </div>
          </div>

          <div class="detail-section">
            <h2>Product reviews</h2>
            <div class="guide-stack">
              ${reviewedTools.map(tool => {
                const reviewParagraphs = toolReviewParagraphs(tool);
                return `
                <article class="guide-tool">
                  <div class="tagrow">
                    <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">Reviewed ${escapeHtml(tool.reviewedAt)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  ${reviewParagraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="./tools/${escapeHtml(tool.slug)}.html">Read product review</a>
                    <a class="small-link" href="./directory.html?company=${encodeURIComponent(tool.company)}">Open ${escapeHtml(tool.company)} in directory</a>
                    ${renderCompareButton(tool)}
                  </div>
                </article>
              `;}).join('')}
            </div>
          </div>
        </article>

        <aside class="detail-side">
          <h2 style="margin-top:0">Company coverage</h2>
          <div class="detail-section">
            <h3>Company review snapshots</h3>
            <div class="related-list">
              ${companies.slice(0, 12).map(company => `
                <a class="related-item" href="./companies/${escapeHtml(companyReviewFilename(company.name))}">
                  <strong>${escapeHtml(company.name)}</strong>
                  <div class="related-copy">${escapeHtml(companyPreviewDescription(company))}</div>
                </a>
              `).join('')}
            </div>
          </div>
          <div class="detail-section">
            <h3>Need all company coverage?</h3>
            <div class="card-links" style="margin-top:14px">
              <a class="small-link primary" href="./companies.html">Open companies page</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
${renderSiteFooter()}
${renderCompareScripts('.')}
</body>
</html>
`;
}

function buildCsv(tools) {
  const headers = [
    'name',
    'slug',
    'company',
    'companySummary',
    'category',
    'goals',
    'audience',
    'difficulty',
    'pricing',
    'featured',
    'officialUrl',
    'affiliateUrl',
    'affiliateProgramUrl',
    'partnerStatus',
    'summary',
    'whatFor',
    'who',
    'useCase',
    'why',
    'watchOuts',
    'firstPrompt',
    'reviewedAt',
    'tags'
  ];

  const rows = tools.map(tool => headers.map(header => csvValue(tool[header])).join(','));
  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

function buildSitemap(tools, comparisons) {
  const goals = uniqueStrings(tools.flatMap(tool => tool.goals || []));
  const companies = groupCompanies(tools);
  const pages = [
    '',
    '/affiliate-disclosure.html',
    '/problems.html',
    '/missed-calls.html',
    '/estimate-follow-up.html',
    '/review-requests.html',
    '/office-admin.html',
    '/marketing.html',
    '/shortlist.html',
    '/directory.html',
    '/get-help.html',
    '/submit-app.html',
    '/companies.html',
    '/reviews.html',
    '/best-free-ai-tools.html',
    '/editorial-methodology.html',
    ...companies.map(company => `/companies/${companyReviewFilename(company.name)}`),
    ...comparisons.map(comparison => `/comparisons/${comparison.slug}.html`),
    ...goals.map(goal => `/guides/${guideFilename(goal)}`),
    ...tools.map(tool => `/tools/${tool.slug}.html`)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url><loc>${SITE_URL}${page}</loc></url>`).join('\n')}
</urlset>
`;
}

function renderRedirectPage(target, label = 'Continue to page') {
  const safeTarget = escapeHtml(target);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting…</title>
  <meta http-equiv="refresh" content="0; url=${safeTarget}">
  <link rel="canonical" href="${safeTarget}">
  <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p>Redirecting… <a href="${safeTarget}">${escapeHtml(label)}</a></p>
</body>
</html>
`;
}

async function ensureValidTools() {
  const raw = await fs.readFile(toolsJsonPath, 'utf8');
  const tools = JSON.parse(raw);
  const slugs = new Set();

  for (const tool of tools) {
    if (slugs.has(tool.slug)) {
      throw new Error(`Duplicate slug found: ${tool.slug}`);
    }
    slugs.add(tool.slug);

    if (Number.isNaN(Date.parse(tool.reviewedAt || ''))) {
      throw new Error(`Invalid reviewedAt value for ${tool.slug}: ${tool.reviewedAt}`);
    }
  }

  return tools.sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }
    return left.name.localeCompare(right.name);
  });
}

async function loadComparisons(tools) {
  const raw = await fs.readFile(comparisonsJsonPath, 'utf8');
  const comparisons = JSON.parse(raw);
  const toolsBySlug = new Map(tools.map(tool => [tool.slug, tool]));

  for (const comparison of comparisons) {
    for (const slug of comparison.tools || []) {
      if (!toolsBySlug.has(slug)) {
        throw new Error(`Comparison "${comparison.slug}" references unknown tool "${slug}"`);
      }
    }
  }

  return comparisons;
}

async function copyIfExists(filename) {
  const source = path.join(rootDir, filename);
  const destination = path.join(publicDir, filename);
  await fs.copyFile(source, destination);
}

function normalizeGeneratedOutput(contents) {
  return String(contents)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '');
}

async function writeGeneratedFile(filename, contents) {
  await fs.writeFile(filename, normalizeGeneratedOutput(contents));
}

const tools = await ensureValidTools();
const comparisons = await loadComparisons(tools);
const generatedAt = new Date().toISOString();

await writeGeneratedFile(
  path.join(rootDir, 'data.js'),
  `window.IHWAI = ${JSON.stringify({ generatedAt, tools, comparisons }, null, 2)};\n`
);

await writeGeneratedFile(path.join(rootDir, 'companies.html'), renderCompaniesPage(tools));
await writeGeneratedFile(path.join(rootDir, 'reviews.html'), renderReviewsPage(tools));
await writeGeneratedFile(path.join(rootDir, 'best-free-ai-tools.html'), renderBestFreePage(tools));
await writeGeneratedFile(path.join(rootDir, 'editorial-methodology.html'), renderEditorialMethodologyPage(tools, comparisons));
await writeGeneratedFile(path.join(rootDir, 'tools-starter.csv'), buildCsv(tools));
await writeGeneratedFile(path.join(rootDir, 'sitemap.xml'), buildSitemap(tools, comparisons));

await fs.rm(toolsDir, { recursive: true, force: true });
await fs.mkdir(toolsDir, { recursive: true });
await fs.rm(companyReviewsDir, { recursive: true, force: true });
await fs.mkdir(companyReviewsDir, { recursive: true });
await fs.rm(guidesDir, { recursive: true, force: true });
await fs.mkdir(guidesDir, { recursive: true });
await fs.rm(comparisonsDir, { recursive: true, force: true });
await fs.mkdir(comparisonsDir, { recursive: true });

for (const tool of tools) {
  await writeGeneratedFile(path.join(toolsDir, `${tool.slug}.html`), renderToolPage(tool, tools));
}

for (const company of groupCompanies(tools)) {
  await writeGeneratedFile(path.join(companyReviewsDir, companyReviewFilename(company.name)), renderCompanyReviewPage(company));
}

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  await writeGeneratedFile(path.join(guidesDir, guideFilename(goal)), renderGuidePage(goal, tools));
}

for (const comparison of comparisons) {
  await writeGeneratedFile(path.join(comparisonsDir, `${comparison.slug}.html`), renderComparisonPage(comparison, tools));
}

await fs.mkdir(publicDir, { recursive: true });
await fs.rm(publicToolsDir, { recursive: true, force: true });
await fs.mkdir(publicToolsDir, { recursive: true });
await fs.rm(publicCompanyReviewsDir, { recursive: true, force: true });
await fs.mkdir(publicCompanyReviewsDir, { recursive: true });
await fs.rm(publicGuidesDir, { recursive: true, force: true });
await fs.mkdir(publicGuidesDir, { recursive: true });
await fs.rm(publicComparisonsDir, { recursive: true, force: true });
await fs.mkdir(publicComparisonsDir, { recursive: true });

for (const filename of [
  'index.html',
  'styles.css',
  'app.js',
  'compare.js',
  'tool.js',
  'data.js',
  'CNAME',
  '.nojekyll',
  'affiliate-disclosure.html',
  'problems.html',
  'missed-calls.html',
  'estimate-follow-up.html',
  'review-requests.html',
  'office-admin.html',
  'marketing.html',
  'shortlist.html',
  'directory.html',
  'get-help.html',
  'submit-app.html',
  'companies.html',
  'reviews.html',
  'best-free-ai-tools.html',
  'editorial-methodology.html',
  'thanks.html',
  'README.md',
  'robots.txt',
  'sitemap.xml',
  'comparisons.json',
  'tools-starter.json',
  'tools-starter.csv'
]) {
  await copyIfExists(filename);
}

for (const tool of tools) {
  await fs.copyFile(path.join(toolsDir, `${tool.slug}.html`), path.join(publicToolsDir, `${tool.slug}.html`));
}

for (const company of groupCompanies(tools)) {
  await fs.copyFile(path.join(companyReviewsDir, companyReviewFilename(company.name)), path.join(publicCompanyReviewsDir, companyReviewFilename(company.name)));
}

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  await fs.copyFile(path.join(guidesDir, guideFilename(goal)), path.join(publicGuidesDir, guideFilename(goal)));
}

for (const comparison of comparisons) {
  await fs.copyFile(path.join(comparisonsDir, `${comparison.slug}.html`), path.join(publicComparisonsDir, `${comparison.slug}.html`));
}

await fs.mkdir(path.join(publicDir, 'affiliate-disclosure'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'affiliate-disclosure', 'index.html'),
  renderRedirectPage('../affiliate-disclosure.html', 'Continue to the disclosure page')
);

await fs.mkdir(path.join(publicDir, 'companies'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'companies', 'index.html'),
  renderRedirectPage('../companies.html', 'Continue to the companies page')
);

await fs.mkdir(path.join(publicDir, 'problems'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'problems', 'index.html'),
  renderRedirectPage('../problems.html', 'Continue to the problems page')
);

for (const page of [
  'missed-calls.html',
  'estimate-follow-up.html',
  'review-requests.html',
  'office-admin.html',
  'marketing.html',
]) {
  const redirectName = page.replace(/\.html$/, '');
  await fs.mkdir(path.join(publicDir, redirectName), { recursive: true });
  await writeGeneratedFile(
    path.join(publicDir, redirectName, 'index.html'),
    renderRedirectPage(`../${page}`, `Continue to ${redirectName.replace(/-/g, ' ')}`)
  );
}

await fs.mkdir(path.join(publicDir, 'shortlist'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'shortlist', 'index.html'),
  renderRedirectPage('../shortlist.html', 'Continue to the shortlist page')
);

await fs.mkdir(path.join(publicDir, 'directory'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'directory', 'index.html'),
  renderRedirectPage('../directory.html', 'Continue to the directory page')
);

await fs.mkdir(path.join(publicDir, 'get-help'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'get-help', 'index.html'),
  renderRedirectPage('../get-help.html', 'Continue to the get help page')
);

await fs.mkdir(path.join(publicDir, 'submit-app'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'submit-app', 'index.html'),
  renderRedirectPage('../submit-app.html', 'Continue to the submit app page')
);

await fs.mkdir(path.join(publicDir, 'reviews'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'reviews', 'index.html'),
  renderRedirectPage('../reviews.html', 'Continue to the reviews page')
);

await fs.mkdir(path.join(publicDir, 'best-free-ai-tools'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'best-free-ai-tools', 'index.html'),
  renderRedirectPage('../best-free-ai-tools.html', 'Continue to the best free tools page')
);

await fs.mkdir(path.join(publicDir, 'editorial-methodology'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'editorial-methodology', 'index.html'),
  renderRedirectPage('../editorial-methodology.html', 'Continue to the editorial methodology page')
);

await fs.mkdir(path.join(publicDir, 'thanks'), { recursive: true });
await writeGeneratedFile(
  path.join(publicDir, 'thanks', 'index.html'),
  renderRedirectPage('../thanks.html', 'Continue to the thanks page')
);

for (const tool of tools) {
  const redirectDir = path.join(publicToolsDir, tool.slug);
  await fs.mkdir(redirectDir, { recursive: true });
  await writeGeneratedFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${tool.slug}.html`, `Continue to ${tool.name}`)
  );
}

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  const filename = guideFilename(goal);
  const redirectDir = path.join(publicGuidesDir, filename.replace(/\.html$/, ''));
  await fs.mkdir(redirectDir, { recursive: true });
  await writeGeneratedFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${filename}`, `Continue to the ${goal} guide`)
  );
}

for (const comparison of comparisons) {
  const redirectDir = path.join(publicComparisonsDir, comparison.slug);
  await fs.mkdir(redirectDir, { recursive: true });
  await writeGeneratedFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${comparison.slug}.html`, `Continue to ${comparison.title}`)
  );
}

console.log(`Built ${tools.length} tool pages, ${uniqueStrings(tools.flatMap(tool => tool.goals || [])).length} guides, and ${comparisons.length} comparisons at ${generatedAt}`);
