const TOOLS = [...(window.IHWAI?.tools || [])];
const COMPARISONS = [...(window.IHWAI?.comparisons || [])];
const MAILTO_ADDRESS = 'info@ihelpwithai.com';

const GOAL_COPY = {
  Automation: {
    title: 'Automate repetitive work',
    description: 'Connect apps, route leads, and make AI trigger real work.',
    icon: 'AO'
  },
  Design: {
    title: 'Make visuals and brand assets',
    description: 'Social graphics, quick mockups, and on-brand design drafts.',
    icon: 'DS'
  },
  Meetings: {
    title: 'Capture meetings and follow-up',
    description: 'Get transcripts, notes, action items, and cleaner handoffs.',
    icon: 'MT'
  },
  Presentations: {
    title: 'Build decks and explainers',
    description: 'Turn rough notes into polished slides, one-pagers, and visuals.',
    icon: 'PR'
  },
  Productivity: {
    title: 'Think, plan, and move faster',
    description: 'General-purpose assistants for daily work and decision support.',
    icon: 'PD'
  },
  Research: {
    title: 'Research with sources',
    description: 'Find current information, compare vendors, and gather proof faster.',
    icon: 'RS'
  },
  Sales: {
    title: 'Write and scale outbound',
    description: 'Outbound copy, lead workflows, and revenue-team support.',
    icon: 'SL'
  },
  SEO: {
    title: 'Improve search visibility',
    description: 'Plan content, refresh pages, and support AI-search visibility.',
    icon: 'SE'
  },
  Support: {
    title: 'Upgrade support experiences',
    description: 'Voice, response quality, and smarter customer interactions.',
    icon: 'SP'
  },
  Training: {
    title: 'Create training content',
    description: 'Onboarding, internal education, and repeatable learning materials.',
    icon: 'TR'
  },
  Video: {
    title: 'Make video faster',
    description: 'Record, edit, generate, and repurpose video without a full production team.',
    icon: 'VD'
  },
  Voice: {
    title: 'Create voice and audio',
    description: 'Voiceovers, dubbing, narration, and voice-powered experiences.',
    icon: 'VC'
  },
  Writing: {
    title: 'Write better and faster',
    description: 'Emails, proposals, content drafts, and cleaner rewrites.',
    icon: 'WR'
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

const grid = document.getElementById('card-grid');
const countEl = document.getElementById('count');
const searchEl = document.getElementById('search');
const goalGrid = document.getElementById('goal-grid');
const guideGrid = document.getElementById('guide-grid');
const comparisonGrid = document.getElementById('comparison-grid');
const featuredGrid = document.getElementById('featured-grid');
const companyGrid = document.getElementById('company-grid');
const directorySummary = document.getElementById('directory-summary');
const directoryActions = document.getElementById('directory-actions');
const sortSelect = document.getElementById('sort-select');
const promptToolPills = document.getElementById('prompt-tool-pills');
const promptToolSelect = document.getElementById('prompt-tool-select');
const promptTaskEl = document.getElementById('prompt-task');
const promptContextEl = document.getElementById('prompt-context');
const promptToneEl = document.getElementById('prompt-tone');
const promptOutputFormatEl = document.getElementById('prompt-output-format');
const promptConstraintsEl = document.getElementById('prompt-constraints');
const promptBuildButton = document.getElementById('prompt-build');
const promptCopyButton = document.getElementById('prompt-copy');
const promptMeta = document.getElementById('prompt-meta');
const promptResult = document.getElementById('prompt-result');
const matchGoalPills = document.getElementById('match-goal-pills');
const matchAudiencePills = document.getElementById('match-audience-pills');
const matchPricePills = document.getElementById('match-price-pills');
const matchDifficultyPills = document.getElementById('match-difficulty-pills');
const matchGrid = document.getElementById('match-grid');
const matchStatus = document.getElementById('match-status');
const matchOpenDirectoryButton = document.getElementById('match-open-directory');
const matchResetButton = document.getElementById('match-reset');
const goalPills = document.getElementById('goal-pills');
const categoryPills = document.getElementById('category-pills');
const pricePills = document.getElementById('price-pills');
const audiencePills = document.getElementById('audience-pills');
const activeFilters = document.getElementById('active-filters');
const clearButton = document.getElementById('clear-filters');

const state = {
  goal: 'All',
  category: 'All',
  price: 'All',
  audience: 'All',
  company: 'All',
  search: '',
  sort: 'best',
  visibleCount: 9
};

const matchState = {
  goal: '',
  audience: 'All',
  price: 'All',
  difficulty: 'All'
};

let promptLabInitialized = false;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function uniqueStrings(list) {
  return [...new Set(list.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function formatFieldValue(value) {
  return String(value || '').trim().replaceAll('\r\n', '\n');
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function linkRel(tool) {
  return tool.affiliateUrl ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
}

function primaryUrl(tool) {
  return tool.affiliateUrl || tool.officialUrl;
}

function primaryLabel(tool) {
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

function companyLink(name, url, className = 'company-link') {
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

function companyChip(name, url) {
  return companyLink(name, url, 'chip company-chip');
}

function cleanPreviewText(value = '') {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function toolPreviewDescription(tool) {
  return cleanPreviewText(tool.summary || tool.whatFor || tool.useCase);
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

function guideHref(goal) {
  return `./guides/best-ai-tools-for-${slugify(goal)}.html`;
}

function comparisonHref(comparison) {
  return `./comparisons/${comparison.slug}.html`;
}

function allGoals() {
  return uniqueStrings(TOOLS.flatMap(tool => tool.goals || []));
}

function goalCounts() {
  return allGoals()
    .map(goal => ({
      goal,
      count: TOOLS.filter(tool => (tool.goals || []).includes(goal)).length
    }))
    .sort((left, right) => right.count - left.count || left.goal.localeCompare(right.goal));
}

function allCategories() {
  return uniqueStrings(TOOLS.map(tool => tool.category));
}

function allPrices() {
  const preferredOrder = ['Free to try', 'Paid', 'Enterprise'];
  const existing = uniqueStrings(TOOLS.map(tool => tool.pricing));
  return existing.sort((left, right) => preferredOrder.indexOf(left) - preferredOrder.indexOf(right) || left.localeCompare(right));
}

function allAudiences() {
  return uniqueStrings(TOOLS.flatMap(tool => tool.audience || []));
}

function topAudiences(limit = 6) {
  const counts = new Map();

  for (const tool of TOOLS) {
    for (const audience of tool.audience || []) {
      counts.set(audience, (counts.get(audience) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([audience]) => audience);
}

function allDifficulties() {
  const preferredOrder = ['Easy', 'Medium', 'Advanced'];
  const existing = uniqueStrings(TOOLS.map(tool => tool.difficulty));
  return existing.sort((left, right) => preferredOrder.indexOf(left) - preferredOrder.indexOf(right) || left.localeCompare(right));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function sortedPromptTools() {
  return [...TOOLS].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }
    return left.name.localeCompare(right.name);
  });
}

function priceRank(price) {
  return ['Free to try', 'Paid', 'Enterprise'].indexOf(price);
}

function difficultyRank(difficulty) {
  return ['Easy', 'Medium', 'Advanced'].indexOf(difficulty);
}

function resetDirectoryView() {
  state.visibleCount = 9;
}

function companyGroups() {
  const groups = new Map();

  for (const tool of TOOLS) {
    if (!groups.has(tool.company)) {
      groups.set(tool.company, {
        name: tool.company,
        summary: tool.companySummary,
        officialUrl: tool.officialUrl,
        tools: [],
        categories: new Set(),
        hasPartnerPath: false
      });
    }

    const group = groups.get(tool.company);
    group.tools.push(tool);
    group.categories.add(tool.category);
    if (tool.affiliateProgramUrl) {
      group.hasPartnerPath = true;
    }
  }

  return [...groups.values()]
    .map(group => ({
      ...group,
      categories: [...group.categories].sort((left, right) => left.localeCompare(right))
    }))
    .sort((left, right) => {
      if (left.hasPartnerPath !== right.hasPartnerPath) {
        return Number(right.hasPartnerPath) - Number(left.hasPartnerPath);
      }
      return left.name.localeCompare(right.name);
    });
}

function matches(tool) {
  const text = [
    tool.name,
    tool.company,
    tool.category,
    tool.summary,
    tool.whatFor,
    tool.who,
    tool.useCase,
    tool.partnerStatus,
    ...(tool.tags || []),
    ...(tool.goals || []),
    ...(tool.audience || [])
  ].join(' ').toLowerCase();

  const goalOk = state.goal === 'All' || (tool.goals || []).includes(state.goal);
  const categoryOk = state.category === 'All' || tool.category === state.category;
  const priceOk = state.price === 'All' || tool.pricing === state.price;
  const audienceOk = state.audience === 'All' || (tool.audience || []).includes(state.audience);
  const companyOk = state.company === 'All' || tool.company === state.company;
  const searchOk = !state.search || text.includes(state.search.toLowerCase());

  return goalOk && categoryOk && priceOk && audienceOk && companyOk && searchOk;
}

function renderMetrics() {
  const metricTools = document.getElementById('metric-tools');
  const metricCompanies = document.getElementById('metric-companies');
  const metricGoals = document.getElementById('metric-goals');
  if (!metricTools || !metricCompanies || !metricGoals) return;

  metricTools.textContent = String(TOOLS.length);
  metricCompanies.textContent = String(companyGroups().length);
  metricGoals.textContent = String(allGoals().length);
}

function renderHeroGoalLinks() {
  const container = document.getElementById('hero-goal-links');
  if (!container) return;

  const goals = goalCounts().slice(0, 5).map(({ goal }) => goal);

  container.innerHTML = goals.map(goal => `
    <button class="inline-filter" type="button" data-hero-goal="${goal}">
      ${goal}
    </button>
  `).join('');

  container.querySelectorAll('[data-hero-goal]').forEach(button => {
    button.addEventListener('click', () => {
      const goal = button.getAttribute('data-hero-goal');
      const params = new URLSearchParams();
      if (goal) params.set('goal', goal);
      window.location.href = `./directory.html${params.toString() ? `?${params.toString()}` : ''}`;
    });
  });
}

function renderGoalGrid() {
  if (!goalGrid) return;

  const goals = goalCounts().slice(0, 8);

  goalGrid.innerHTML = goals.map(({ goal, count }) => {
    const copy = GOAL_COPY[goal] || {
      title: goal,
      description: 'Browse tools that support this type of work.',
      icon: initials(goal)
    };
    const examples = TOOLS
      .filter(tool => (tool.goals || []).includes(goal))
      .slice(0, 3)
      .map(tool => tool.name)
      .join(' • ');

    return `
      <button class="goal-card" type="button" data-goal-card="${goal}">
        <div class="goal-icon">${copy.icon}</div>
        <div class="goal-copy">
          <strong>${copy.title}</strong>
          <p>${copy.description}</p>
          <div class="goal-meta">${count} tool${count === 1 ? '' : 's'} • ${examples}</div>
        </div>
      </button>
    `;
  }).join('');

  goalGrid.querySelectorAll('[data-goal-card]').forEach(button => {
    button.addEventListener('click', () => {
      state.goal = button.getAttribute('data-goal-card');
      matchState.goal = state.goal;
      resetDirectoryView();
      scrollToChooser();
      render();
    });
  });
}

function renderMatcherPills(container, key, options) {
  if (!container) return;

  container.innerHTML = options.map(({ label, value }) => `
    <button class="pill ${matchState[key] === value ? 'active' : ''}" type="button" data-match-key="${key}" data-match-value="${value}">
      ${label}
    </button>
  `).join('');

  container.querySelectorAll('[data-match-key]').forEach(button => {
    button.addEventListener('click', () => {
      const nextKey = button.getAttribute('data-match-key');
      const nextValue = button.getAttribute('data-match-value');
      matchState[nextKey] = nextValue;
      render();
    });
  });
}

function matcherHasPreferences() {
  return Boolean(matchState.goal || matchState.audience !== 'All' || matchState.price !== 'All' || matchState.difficulty !== 'All');
}

function matcherBaseTools() {
  if (!matchState.goal) {
    return [...TOOLS];
  }

  return TOOLS.filter(tool => (tool.goals || []).includes(matchState.goal));
}

function matcherScore(tool) {
  let score = Number(tool.featured) * 4;

  if (matchState.goal && (tool.goals || []).includes(matchState.goal)) {
    score += 4;
  }
  if (matchState.audience !== 'All' && (tool.audience || []).includes(matchState.audience)) {
    score += 4;
  }
  if (matchState.price !== 'All' && tool.pricing === matchState.price) {
    score += 3;
  }
  if (matchState.difficulty !== 'All' && tool.difficulty === matchState.difficulty) {
    score += 2;
  }
  if (tool.difficulty === 'Easy') {
    score += 1;
  }
  if (tool.pricing === 'Free to try') {
    score += 1;
  }

  return score;
}

function matcherSort(left, right) {
  const scoreDiff = matcherScore(right) - matcherScore(left);
  if (scoreDiff) {
    return scoreDiff;
  }

  if (left.featured !== right.featured) {
    return Number(right.featured) - Number(left.featured);
  }

  if (left.difficulty !== right.difficulty) {
    return left.difficulty.localeCompare(right.difficulty);
  }

  return left.name.localeCompare(right.name);
}

function matcherIsExact(tool) {
  if (matchState.goal && !(tool.goals || []).includes(matchState.goal)) {
    return false;
  }
  if (matchState.audience !== 'All' && !(tool.audience || []).includes(matchState.audience)) {
    return false;
  }
  if (matchState.price !== 'All' && tool.pricing !== matchState.price) {
    return false;
  }
  if (matchState.difficulty !== 'All' && tool.difficulty !== matchState.difficulty) {
    return false;
  }

  return true;
}

function matcherReasons(tool) {
  const reasons = [];

  if (matchState.goal && (tool.goals || []).includes(matchState.goal)) {
    reasons.push(`Strong for ${matchState.goal.toLowerCase()}`);
  }
  if (matchState.audience !== 'All' && (tool.audience || []).includes(matchState.audience)) {
    reasons.push(`Fits ${matchState.audience.toLowerCase()} workflows`);
  }
  if (matchState.price !== 'All' && tool.pricing === matchState.price) {
    reasons.push(matchState.price);
  }
  if (matchState.difficulty !== 'All' && tool.difficulty === matchState.difficulty) {
    reasons.push(`${tool.difficulty} setup`);
  }
  if (tool.featured) {
    reasons.push('First-pick recommendation');
  }

  return reasons.slice(0, 4);
}

function matcherPreferenceSummary() {
  const parts = [];

  if (matchState.goal) parts.push(matchState.goal);
  if (matchState.audience !== 'All') parts.push(matchState.audience);
  if (matchState.price !== 'All') parts.push(matchState.price);
  if (matchState.difficulty !== 'All') parts.push(`${matchState.difficulty} setup`);

  return parts.join(' • ');
}

function matcherResultsData() {
  const base = matcherBaseTools().sort(matcherSort);
  const exact = base.filter(matcherIsExact);
  const results = [...exact];

  for (const tool of base) {
    if (!results.some(item => item.slug === tool.slug)) {
      results.push(tool);
    }
    if (results.length >= 3) {
      break;
    }
  }

  const secondaryFiltersSelected = [matchState.audience, matchState.price, matchState.difficulty].some(value => value !== 'All');

  return {
    results: results.slice(0, 3),
    total: base.length,
    exactCount: exact.length,
    relaxed: secondaryFiltersSelected && exact.length < Math.min(3, base.length)
  };
}

function renderMatcher() {
  if (!matchGrid || !matchStatus) return;

  const goalOptions = goalCounts().slice(0, 8).map(({ goal }) => ({ label: goal, value: goal }));
  if (matchState.goal && !goalOptions.some(option => option.value === matchState.goal)) {
    goalOptions.push({ label: matchState.goal, value: matchState.goal });
  }

  const audienceOptions = topAudiences(6).map(audience => ({ label: audience, value: audience }));
  if (matchState.audience !== 'All' && !audienceOptions.some(option => option.value === matchState.audience)) {
    audienceOptions.push({ label: matchState.audience, value: matchState.audience });
  }

  renderMatcherPills(matchGoalPills, 'goal', [
    { label: 'Not sure yet', value: '' },
    ...goalOptions
  ]);
  renderMatcherPills(matchAudiencePills, 'audience', [
    { label: 'Anyone', value: 'All' },
    ...audienceOptions
  ]);
  renderMatcherPills(matchPricePills, 'price', [
    { label: 'Any budget', value: 'All' },
    ...allPrices().map(price => ({ label: price, value: price }))
  ]);
  renderMatcherPills(matchDifficultyPills, 'difficulty', [
    { label: 'Any setup', value: 'All' },
    ...allDifficulties().map(difficulty => ({ label: difficulty, value: difficulty }))
  ]);

  const { results, total, exactCount, relaxed } = matcherResultsData();
  const summary = matcherPreferenceSummary();

  if (!results.length) {
    matchStatus.textContent = 'No tools matched those picks yet. Try a broader main job or leave one of the secondary filters open.';
    matchGrid.innerHTML = '<div class="empty">Nothing matched that combination yet. Broaden the job, budget, or setup preference and try again.</div>';
    return;
  }

  if (!matcherHasPreferences()) {
    matchStatus.textContent = 'These are general first picks. Pick the main job above and the shortlist will get much more useful.';
  } else if (relaxed && exactCount === 0) {
    matchStatus.textContent = `Nothing matched every preference exactly, so these are the closest fits${summary ? ` for ${summary}` : ''}.`;
  } else if (relaxed) {
    matchStatus.textContent = `Only ${exactCount} tool${exactCount === 1 ? '' : 's'} matched every preference exactly. The rest are close fits${summary ? ` for ${summary}` : ''}.`;
  } else {
    matchStatus.textContent = `These are the strongest starting points${summary ? ` for ${summary}` : ''}.`;
  }

  matchGrid.innerHTML = results.map(tool => {
    const reasons = matcherReasons(tool);
    const fitLabel = matcherHasPreferences()
      ? (matcherIsExact(tool) ? 'Matches your picks' : 'Close fit')
      : 'Good place to start';

    return `
      <article class="match-card">
        <div class="tagrow">
          <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
          ${companyChip(tool.company, tool.officialUrl)}
          <span class="chip">${tool.pricing}</span>
          <span class="chip ${matcherIsExact(tool) ? 'chip-accent' : ''}">${fitLabel}</span>
        </div>
        <h3>${tool.name}</h3>
        <p>${escapeHtml(toolPreviewDescription(tool))}</p>
        <div class="meta">${reasons.map(reason => `<span class="chip">${reason}</span>`).join('')}</div>
        <div><strong>Why choose it:</strong> ${tool.why}</div>
        <div class="micro-note"><strong>Skip if:</strong> ${tool.watchOuts}</div>
        <div class="card-links">
          <a class="small-link primary" href="./tools/${tool.slug}.html">See why it fits</a>
          <a class="small-link" href="${primaryUrl(tool)}" target="_blank" rel="${linkRel(tool)}">${primaryLabel(tool)}</a>
        </div>
      </article>
    `;
  }).join('');

  if (matchOpenDirectoryButton) {
    matchOpenDirectoryButton.disabled = total === 0;
  }
}

function selectedPromptTool() {
  return TOOLS.find(tool => tool.slug === promptToolSelect?.value) || sortedPromptTools()[0];
}

function buildPromptDraft(tool) {
  const task = promptTaskEl?.value.trim() || tool.useCase;
  const context = promptContextEl?.value.trim();
  const tone = promptToneEl?.value.trim();
  const outputFormat = promptOutputFormatEl?.value.trim();
  const constraints = promptConstraintsEl?.value.trim();

  return [
    `I am using ${tool.name} for this job: ${task}.`,
    `Best-fit reminder: ${tool.whatFor}`,
    context ? `Context:\n${context}` : '',
    outputFormat ? `What I want back:\n${outputFormat}` : 'What I want back:\nA practical answer I can use right away.',
    tone ? `Tone or style:\n${tone}` : 'Tone or style:\nClear, practical, and easy to act on.',
    constraints ? `Constraints:\n${constraints}` : '',
    'If anything critical is missing, ask up to 3 short clarifying questions before answering.',
    `Starter prompt to build from:\n${tool.firstPrompt}`
  ].filter(Boolean).join('\n\n');
}

function renderPromptLabOutput() {
  if (!promptResult || !promptMeta || !promptToolSelect) return;

  const tool = selectedPromptTool();
  const goals = (tool.goals || []).slice(0, 3).join(' • ');
  promptMeta.innerHTML = `
    <span class="chip">${tool.category}</span>
    ${companyChip(tool.company, tool.officialUrl)}
    <span class="chip">${tool.pricing}</span>
    <span class="chip">${goals}</span>
  `;
  promptResult.textContent = buildPromptDraft(tool);
}

function renderPromptToolPills() {
  if (!promptToolPills) return;

  const quickTools = sortedPromptTools().slice(0, 6);
  promptToolPills.innerHTML = quickTools.map(tool => `
    <button class="inline-filter ${promptToolSelect?.value === tool.slug ? 'active' : ''}" type="button" data-prompt-tool="${tool.slug}">
      ${tool.name}
    </button>
  `).join('');

  promptToolPills.querySelectorAll('[data-prompt-tool]').forEach(button => {
    button.addEventListener('click', () => {
      if (!promptToolSelect) return;
      promptToolSelect.value = button.getAttribute('data-prompt-tool');
      renderPromptToolPills();
      renderPromptLabOutput();
    });
  });
}

function initPromptLab() {
  if (promptLabInitialized || !promptToolSelect || !promptResult) return;

  const tools = sortedPromptTools();
  promptToolSelect.innerHTML = tools.map(tool => `
    <option value="${tool.slug}">${tool.name} — ${tool.category}</option>
  `).join('');

  promptToolSelect.value = tools[0]?.slug || '';
  if (promptTaskEl && tools[0]) {
    promptTaskEl.placeholder = tools[0].useCase;
  }

  renderPromptToolPills();
  renderPromptLabOutput();

  promptToolSelect.addEventListener('change', () => {
    const tool = selectedPromptTool();
    if (promptTaskEl) {
      promptTaskEl.placeholder = tool.useCase;
    }
    renderPromptToolPills();
    renderPromptLabOutput();
  });

  [promptTaskEl, promptContextEl, promptToneEl, promptOutputFormatEl, promptConstraintsEl].forEach(element => {
    element?.addEventListener('input', renderPromptLabOutput);
  });

  promptBuildButton?.addEventListener('click', renderPromptLabOutput);
  promptCopyButton?.addEventListener('click', async () => {
    if (!promptResult) return;
    await copyText(promptResult.textContent || '');
    const originalLabel = promptCopyButton.textContent;
    promptCopyButton.textContent = 'Copied';
    window.setTimeout(() => {
      promptCopyButton.textContent = originalLabel;
    }, 1400);
  });

  promptLabInitialized = true;
}

function renderGuideGrid() {
  if (!guideGrid) return;

  const goals = goalCounts().slice(0, 6);

  guideGrid.innerHTML = goals.map(({ goal, count }) => {
    const copy = GOAL_COPY[goal] || {
      title: goal,
      description: 'Browse tools that support this type of work.'
    };
    const shortlist = TOOLS
      .filter(tool => (tool.goals || []).includes(goal))
      .slice(0, 3)
      .map(tool => tool.name)
      .join(' • ');

    return `
      <a class="guide-card" href="${guideHref(goal)}">
        <div class="eyebrow">Guide</div>
        <h3>${copy.title}</h3>
        <p>${copy.description}</p>
        <div class="guide-meta">${count} tool${count === 1 ? '' : 's'} • ${shortlist}</div>
      </a>
    `;
  }).join('');
}

function renderComparisonGrid() {
  if (!comparisonGrid) return;

  comparisonGrid.innerHTML = COMPARISONS.map(comparison => {
    const shortlist = comparison.tools
      .map(slug => TOOLS.find(tool => tool.slug === slug))
      .filter(Boolean)
      .map(tool => tool.name)
      .join(' • ');

    return `
      <a class="comparison-card" href="${comparisonHref(comparison)}">
        <div class="eyebrow">Comparison</div>
        <h3>${comparison.title}</h3>
        <p>${escapeHtml(comparisonPreviewDescription(comparison))}</p>
        <div class="guide-meta">${shortlist}</div>
      </a>
    `;
  }).join('');
}

function renderFeatured() {
  if (!featuredGrid) return;

  const featuredTools = TOOLS.filter(tool => tool.featured).slice(0, 5);

  featuredGrid.innerHTML = featuredTools.map(tool => toolRow(tool, {
    badge: 'Good place to start',
    contextLabel: 'Why start here',
    contextText: tool.why,
    primaryCta: 'See why it fits'
  })).join('');
}

function renderCompanies() {
  if (!companyGrid) return;

  const companies = companyGroups();

  companyGrid.innerHTML = companies.map(company => {
    const activeClass = state.company === company.name ? 'active' : '';
    const categories = company.categories.slice(0, 3).map(category => `<span class="chip">${category}</span>`).join('');
    const tools = company.tools.slice(0, 2).map(tool => tool.name).join(' • ');
    const partnerBadge = company.hasPartnerPath ? '<span class="chip chip-accent">Partner program</span>' : '';

    return `
      <article class="company-card ${activeClass}">
        <div class="company-head">
          <div>
            <div class="eyebrow">Company</div>
            ${companyLink(company.name, company.officialUrl, 'company-link company-link-lg')}
          </div>
          ${partnerBadge}
        </div>
        <p>${escapeHtml(companyPreviewDescription(company))}</p>
        <div class="meta">${categories}</div>
        <div class="company-foot">
          <span>${company.tools.length} tool${company.tools.length === 1 ? '' : 's'}</span>
          <span>${tools}</span>
        </div>
        <div class="company-actions">
          <button class="small-link" type="button" data-company-filter="${company.name}">
            ${state.company === company.name ? 'Remove filter' : 'Filter directory'}
          </button>
        </div>
      </article>
    `;
  }).join('');

  companyGrid.querySelectorAll('[data-company-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const company = button.getAttribute('data-company-filter');
      state.company = state.company === company ? 'All' : company;
      resetDirectoryView();
      scrollToDirectory();
      render();
    });
  });
}

function directoryScore(tool) {
  let score = Number(tool.featured) * 4;

  if (state.goal !== 'All' && (tool.goals || []).includes(state.goal)) {
    score += 5;
  }
  if (state.audience !== 'All' && (tool.audience || []).includes(state.audience)) {
    score += 3;
  }
  if (state.price !== 'All' && tool.pricing === state.price) {
    score += 2;
  }
  if (tool.difficulty === 'Easy') {
    score += 1;
  }
  if (tool.pricing === 'Free to try') {
    score += 1;
  }

  return score;
}

function sortDirectoryResults(results) {
  return [...results].sort((left, right) => {
    if (state.sort === 'alphabetical') {
      return left.name.localeCompare(right.name);
    }

    if (state.sort === 'easy') {
      return difficultyRank(left.difficulty) - difficultyRank(right.difficulty)
        || Number(right.featured) - Number(left.featured)
        || priceRank(left.pricing) - priceRank(right.pricing)
        || left.name.localeCompare(right.name);
    }

    if (state.sort === 'free') {
      return priceRank(left.pricing) - priceRank(right.pricing)
        || difficultyRank(left.difficulty) - difficultyRank(right.difficulty)
        || Number(right.featured) - Number(left.featured)
        || left.name.localeCompare(right.name);
    }

    return directoryScore(right) - directoryScore(left)
      || Number(right.featured) - Number(left.featured)
      || difficultyRank(left.difficulty) - difficultyRank(right.difficulty)
      || left.name.localeCompare(right.name);
  });
}

function directoryReasons(tool) {
  const reasons = [];

  if (state.goal !== 'All' && (tool.goals || []).includes(state.goal)) {
    reasons.push(`Strong for ${state.goal.toLowerCase()}`);
  }
  if (state.audience !== 'All' && (tool.audience || []).includes(state.audience)) {
    reasons.push(`Fits ${state.audience.toLowerCase()} workflows`);
  }
  if (state.price !== 'All' && tool.pricing === state.price) {
    reasons.push(state.price);
  }
  if (tool.featured) {
    reasons.push('First-pick recommendation');
  }
  if (tool.difficulty === 'Easy') {
    reasons.push('Easy to start');
  }

  if (!reasons.length && tool.pricing === 'Free to try') {
    reasons.push('Free to try');
  }

  return reasons.slice(0, 4);
}

function directoryLeadCopy() {
  if (!state.search && state.goal === 'All' && state.audience === 'All' && state.price === 'All' && state.category === 'All' && state.company === 'All') {
    return 'No filters are active, so this is a safe place to start if you just want one strong recommendation first.';
  }

  return 'This rose to the top because it lines up well with the filters you have active right now.';
}

function renderDirectorySummary(results) {
  if (!directorySummary) return;

  if (!results.length) {
    directorySummary.innerHTML = '';
    return;
  }

  const [top, ...rest] = results;
  const alternates = rest.slice(0, 2);
  const reasons = directoryReasons(top);

  directorySummary.innerHTML = `
    <article class="directory-summary-card">
      <div class="directory-summary-head">
        <div>
          <div class="eyebrow">Best current match</div>
          <div class="tagrow" style="margin-top:10px">
            <span class="tag">${escapeHtml(toolFitLabel(top))}</span>
            ${companyChip(top.company, top.officialUrl)}
            <span class="chip">${top.pricing}</span>
            <span class="chip">${top.difficulty}</span>
          </div>
          <h3>${top.name}</h3>
          <p>${escapeHtml(toolPreviewDescription(top))}</p>
        </div>
        <a class="button primary" href="./tools/${top.slug}.html">Read full review</a>
      </div>
      <div class="meta">${reasons.map(reason => `<span class="chip">${reason}</span>`).join('')}</div>
      <div class="directory-summary-copy"><strong>Why it ranks here:</strong> ${directoryLeadCopy()}</div>
      <div class="directory-summary-copy"><strong>Good first use:</strong> ${top.useCase}</div>
      <div class="directory-summary-copy"><strong>Watch out:</strong> ${top.watchOuts}</div>
      ${alternates.length ? `
        <div class="directory-alt">
          <strong>Also compare:</strong>
          ${alternates.map(tool => `<a href="./tools/${tool.slug}.html">${tool.name}</a>`).join(' • ')}
        </div>
      ` : ''}
    </article>
  `;
}

function renderPills(container, values, key) {
  if (!container) return;

  const html = ['All', ...values].map(value => `
    <button class="pill ${state[key] === value ? 'active' : ''}" type="button" data-key="${key}" data-value="${value}">
      ${value}
    </button>
  `).join('');

  container.innerHTML = html;
  container.querySelectorAll('[data-key]').forEach(button => {
    button.addEventListener('click', () => {
      state[key] = button.getAttribute('data-value');
      if (key === 'goal') {
        matchState.goal = state.goal === 'All' ? '' : state.goal;
      }
      if (key === 'audience') {
        matchState.audience = state.audience;
      }
      if (key === 'price') {
        matchState.price = state.price;
      }
      resetDirectoryView();
      render();
    });
  });
}

function renderActiveFilters() {
  if (!activeFilters || !clearButton) return;

  const entries = [
    ['Goal', state.goal],
    ['Category', state.category],
    ['Price', state.price],
    ['Audience', state.audience],
    ['Company', state.company]
  ].filter(([, value]) => value !== 'All');

  if (!state.search && !entries.length) {
    activeFilters.innerHTML = '<span class="active-filter neutral">Showing the full directory.</span>';
    clearButton.style.visibility = 'hidden';
    return;
  }

  const searchChip = state.search ? `<span class="active-filter">Search: “${escapeHtml(state.search)}”</span>` : '';
  const chips = entries.map(([label, value]) => `<span class="active-filter">${label}: ${value}</span>`).join('');
  activeFilters.innerHTML = `${searchChip}${chips}`;
  clearButton.style.visibility = 'visible';
}

function toolRow(tool, options = {}) {
  const audience = (tool.audience || []).slice(0, 3).join(' • ');
  const badge = options.badge ? `<span class="chip chip-accent">${options.badge}</span>` : '';
  const contextLabel = options.contextLabel || 'Why choose it';
  const contextText = options.contextText || tool.why;
  const primaryCta = options.primaryCta || 'Read full review';
  const partnerNote = tool.affiliateUrl ? '<div class="micro-note">Partner link included.</div>' : '';

  return `
    <article class="tool-row">
      <div class="tool-row-main">
        <div class="tagrow">
          <span class="tag">${escapeHtml(toolFitLabel(tool))}</span>
          ${companyChip(tool.company, tool.officialUrl)}
          <span class="chip">${tool.pricing}</span>
          ${badge}
        </div>
        <h3>${tool.name}</h3>
        <p class="tool-row-summary">${escapeHtml(toolPreviewDescription(tool))}</p>
        <div class="tool-row-details">
          <div><strong>Best for:</strong> ${audience}</div>
          <div><strong>Good first use:</strong> ${tool.useCase}</div>
          <div><strong>${contextLabel}:</strong> ${contextText}</div>
          <div class="micro-note"><strong>Watch out:</strong> ${tool.watchOuts}</div>
        </div>
        ${partnerNote}
      </div>
      <div class="tool-row-actions">
        <a class="small-link primary" href="./tools/${tool.slug}.html">${primaryCta}</a>
        <a class="small-link" href="${primaryUrl(tool)}" target="_blank" rel="${linkRel(tool)}">${primaryLabel(tool)}</a>
      </div>
    </article>
  `;
}

function renderDirectory() {
  if (!grid || !countEl) return;

  const results = sortDirectoryResults(TOOLS.filter(matches));
  const visibleResults = results.slice(0, state.visibleCount);

  if (sortSelect) {
    sortSelect.value = state.sort;
  }

  renderDirectorySummary(results);

  countEl.textContent = results.length > visibleResults.length
    ? `${visibleResults.length} of ${results.length} tools shown`
    : `${results.length} tool${results.length === 1 ? '' : 's'} shown`;

  if (!results.length) {
    grid.innerHTML = '<div class="empty">No tools match that filter yet. Try broadening the goal, price, or audience filter.</div>';
    if (directoryActions) {
      directoryActions.innerHTML = '';
    }
    return;
  }

  grid.innerHTML = visibleResults.map(tool => toolRow(tool, {
    badge: tool.featured ? 'Strong first pick' : '',
    contextLabel: 'Why choose it',
    contextText: tool.why,
    primaryCta: 'Read full review'
  })).join('');

  if (directoryActions) {
    const showMore = results.length > visibleResults.length
      ? `<button class="button secondary" type="button" id="show-more-results">Show ${Math.min(6, results.length - visibleResults.length)} more tools</button>`
      : '';
    const showLess = state.visibleCount > 9 && results.length > 9
      ? '<button class="clear-button directory-reset" type="button" id="show-fewer-results">Show fewer</button>'
      : '';

    directoryActions.innerHTML = `${showMore}${showLess}`;

    document.getElementById('show-more-results')?.addEventListener('click', () => {
      state.visibleCount += 6;
      renderDirectory();
    });

    document.getElementById('show-fewer-results')?.addEventListener('click', () => {
      resetDirectoryView();
      renderDirectory();
    });
  }
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');
  const goal = params.get('goal');
  const category = params.get('category');
  const price = params.get('price');
  const audience = params.get('audience');
  const company = params.get('company');

  if (search) {
    state.search = search;
  }
  if (goal && allGoals().includes(goal)) {
    state.goal = goal;
  }
  if (category && allCategories().includes(category)) {
    state.category = category;
  }
  if (price && allPrices().includes(price)) {
    state.price = price;
  }
  if (audience && allAudiences().includes(audience)) {
    state.audience = audience;
  }
  if (company && companyGroups().some(item => item.name === company)) {
    state.company = company;
  }

  if (searchEl && state.search) {
    searchEl.value = state.search;
  }

  if (state.goal !== 'All') {
    matchState.goal = state.goal;
  }
  if (state.audience !== 'All') {
    matchState.audience = state.audience;
  }
  if (state.price !== 'All') {
    matchState.price = state.price;
  }
}

function syncUrl() {
  const params = new URLSearchParams();

  if (state.search) params.set('search', state.search);
  if (state.goal !== 'All') params.set('goal', state.goal);
  if (state.category !== 'All') params.set('category', state.category);
  if (state.price !== 'All') params.set('price', state.price);
  if (state.audience !== 'All') params.set('audience', state.audience);
  if (state.company !== 'All') params.set('company', state.company);

  const query = params.toString();
  const hash = window.location.hash || '';
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${hash}`;
  window.history.replaceState({}, '', nextUrl);
}

function scrollToDirectory() {
  document.getElementById('directory-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToChooser() {
  document.getElementById('matcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formLabelForField(field) {
  return field.closest('label')?.querySelector('span')?.textContent?.trim() || field.name || 'Field';
}

function buildMailtoUrl(form) {
  const subject = form.dataset.mailtoSubject || 'Website message';
  const formName = form.dataset.mailtoForm || 'website-request';
  const fields = [...form.querySelectorAll('input[name], select[name], textarea[name]')];
  const lines = [
    `Form: ${formName}`,
    'Source: ihelpwithai.com',
    `Page: ${window.location.href}`
  ];

  for (const field of fields) {
    const value = formatFieldValue(field.value);
    if (!value) continue;
    lines.push(`${formLabelForField(field)}: ${value}`);
  }

  const body = `${lines.join('\n\n')}\n`;
  return `mailto:${MAILTO_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function setupMailtoForms() {
  const forms = document.querySelectorAll('.mailto-form');

  for (const form of forms) {
    form.addEventListener('submit', event => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const status = form.querySelector('.mailto-status');
      if (status) {
        status.textContent = `Opening your email app. If nothing happens, email ${MAILTO_ADDRESS}.`;
      }

      window.location.href = buildMailtoUrl(form);
    });
  }
}

function render() {
  renderMetrics();
  renderHeroGoalLinks();
  renderGoalGrid();
  renderMatcher();
  renderGuideGrid();
  renderComparisonGrid();
  renderFeatured();
  renderCompanies();
  renderPills(goalPills, allGoals(), 'goal');
  renderPills(categoryPills, allCategories(), 'category');
  renderPills(pricePills, allPrices(), 'price');
  renderPills(audiencePills, allAudiences(), 'audience');
  renderActiveFilters();
  renderDirectory();
  syncUrl();
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    state.goal = 'All';
    state.category = 'All';
    state.price = 'All';
    state.audience = 'All';
    state.company = 'All';
    state.search = '';
    matchState.goal = '';
    matchState.audience = 'All';
    matchState.price = 'All';
    matchState.difficulty = 'All';
    resetDirectoryView();
    if (searchEl) {
      searchEl.value = '';
    }
    render();
  });
}

if (searchEl) {
  searchEl.addEventListener('input', event => {
    state.search = event.target.value.trim();
    resetDirectoryView();
    render();
  });
}

if (matchOpenDirectoryButton) {
  matchOpenDirectoryButton.addEventListener('click', () => {
    const params = new URLSearchParams();
    if (matchState.goal) params.set('goal', matchState.goal);
    if (matchState.price !== 'All') params.set('price', matchState.price);
    if (matchState.audience !== 'All') params.set('audience', matchState.audience);
    const query = params.toString();
    window.location.href = `./directory.html${query ? `?${query}` : ''}`;
  });
}

if (matchResetButton) {
  matchResetButton.addEventListener('click', () => {
    matchState.goal = '';
    matchState.audience = 'All';
    matchState.price = 'All';
    matchState.difficulty = 'All';
    state.goal = 'All';
    state.price = 'All';
    state.audience = 'All';
    resetDirectoryView();
    render();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', event => {
    state.sort = event.target.value;
    resetDirectoryView();
    renderDirectory();
  });
}

applyUrlState();
initPromptLab();
setupMailtoForms();
render();
