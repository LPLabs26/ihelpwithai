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
const toolsJsonPath = path.join(rootDir, 'tools-starter.json');
const comparisonsJsonPath = path.join(rootDir, 'comparisons.json');

const SITE_URL = 'https://ihelpwithai.com';
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

function uniqueStrings(list) {
  return [...new Set(list.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function getRelatedTools(tool, tools) {
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

function renderToolPage(tool, tools) {
  const relatedTools = getRelatedTools(tool, tools);
  const tags = tool.tags.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('');
  const audiences = tool.audience.map(audience => `<span class="chip">${escapeHtml(audience)}</span>`).join('');
  const goals = tool.goals.map(goal => `<span class="chip">${escapeHtml(goal)}</span>`).join('');
  const related = relatedTools.map(relatedTool => `
        <a class="related-item" href="./${escapeHtml(relatedTool.slug)}.html">
          <strong>${escapeHtml(relatedTool.name)}</strong>
          <div class="related-copy">${escapeHtml(relatedTool.summary)}</div>
        </a>
      `).join('');

  const primaryUrl = getPrimaryUrl(tool);
  const primaryLabel = getPrimaryLabel(tool);
  const partnerNote = tool.affiliateUrl
    ? `<p class="notice" style="margin-top:18px">This page uses a partner link for ${escapeHtml(tool.name)}. If you buy through it, ihelpwithai.com may earn a commission at no extra cost to you. <a href="../affiliate-disclosure.html">Read the disclosure</a>.</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(tool.name)} — ihelpwithai.com</title>
  <meta name="description" content="${escapeHtml(tool.summary)}">
  <link rel="stylesheet" href="../styles.css">
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
      <nav class="navlinks">
        <a href="../index.html#featured">Start here</a>
        <a href="../index.html#prompt-lab">Prompt Lab</a>
        <a href="../index.html#companies">Companies</a>
        <a href="../index.html#directory-filters">Directory</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../index.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="tagrow">
            <span class="tag">${escapeHtml(tool.category)}</span>
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
              <p class="summary">${escapeHtml(tool.summary)}</p>
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
            <a class="small-link" href="../index.html#directory-filters">Compare more tools</a>
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
  <script src="../tool.js"></script>
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
  <link rel="stylesheet" href="../styles.css">
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
      <nav class="navlinks">
        <a href="../index.html#featured">Start here</a>
        <a href="../index.html#prompt-lab">Prompt Lab</a>
        <a href="../index.html#guides">Guides</a>
        <a href="../index.html#directory-filters">Directory</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../index.html">← Back to directory</a></div>

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
                    <span class="tag">${escapeHtml(tool.category)}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(tool.summary)}</p>
                  <p><strong>Use it when:</strong> ${escapeHtml(tool.whatFor)}</p>
                  <p><strong>Real use case:</strong> ${escapeHtml(tool.useCase)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="../tools/${escapeHtml(tool.slug)}.html">Read the full review</a>
                    <a class="small-link" href="${escapeHtml(getPrimaryUrl(tool))}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(getPrimaryLabel(tool))}</a>
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
              <a class="small-link primary" href="../index.html?goal=${encodeURIComponent(goal)}#directory-filters">Open filtered directory</a>
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
  <link rel="stylesheet" href="../styles.css">
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
      <nav class="navlinks">
        <a href="../index.html#featured">Start here</a>
        <a href="../index.html#prompt-lab">Prompt Lab</a>
        <a href="../index.html#compare">Compare</a>
        <a href="../index.html#directory-filters">Directory</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb"><a class="backlink" href="../index.html">← Back to directory</a></div>

    <section class="detail-hero">
      <div class="detail-grid">
        <article class="detail-main">
          <div class="eyebrow">Comparison</div>
          <h1>${escapeHtml(comparison.title)}</h1>
          <p class="summary">${escapeHtml(comparison.summary)}</p>

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
                    <span class="tag">${escapeHtml(tool.category)}</span>
                    ${renderCompanyChip(tool.company, tool.officialUrl)}
                    <span class="chip">${escapeHtml(tool.pricing)}</span>
                  </div>
                  <h3>${escapeHtml(tool.name)}</h3>
                  <p>${escapeHtml(tool.summary)}</p>
                  <p><strong>Best for:</strong> ${escapeHtml(tool.who)}</p>
                  <p><strong>Real use case:</strong> ${escapeHtml(tool.useCase)}</p>
                  <p><strong>Watch-outs:</strong> ${escapeHtml(tool.watchOuts)}</p>
                  <div class="card-links" style="margin-top:14px">
                    <a class="small-link primary" href="../tools/${escapeHtml(tool.slug)}.html">Read full review</a>
                    <a class="small-link" href="${escapeHtml(getPrimaryUrl(tool))}" target="_blank" rel="${relFor(tool.affiliateUrl)}">${escapeHtml(getPrimaryLabel(tool))}</a>
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
              <a class="small-link primary" href="../index.html#directory-filters">Open the full directory</a>
              <a class="small-link" href="../affiliate-disclosure.html">Read the disclosure</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
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
  const pages = [
    '',
    '/affiliate-disclosure.html',
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

const tools = await ensureValidTools();
const comparisons = await loadComparisons(tools);
const generatedAt = new Date().toISOString();

await fs.writeFile(
  path.join(rootDir, 'data.js'),
  `window.IHWAI = ${JSON.stringify({ generatedAt, tools, comparisons }, null, 2)};\n`
);

await fs.writeFile(path.join(rootDir, 'tools-starter.csv'), buildCsv(tools));
await fs.writeFile(path.join(rootDir, 'sitemap.xml'), buildSitemap(tools, comparisons));

await fs.rm(toolsDir, { recursive: true, force: true });
await fs.mkdir(toolsDir, { recursive: true });
await fs.rm(guidesDir, { recursive: true, force: true });
await fs.mkdir(guidesDir, { recursive: true });
await fs.rm(comparisonsDir, { recursive: true, force: true });
await fs.mkdir(comparisonsDir, { recursive: true });

for (const tool of tools) {
  await fs.writeFile(path.join(toolsDir, `${tool.slug}.html`), renderToolPage(tool, tools));
}

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  await fs.writeFile(path.join(guidesDir, guideFilename(goal)), renderGuidePage(goal, tools));
}

for (const comparison of comparisons) {
  await fs.writeFile(path.join(comparisonsDir, `${comparison.slug}.html`), renderComparisonPage(comparison, tools));
}

await fs.mkdir(publicDir, { recursive: true });
await fs.rm(publicToolsDir, { recursive: true, force: true });
await fs.mkdir(publicToolsDir, { recursive: true });
await fs.rm(publicGuidesDir, { recursive: true, force: true });
await fs.mkdir(publicGuidesDir, { recursive: true });
await fs.rm(publicComparisonsDir, { recursive: true, force: true });
await fs.mkdir(publicComparisonsDir, { recursive: true });

for (const filename of [
  'index.html',
  'styles.css',
  'app.js',
  'tool.js',
  'data.js',
  'CNAME',
  '.nojekyll',
  'affiliate-disclosure.html',
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

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  await fs.copyFile(path.join(guidesDir, guideFilename(goal)), path.join(publicGuidesDir, guideFilename(goal)));
}

for (const comparison of comparisons) {
  await fs.copyFile(path.join(comparisonsDir, `${comparison.slug}.html`), path.join(publicComparisonsDir, `${comparison.slug}.html`));
}

await fs.mkdir(path.join(publicDir, 'affiliate-disclosure'), { recursive: true });
await fs.writeFile(
  path.join(publicDir, 'affiliate-disclosure', 'index.html'),
  renderRedirectPage('../affiliate-disclosure.html', 'Continue to the disclosure page')
);

await fs.mkdir(path.join(publicDir, 'thanks'), { recursive: true });
await fs.writeFile(
  path.join(publicDir, 'thanks', 'index.html'),
  renderRedirectPage('../thanks.html', 'Continue to the thanks page')
);

for (const tool of tools) {
  const redirectDir = path.join(publicToolsDir, tool.slug);
  await fs.mkdir(redirectDir, { recursive: true });
  await fs.writeFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${tool.slug}.html`, `Continue to ${tool.name}`)
  );
}

for (const goal of uniqueStrings(tools.flatMap(tool => tool.goals || []))) {
  const filename = guideFilename(goal);
  const redirectDir = path.join(publicGuidesDir, filename.replace(/\.html$/, ''));
  await fs.mkdir(redirectDir, { recursive: true });
  await fs.writeFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${filename}`, `Continue to the ${goal} guide`)
  );
}

for (const comparison of comparisons) {
  const redirectDir = path.join(publicComparisonsDir, comparison.slug);
  await fs.mkdir(redirectDir, { recursive: true });
  await fs.writeFile(
    path.join(redirectDir, 'index.html'),
    renderRedirectPage(`../${comparison.slug}.html`, `Continue to ${comparison.title}`)
  );
}

console.log(`Built ${tools.length} tool pages, ${uniqueStrings(tools.flatMap(tool => tool.goals || [])).length} guides, and ${comparisons.length} comparisons at ${generatedAt}`);
