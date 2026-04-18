(function () {
  const data = window.IHWAI_SITE_DATA || { tools: [], tradeOptions: [], problemOptions: [] };
  const stepIds = ['trade-team', 'bottleneck-stack', 'office-volume', 'budget-setup'];
  const budgetRank = { lean: 0, roi: 1, enterprise: 2 };
  const setupRank = { simple: 0, moderate: 1, invest: 2 };
  const teamRank = { solo: 0, '2-5': 1, '6-15': 2, '16-40': 3, '40+': 4 };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function track(name, props) {
    const payload = Object.assign({ path: window.location.pathname }, props || {});
    try {
      if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: name }, payload));
      if (typeof window.plausible === 'function') window.plausible(name, { props: payload });
      if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, payload);
    } catch (error) {
      void error;
    }
  }

  function initMenu() {
    const toggle = qs('[data-menu-toggle]');
    const menu = qs('[data-menu]');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });
  }

  function initCopyButtons() {
    qsa('[data-copy-target]').forEach(function (button) {
      button.addEventListener('click', async function () {
        const target = document.getElementById(button.getAttribute('data-copy-target'));
        if (!target) return;
        const original = button.textContent;
        try {
          await navigator.clipboard.writeText(target.textContent.trim());
          button.textContent = 'Copied';
          track('template_copy', { target: button.getAttribute('data-copy-target') });
        } catch (error) {
          button.textContent = 'Copy failed';
        }
        window.setTimeout(function () {
          button.textContent = original;
        }, 1400);
      });
    });
  }

  function rankTool(tool, choices) {
    let score = 0;

    if (choices.trade && tool.tradeFit.includes(choices.trade)) score += 5;
    if (choices.bottleneck && tool.problems.includes(choices.bottleneck)) score += 7;
    if (choices.teamSize && tool.teamSizeFit.includes(choices.teamSize)) score += 3;

    if (choices.budget) {
      const delta = tool.budgetLevel - budgetRank[choices.budget];
      score -= Math.max(0, delta) * 3;
      if (delta <= 0) score += 1;
    }

    if (choices.setupTolerance) {
      const delta = tool.setupLevel - setupRank[choices.setupTolerance];
      score -= Math.max(0, delta) * 3;
      if (delta <= 0) score += 1;
    }

    if (choices.currentStack && tool.currentStackFit.includes(choices.currentStack)) score += 2;
    if (choices.officeSupport === 'none' && tool.officeStrength > 1) score += tool.officeStrength;
    if (choices.officeSupport === 'one-person' && tool.officeStrength > 0) score += 1;

    if (choices.afterHoursLeadVolume === 'frequent') score += tool.afterHoursStrength;
    if (choices.afterHoursLeadVolume === 'major') score += tool.afterHoursStrength * 2;

    if (choices.currentStack === 'advanced-fsm' && tool.categoryLabel === 'All in one field-service software') score -= 2;
    if (choices.currentStack === 'none-spreadsheets' && tool.categoryLabel === 'All in one field-service software') score += 2;

    if (choices.bottleneck === 'office-admin' && (tool.slug === 'chatgpt' || tool.slug === 'zapier')) score += 3;
    if (choices.bottleneck === 'missed-calls' && (tool.slug === 'callrail' || tool.slug === 'openphone')) score += 3;

    return score;
  }

  function readChoices(form) {
    return {
      trade: form.elements.trade.value,
      teamSize: form.elements.teamSize.value,
      bottleneck: form.elements.bottleneck.value,
      currentStack: form.elements.currentStack.value,
      officeSupport: form.elements.officeSupport.value,
      afterHoursLeadVolume: form.elements.afterHoursLeadVolume.value,
      budget: form.elements.budget.value,
      setupTolerance: form.elements.setupTolerance.value
    };
  }

  function renderResultCard(entry) {
    const tool = entry.tool;
    const compareLinks = (tool.compareLinks || [])
      .map(function (compareLink) {
        return '<a class="inline-link" href="' + compareLink.href + '">' + compareLink.label + '</a>';
      })
      .join('');

    return (
      '<article class="card result-card">' +
      '<div class="card-kicker">Recommendation score ' + entry.score + '</div>' +
      '<h3>' + tool.name + '</h3>' +
      '<p>' + tool.summary + '</p>' +
      '<div class="pill-row">' +
      '<span class="pill">' + tool.categoryLabel + '</span>' +
      '<span class="pill">' + tool.setupLabel + '</span>' +
      '<span class="pill">' + tool.pricingLabel + '</span>' +
      '</div>' +
      '<p class="result-note"><strong>Why it fits:</strong> ' + tool.shortlistReason + '</p>' +
      '<div class="result-links">' +
      (tool.reviewPath ? '<a class="btn secondary small" href="' + tool.reviewPath + '">Read review</a>' : '') +
      (tool.officialUrl ? '<a class="btn ghost-link" href="' + tool.officialUrl + '" target="_blank" rel="noopener noreferrer">Official site</a>' : '') +
      '</div>' +
      (compareLinks ? '<div class="inline-links">' + compareLinks + '</div>' : '') +
      '</article>'
    );
  }

  function renderPrimaryDecision(tool, choices) {
    const lines = [];
    if (choices.bottleneck === 'missed-calls') {
      lines.push('Start with the inbound lead leak first. If the team is missing calls, more marketing and better estimates will not matter much.');
    } else if (choices.bottleneck === 'quote-follow-up') {
      lines.push('Your first move should tighten how estimates turn into decisions. That usually means a stronger quote workflow, clearer follow-up, or both.');
    } else if (choices.bottleneck === 'office-admin') {
      lines.push('The fastest win is usually reducing repeat office drag before buying another giant platform.');
    } else {
      lines.push('Pick the tool that matches the current bottleneck, not the broadest feature list.');
    }

    lines.push(tool.shortlistReason);
    return lines.join(' ');
  }

  function initShortlist() {
    const form = qs('[data-shortlist-form]');
    if (!form) return;

    const steps = stepIds.map(function (id) {
      return qs('[data-shortlist-step="' + id + '"]');
    }).filter(Boolean);
    const progressBar = qs('[data-shortlist-progress]');
    const progressLabel = qs('[data-shortlist-progress-label]');
    const backButton = qs('[data-shortlist-back]');
    const nextButton = qs('[data-shortlist-next]');
    const submitButton = qs('[data-shortlist-submit]');
    const results = qs('[data-shortlist-results]');
    const resultGrid = qs('[data-shortlist-grid]');
    const primary = qs('[data-shortlist-primary]');
    const empty = qs('[data-shortlist-empty]');
    let currentStep = 0;

    function validateCurrentStep() {
      const step = steps[currentStep];
      if (!step) return true;
      const fields = qsa('input, select, textarea', step).filter(function (field) {
        return !field.disabled && field.type !== 'hidden';
      });
      const firstInvalid = fields.find(function (field) {
        return !field.checkValidity();
      });
      if (!firstInvalid) return true;
      if (typeof firstInvalid.reportValidity === 'function') firstInvalid.reportValidity();
      if (typeof firstInvalid.focus === 'function') firstInvalid.focus();
      return false;
    }

    function syncStep() {
      steps.forEach(function (step, index) {
        step.hidden = index !== currentStep;
      });
      if (progressBar) progressBar.style.width = ((currentStep + 1) / steps.length) * 100 + '%';
      if (progressLabel) progressLabel.textContent = 'Step ' + (currentStep + 1) + ' of ' + steps.length;
      if (backButton) backButton.disabled = currentStep === 0;
      if (nextButton) nextButton.hidden = currentStep === steps.length - 1;
      if (submitButton) submitButton.hidden = currentStep !== steps.length - 1;
    }

    function runShortlist() {
      const choices = readChoices(form);
      const ranked = data.tools
        .map(function (tool) {
          return { tool: tool, score: rankTool(tool, choices) };
        })
        .filter(function (entry) {
          return entry.score > -3;
        })
        .sort(function (left, right) {
          return right.score - left.score || left.tool.name.localeCompare(right.tool.name);
        })
        .slice(0, 3);

      if (resultGrid) {
        resultGrid.innerHTML = ranked.map(renderResultCard).join('');
      }
      if (primary) {
        primary.innerHTML = ranked[0]
          ? '<h3>Recommended first move</h3><p>' + renderPrimaryDecision(ranked[0].tool, choices) + '</p>'
          : '<h3>No strong match yet</h3><p>Try loosening budget or setup constraints first. If the workflow itself is still undefined, start with the problem pages instead of forcing a tool pick.</p>';
      }
      if (empty) empty.hidden = ranked.length !== 0;
      track('shortlist_completed', {
        trade: choices.trade || '',
        bottleneck: choices.bottleneck || '',
        topTool: ranked[0] ? ranked[0].tool.slug : '',
        results: ranked.length
      });
    }

    if (backButton) {
      backButton.addEventListener('click', function () {
        currentStep = Math.max(0, currentStep - 1);
        syncStep();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        if (!validateCurrentStep()) return;
        currentStep = Math.min(steps.length - 1, currentStep + 1);
        syncStep();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validateCurrentStep()) return;
      runShortlist();
      const target = qs('[data-shortlist-output]');
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    syncStep();
  }

  function initLeadForms() {
    qsa('[data-lead-form]').forEach(function (form) {
      form.addEventListener('submit', function () {
        track('lead_form_submitted', { form: form.getAttribute('data-lead-form') || 'unknown' });
      });
    });
  }

  function initLinkTracking() {
    document.addEventListener(
      'click',
      function (event) {
        const target = event.target.closest('[data-track], a[href], button[data-track]');
        if (!target) return;
        const name = target.getAttribute('data-track');
        if (name) {
          track(name, { label: (target.textContent || '').trim() });
          return;
        }
        if (target.tagName === 'A') {
          const href = target.getAttribute('href') || '';
          if (/^https?:/i.test(href) && href.indexOf(window.location.hostname) === -1) {
            track('outbound_click', { href: href });
          }
        }
      },
      true
    );
  }

  initMenu();
  initCopyButtons();
  initShortlist();
  initLeadForms();
  initLinkTracking();
})();
