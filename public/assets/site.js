(function () {
  const data = Object.assign(
    { tools: [], tradeOptions: [], problemOptions: [], analytics: {} },
    window.IHWAI_SITE_DATA || {}
  );
  const stepIds = ['trade-team', 'bottleneck-stack', 'office-volume', 'budget-setup'];
  const budgetRank = { lean: 0, roi: 1, enterprise: 2 };
  const setupRank = { simple: 0, moderate: 1, invest: 2 };
  const shortlistState = {
    started: false,
    lastChoices: null
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return '';
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      void error;
    }
  }

  function createDistinctId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'ihai-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function createAnalytics(config) {
    const token = String(config.posthogToken || '').trim();
    const host = String(config.posthogHost || '')
      .trim()
      .replace(/\/+$/, '');
    const enabled = Boolean(token && token !== 'phc_REPLACE_ME' && host);
    const storageKey = 'ihai_anon_id';
    let distinctId = '';

    function getDistinctId() {
      if (distinctId) return distinctId;
      distinctId = safeStorageGet(storageKey);
      if (!distinctId) {
        distinctId = createDistinctId();
        safeStorageSet(storageKey, distinctId);
      }
      return distinctId;
    }

    function capture(eventName, properties) {
      if (!enabled) return;

      const payload = JSON.stringify({
        api_key: token,
        event: eventName,
        distinct_id: getDistinctId(),
        properties: Object.assign(
          {
            $current_url: window.location.href,
            $pathname: window.location.pathname,
            $lib: 'ihai-static-site'
          },
          properties || {}
        )
      });
      const endpoint = host + '/capture/';

      try {
        if (typeof navigator.sendBeacon === 'function') {
          const beacon = new Blob([payload], { type: 'application/json' });
          if (navigator.sendBeacon(endpoint, beacon)) return;
        }
      } catch (error) {
        void error;
      }

      try {
        window
          .fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            mode: 'cors',
            credentials: 'omit',
            keepalive: true
          })
          .catch(function () {});
      } catch (error) {
        void error;
      }
    }

    return {
      enabled: enabled,
      capture: capture
    };
  }

  const analytics = createAnalytics(data.analytics || {});

  function track(name, props, options) {
    const settings = Object.assign({ includePath: true }, options || {});
    const payload = Object.assign(
      {},
      settings.includePath ? { path: window.location.pathname } : {},
      props || {}
    );

    try {
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(Object.assign({ event: name }, payload));
      }
    } catch (error) {
      void error;
    }

    analytics.capture(name, payload);
  }

  function cleanLabel(target) {
    return String(target.getAttribute('aria-label') || target.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeInternalPath(href) {
    if (!href) return '';
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return '';
      return url.pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(url.pathname)
        ? url.pathname
        : url.pathname + '/';
    } catch (error) {
      return '';
    }
  }

  function getDestinationHostname(href) {
    if (!href) return '';
    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) return '';
      return url.hostname.replace(/^www\./i, '');
    } catch (error) {
      return '';
    }
  }

  function getAnalyticsTokens(target) {
    return String(target.getAttribute('data-analytics') || '')
      .split(/\s+/)
      .filter(Boolean);
  }

  function shortlistAnalyticsProps(choices) {
    const selected = choices || {};
    return {
      trade: selected.trade || '',
      team_size: selected.teamSize || '',
      bottleneck: selected.bottleneck || '',
      budget: selected.budget || '',
      setup_tolerance: selected.setupTolerance || '',
      current_stack: selected.currentStack || ''
    };
  }

  function buildLinkProps(target) {
    const href = target.getAttribute('href') || '';
    const props = {
      label: cleanLabel(target)
    };
    const targetPath = normalizeInternalPath(href);
    const destinationHostname = getDestinationHostname(href);
    if (targetPath) props.target_path = targetPath;
    if (destinationHostname) props.destination_hostname = destinationHostname;
    return props;
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
          track('ihai_template_copy_clicked', {
            template_id: button.getAttribute('data-copy-target') || ''
          });
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

    if (
      choices.currentStack === 'advanced-fsm' &&
      tool.categoryLabel === 'All in one field-service software'
    ) {
      score -= 2;
    }
    if (
      choices.currentStack === 'none-spreadsheets' &&
      tool.categoryLabel === 'All in one field-service software'
    ) {
      score += 2;
    }

    if (choices.bottleneck === 'office-admin' && (tool.slug === 'chatgpt' || tool.slug === 'zapier')) {
      score += 3;
    }
    if (
      choices.bottleneck === 'missed-calls' &&
      (tool.slug === 'callrail' || tool.slug === 'openphone')
    ) {
      score += 3;
    }

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
        return (
          '<a class="inline-link" href="' +
          compareLink.href +
          '" data-analytics="compare_cta">' +
          compareLink.label +
          '</a>'
        );
      })
      .join('');

    return (
      '<article class="card result-card">' +
      '<div class="card-kicker">Recommendation score ' +
      entry.score +
      '</div>' +
      '<h3>' +
      tool.name +
      '</h3>' +
      '<p>' +
      tool.summary +
      '</p>' +
      '<div class="pill-row">' +
      '<span class="pill">' +
      tool.categoryLabel +
      '</span>' +
      '<span class="pill">' +
      tool.setupLabel +
      '</span>' +
      '<span class="pill">' +
      tool.pricingLabel +
      '</span>' +
      '</div>' +
      '<p class="result-note"><strong>Why it fits:</strong> ' +
      tool.shortlistReason +
      '</p>' +
      '<div class="result-links">' +
      (tool.reviewPath
        ? '<a class="btn secondary small" href="' +
          tool.reviewPath +
          '" data-analytics="shortlist_result_click">Read review</a>'
        : '') +
      (tool.officialUrl
        ? '<a class="btn ghost-link" href="' +
          tool.officialUrl +
          '" target="_blank" rel="noopener noreferrer" data-analytics="shortlist_result_click outbound_tool_click">Official site</a>'
        : '') +
      '</div>' +
      (compareLinks ? '<div class="inline-links">' + compareLinks + '</div>' : '') +
      '</article>'
    );
  }

  function renderPrimaryDecision(tool, choices) {
    const lines = [];
    if (choices.bottleneck === 'missed-calls') {
      lines.push(
        'Start with the inbound lead leak first. If the team is missing calls, more marketing and better estimates will not matter much.'
      );
    } else if (choices.bottleneck === 'quote-follow-up') {
      lines.push(
        'Your first move should tighten how estimates turn into decisions. That usually means a stronger quote workflow, clearer follow-up, or both.'
      );
    } else if (choices.bottleneck === 'office-admin') {
      lines.push(
        'The fastest win is usually reducing repeat office drag before buying another giant platform.'
      );
    } else {
      lines.push('Pick the tool that matches the current bottleneck, not the broadest feature list.');
    }

    lines.push(tool.shortlistReason);
    return lines.join(' ');
  }

  function initShortlist() {
    const form = qs('[data-shortlist-form]');
    if (!form) return;

    const steps = stepIds
      .map(function (id) {
        return qs('[data-shortlist-step="' + id + '"]');
      })
      .filter(Boolean);
    const progressBar = qs('[data-shortlist-progress]');
    const progressLabel = qs('[data-shortlist-progress-label]');
    const backButton = qs('[data-shortlist-back]');
    const nextButton = qs('[data-shortlist-next]');
    const submitButton = qs('[data-shortlist-submit]');
    const resultGrid = qs('[data-shortlist-grid]');
    const primary = qs('[data-shortlist-primary]');
    const empty = qs('[data-shortlist-empty]');
    let currentStep = 0;

    function markStarted() {
      if (shortlistState.started) return;
      shortlistState.started = true;
      track('ihai_shortlist_started', shortlistAnalyticsProps(readChoices(form)), {
        includePath: false
      });
    }

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
      shortlistState.lastChoices = choices;
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
          ? '<h3>Recommended first move</h3><p>' +
            renderPrimaryDecision(ranked[0].tool, choices) +
            '</p>'
          : '<h3>No strong match yet</h3><p>Try loosening budget or setup constraints first. If the workflow itself is still undefined, start with the problem pages instead of forcing a tool pick.</p>';
      }
      if (empty) empty.hidden = ranked.length !== 0;

      track('ihai_shortlist_completed', shortlistAnalyticsProps(choices), {
        includePath: false
      });
    }

    form.addEventListener('change', function () {
      markStarted();
    });

    if (backButton) {
      backButton.addEventListener('click', function () {
        currentStep = Math.max(0, currentStep - 1);
        syncStep();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        if (!validateCurrentStep()) return;
        markStarted();
        track('ihai_shortlist_step_completed', shortlistAnalyticsProps(readChoices(form)), {
          includePath: false
        });
        currentStep = Math.min(steps.length - 1, currentStep + 1);
        syncStep();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validateCurrentStep()) return;
      markStarted();
      runShortlist();
      const target = qs('[data-shortlist-output]');
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    syncStep();
  }

  function getLeadFormKind(form) {
    const key = form.getAttribute('data-lead-form') || '';
    if (key.indexOf('starter-pack') === 0) return 'starter_pack';
    if (key === 'contact') return 'contact';
    return '';
  }

  function buildLeadFormProps(form, kind) {
    const props = {
      path: window.location.pathname,
      form_type: kind
    };
    const tradeField = form.elements.trade;
    if (tradeField && tradeField.value) props.trade = tradeField.value;
    return props;
  }

  function initLeadForms() {
    const startedForms = new WeakSet();

    qsa('[data-lead-form]').forEach(function (form) {
      const kind = getLeadFormKind(form);
      if (!kind) return;

      function markStarted() {
        if (startedForms.has(form)) return;
        startedForms.add(form);
        track(
          kind === 'starter_pack'
            ? 'ihai_starter_pack_form_started'
            : 'ihai_contact_form_started',
          buildLeadFormProps(form, kind),
          { includePath: false }
        );
      }

      form.addEventListener('focusin', markStarted);
      form.addEventListener('change', markStarted);
      form.addEventListener('submit', function () {
        markStarted();
        track(
          kind === 'starter_pack'
            ? 'ihai_starter_pack_form_submitted'
            : 'ihai_contact_form_submitted',
          buildLeadFormProps(form, kind),
          { includePath: false }
        );
      });
    });
  }

  function initLinkTracking() {
    document.addEventListener(
      'click',
      function (event) {
        const target = event.target.closest('[data-analytics]');
        if (!target) return;

        const linkProps = buildLinkProps(target);
        getAnalyticsTokens(target).forEach(function (token) {
          if (token === 'home_cta') {
            track('ihai_home_cta_click', linkProps);
          } else if (token === 'nav_click') {
            track('ihai_nav_click', linkProps);
          } else if (token === 'footer_click') {
            track('ihai_footer_click', linkProps);
          } else if (token === 'template_download') {
            track('ihai_template_download_clicked', linkProps);
          } else if (token === 'review_cta') {
            track('ihai_review_cta_clicked', linkProps);
          } else if (token === 'compare_cta') {
            track('ihai_compare_cta_clicked', linkProps);
          } else if (token === 'outbound_tool_click') {
            if (linkProps.destination_hostname) {
              track('ihai_outbound_tool_click', {
                destination_hostname: linkProps.destination_hostname
              });
            }
          } else if (token === 'shortlist_result_click') {
            track(
              'ihai_shortlist_result_clicked',
              shortlistAnalyticsProps(shortlistState.lastChoices),
              { includePath: false }
            );
          }
        });
      },
      true
    );
  }

  initMenu();
  initCopyButtons();
  initShortlist();
  initLeadForms();
  initLinkTracking();
  track('ihai_page_view', { title: document.title });
})();
