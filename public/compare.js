(function compareTrayBootstrap() {
  const tools = [...(window.IHWAI?.tools || [])];
  const comparisons = [...(window.IHWAI?.comparisons || [])];

  if (!tools.length) {
    return;
  }

  const STORAGE_KEY = 'ihwaiCompareTrayV1';
  const BUYER_SIGNAL_STORAGE_KEY = 'ihwaiBuyerSignalsV1';
  const BUYER_SIGNAL_LIMIT = 40;
  const COMPARE_LIMIT = 3;
  const toolMap = new Map(tools.map(tool => [tool.slug, tool]));

  const compareState = {
    slugs: readCompareSelection(),
    drawerOpen: false,
    differencesOnly: true
  };

  let trayElements = null;
  let observeTimer = null;
  let transientMessage = '';
  let messageTimer = null;

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function readCompareSelection() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.slugs)) {
        return parsed.slugs.filter(slug => toolMap.has(slug)).slice(0, COMPARE_LIMIT);
      }
    } catch {
      // Ignore storage errors so the compare tray still works.
    }

    return [];
  }

  function writeCompareSelection() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ slugs: compareState.slugs }));
    } catch {
      // Ignore storage errors so the compare tray still works.
    }
  }

  function readBuyerSignals() {
    try {
      const raw = window.localStorage.getItem(BUYER_SIGNAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.events)) {
        return parsed;
      }
    } catch {
      // Ignore storage errors so the compare tray keeps working.
    }

    return { events: [] };
  }

  function writeBuyerSignals(store) {
    try {
      window.localStorage.setItem(BUYER_SIGNAL_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage errors so the compare tray keeps working.
    }
  }

  function trackBuyerSignal(type, details = {}) {
    const store = readBuyerSignals();
    const event = {
      type,
      details,
      page: window.location.pathname,
      at: new Date().toISOString()
    };

    store.events = [...store.events, event].slice(-BUYER_SIGNAL_LIMIT);
    store.updatedAt = event.at;
    writeBuyerSignals(store);
  }

  function selectedTools() {
    return compareState.slugs.map(slug => toolMap.get(slug)).filter(Boolean);
  }

  function compareButtonLabel(slug) {
    if (compareState.slugs.includes(slug)) {
      return 'Added to compare';
    }

    if (compareState.slugs.length >= COMPARE_LIMIT) {
      return 'Compare tray full';
    }

    return 'Add to compare';
  }

  function categoryLabel(tool) {
    return tool.category || 'AI tool';
  }

  function primaryUrl(tool) {
    return tool.affiliateUrl || tool.officialUrl;
  }

  function primaryLabel(tool) {
    return tool.affiliateUrl ? 'Visit partner offer' : 'Visit official site';
  }

  function relFor(tool) {
    return tool.affiliateUrl ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
  }

  function listLabel(values) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    return items.length ? items.join(' • ') : '—';
  }

  function setupLabel(tool) {
    return tool.setupReality || `${tool.difficulty || 'Unknown'} setup`;
  }

  function pricingLabel(tool) {
    return tool.pricingSnapshot || tool.pricing || '—';
  }

  function prosLabel(tool) {
    const items = Array.isArray(tool.pros) ? tool.pros.slice(0, 2) : [];
    return items.length ? items.join(' • ') : '';
  }

  function consLabel(tool) {
    const items = Array.isArray(tool.cons) ? tool.cons.slice(0, 2) : [];
    return items.length ? items.join(' • ') : '';
  }

  function detailPath(tool) {
    return `/tools/${tool.slug}.html`;
  }

  function comparisonPath(comparison) {
    return `/comparisons/${comparison.slug}.html`;
  }

  function normalizeValue(value = '') {
    return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function matchingEditorialComparison(activeTools) {
    if (activeTools.length < 2) {
      return null;
    }

    const activeSlugs = activeTools.map(tool => tool.slug);
    let bestMatch = null;

    for (const comparison of comparisons) {
      const overlap = activeSlugs.filter(slug => comparison.tools.includes(slug));
      if (overlap.length < 2) {
        continue;
      }

      const exact = overlap.length === activeSlugs.length && comparison.tools.length === activeSlugs.length;
      const score = (exact ? 100 : 0) + overlap.length * 10 - Math.abs(comparison.tools.length - activeSlugs.length);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { comparison, score };
      }
    }

    return bestMatch?.comparison || null;
  }

  function comparisonRows(activeTools) {
    const rows = [
      {
        label: 'Workflow',
        values: activeTools.map(tool => categoryLabel(tool))
      },
      {
        label: 'Best jobs',
        values: activeTools.map(tool => listLabel(tool.goals))
      },
      {
        label: 'Best fit',
        values: activeTools.map(tool => tool.bestFit || tool.who || '—')
      },
      {
        label: 'Bad fit',
        values: activeTools.map(tool => tool.badFit || tool.watchOuts || '—')
      },
      {
        label: 'Pricing snapshot',
        values: activeTools.map(tool => pricingLabel(tool))
      },
      {
        label: 'Setup reality',
        values: activeTools.map(tool => setupLabel(tool))
      },
      {
        label: 'Best first use',
        values: activeTools.map(tool => tool.useCase || '—')
      },
      {
        label: 'Why choose it',
        values: activeTools.map(tool => tool.why || '—')
      },
      {
        label: 'Watch out',
        values: activeTools.map(tool => tool.watchOuts || '—')
      },
      {
        label: 'Pros',
        values: activeTools.map(tool => prosLabel(tool))
      },
      {
        label: 'Cons',
        values: activeTools.map(tool => consLabel(tool))
      }
    ];

    return rows.filter(row => row.values.some(Boolean));
  }

  function rowDiffers(row) {
    const normalized = row.values.map(value => normalizeValue(value || '—'));
    return new Set(normalized).size > 1;
  }

  function setTransientMessage(message) {
    transientMessage = message;

    if (messageTimer) {
      window.clearTimeout(messageTimer);
    }

    if (message) {
      messageTimer = window.setTimeout(() => {
        transientMessage = '';
        renderCompareTray();
      }, 2200);
    }

    renderCompareTray();
  }

  function ensureTray() {
    if (trayElements) {
      return trayElements;
    }

    const tray = document.createElement('section');
    tray.className = 'compare-tray';
    tray.id = 'compare-tray';
    tray.hidden = true;
    tray.innerHTML = `
      <div class="compare-tray-shell">
        <div class="compare-tray-bar">
          <div class="compare-tray-copy">
            <div class="eyebrow">Compare tools</div>
            <strong id="compare-tray-title">Pick up to 3 tools</strong>
            <p id="compare-tray-note">Use compare to see setup, pricing, and fit side by side.</p>
          </div>
          <div class="compare-selected" id="compare-selected"></div>
          <div class="compare-tray-actions">
            <button class="button primary" id="compare-open" type="button">Compare now</button>
            <button class="clear-button" id="compare-clear" type="button">Clear</button>
          </div>
        </div>
        <div class="compare-drawer" id="compare-drawer" hidden>
          <div class="compare-drawer-head">
            <div>
              <h2>Compare what actually changes</h2>
              <p>Start by scanning the differences. Open the full review when you need more depth.</p>
            </div>
            <label class="compare-differences-toggle">
              <input id="compare-differences" type="checkbox" checked>
              <span>Show only differences</span>
            </label>
          </div>
          <div class="compare-editorial-link" id="compare-editorial-link"></div>
          <div class="compare-table-wrap" id="compare-table-wrap"></div>
        </div>
      </div>
    `;

    document.body.appendChild(tray);

    const openButton = tray.querySelector('#compare-open');
    const clearButton = tray.querySelector('#compare-clear');
    const differencesToggle = tray.querySelector('#compare-differences');

    openButton?.addEventListener('click', () => {
      if (compareState.slugs.length < 2) {
        setTransientMessage('Pick at least 2 tools before opening the compare view.');
        return;
      }

      compareState.drawerOpen = !compareState.drawerOpen;
      if (compareState.drawerOpen) {
        trackBuyerSignal('compare_opened', {
          slugs: compareState.slugs,
          tools: selectedTools().map(tool => tool.name)
        });
      }
      renderCompareTray();
    });

    clearButton?.addEventListener('click', () => {
      if (!compareState.slugs.length) {
        return;
      }

      compareState.slugs = [];
      compareState.drawerOpen = false;
      writeCompareSelection();
      trackBuyerSignal('compare_cleared');
      renderCompareButtons();
      renderCompareTray();
    });

    differencesToggle?.addEventListener('change', event => {
      compareState.differencesOnly = event.target.checked;
      renderCompareTray();
    });

    trayElements = {
      tray,
      selected: tray.querySelector('#compare-selected'),
      title: tray.querySelector('#compare-tray-title'),
      note: tray.querySelector('#compare-tray-note'),
      openButton,
      clearButton,
      drawer: tray.querySelector('#compare-drawer'),
      editorialLink: tray.querySelector('#compare-editorial-link'),
      tableWrap: tray.querySelector('#compare-table-wrap'),
      differencesToggle
    };

    return trayElements;
  }

  function renderCompareButtons() {
    document.querySelectorAll('[data-compare-tool]').forEach(button => {
      const slug = button.getAttribute('data-compare-tool') || '';
      const selected = compareState.slugs.includes(slug);
      const disabled = !selected && compareState.slugs.length >= COMPARE_LIMIT;

      button.classList.toggle('is-selected', selected);
      button.disabled = disabled;
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.textContent = compareButtonLabel(slug);

      if (button.dataset.compareBound === 'true') {
        return;
      }

      button.dataset.compareBound = 'true';
      button.addEventListener('click', () => {
        toggleTool(slug);
      });
    });
  }

  function renderCompareTray() {
    const elements = ensureTray();
    const activeTools = selectedTools();

    document.body.classList.toggle('has-compare-tray', activeTools.length > 0);
    elements.tray.hidden = activeTools.length === 0;
    if (!activeTools.length) {
      elements.drawer.hidden = true;
      return;
    }

    const comparison = matchingEditorialComparison(activeTools);
    const remaining = Math.max(0, 2 - activeTools.length);
    const defaultNote = remaining > 0
      ? `Add ${remaining} more tool${remaining === 1 ? '' : 's'} to open the side-by-side comparison.`
      : 'Scan the differences first, then open the strongest review if you need more depth.';

    elements.title.textContent = activeTools.length >= 2
      ? `${activeTools.length} tools ready to compare`
      : `${activeTools[0].name} is in your compare tray`;
    elements.note.textContent = transientMessage || defaultNote;
    elements.selected.innerHTML = activeTools.map(tool => `
      <button class="compare-pill" type="button" data-remove-compare="${escapeHtml(tool.slug)}">
        <span>${escapeHtml(tool.name)}</span>
        <span aria-hidden="true">×</span>
      </button>
    `).join('');
    elements.selected.querySelectorAll('[data-remove-compare]').forEach(button => {
      button.addEventListener('click', () => removeTool(button.getAttribute('data-remove-compare') || ''));
    });

    elements.openButton.disabled = activeTools.length < 2;
    elements.openButton.textContent = compareState.drawerOpen && activeTools.length >= 2
      ? 'Hide comparison'
      : 'Compare now';
    elements.clearButton.hidden = activeTools.length === 0;

    if (elements.differencesToggle) {
      elements.differencesToggle.checked = compareState.differencesOnly;
    }

    elements.drawer.hidden = !compareState.drawerOpen || activeTools.length < 2;

    if (elements.drawer.hidden) {
      return;
    }

    elements.editorialLink.innerHTML = comparison
      ? `<a class="small-link primary" href="${comparisonPath(comparison)}">Open editorial comparison: ${escapeHtml(comparison.title)}</a>`
      : '<span class="micro-note">No editorial comparison exists for this exact mix yet, so use the side-by-side view below.</span>';

    const rows = comparisonRows(activeTools);
    const visibleRows = compareState.differencesOnly ? rows.filter(rowDiffers) : rows;

    elements.tableWrap.innerHTML = `
      <div class="compare-table" style="--compare-columns:${activeTools.length}">
        <div class="compare-table-row compare-table-head">
          <div class="compare-table-label">What matters</div>
          ${activeTools.map(tool => `
            <div class="compare-table-tool">
              <div class="compare-table-tool-head">
                <div class="eyebrow">${escapeHtml(tool.company)}</div>
                <strong>${escapeHtml(tool.name)}</strong>
                <div class="compare-table-meta">${escapeHtml(tool.pricing)} • ${escapeHtml(tool.difficulty)} setup</div>
              </div>
              <div class="compare-table-actions">
                <a class="small-link primary" href="${detailPath(tool)}">Read review</a>
                <a class="small-link" href="${escapeHtml(primaryUrl(tool))}" target="_blank" rel="${relFor(tool)}">${escapeHtml(primaryLabel(tool))}</a>
              </div>
            </div>
          `).join('')}
        </div>
        ${visibleRows.map(row => `
          <div class="compare-table-row ${rowDiffers(row) ? 'is-different' : 'is-same'}">
            <div class="compare-table-label">${escapeHtml(row.label)}</div>
            ${row.values.map(value => `<div class="compare-table-value">${escapeHtml(value || '—')}</div>`).join('')}
          </div>
        `).join('')}
      </div>
      ${compareState.differencesOnly && !visibleRows.length ? '<div class="empty">These picks look almost identical on the main fields. Turn off “Show only differences” to inspect the full side-by-side view.</div>' : ''}
    `;
  }

  function addTool(slug) {
    if (!toolMap.has(slug)) {
      return;
    }

    if (compareState.slugs.includes(slug)) {
      compareState.drawerOpen = true;
      renderCompareButtons();
      renderCompareTray();
      return;
    }

    if (compareState.slugs.length >= COMPARE_LIMIT) {
      setTransientMessage('The compare tray holds up to 3 tools. Remove one first.');
      renderCompareButtons();
      return;
    }

    compareState.slugs = [...compareState.slugs, slug];
    compareState.drawerOpen = compareState.slugs.length >= 2;
    writeCompareSelection();
    trackBuyerSignal('compare_tool_added', {
      slug,
      toolName: toolMap.get(slug)?.name || slug,
      slugs: compareState.slugs
    });
    renderCompareButtons();
    renderCompareTray();
  }

  function removeTool(slug) {
    if (!compareState.slugs.includes(slug)) {
      return;
    }

    compareState.slugs = compareState.slugs.filter(item => item !== slug);
    if (compareState.slugs.length < 2) {
      compareState.drawerOpen = false;
    }
    writeCompareSelection();
    trackBuyerSignal('compare_tool_removed', {
      slug,
      slugs: compareState.slugs
    });
    renderCompareButtons();
    renderCompareTray();
  }

  function toggleTool(slug) {
    if (compareState.slugs.includes(slug)) {
      removeTool(slug);
      return;
    }

    addTool(slug);
  }

  function compareTools(slugs) {
    const uniqueSlugs = [...new Set((slugs || []).filter(slug => toolMap.has(slug)))].slice(0, COMPARE_LIMIT);
    if (!uniqueSlugs.length) {
      return;
    }

    compareState.slugs = uniqueSlugs;
    compareState.drawerOpen = uniqueSlugs.length >= 2;
    writeCompareSelection();
    trackBuyerSignal('compare_seeded', {
      slugs: uniqueSlugs,
      tools: uniqueSlugs.map(slug => toolMap.get(slug)?.name || slug)
    });
    renderCompareButtons();
    renderCompareTray();
    ensureTray().tray.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function scheduleRefresh() {
    if (observeTimer) {
      return;
    }

    observeTimer = window.setTimeout(() => {
      observeTimer = null;
      renderCompareButtons();
      renderCompareTray();
    }, 30);
  }

  ensureTray();
  renderCompareButtons();
  renderCompareTray();

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.IHWAICompare = {
    addTool,
    removeTool,
    toggleTool,
    compareTools,
    refresh: scheduleRefresh,
    selectedSlugs: () => [...compareState.slugs]
  };
})();
