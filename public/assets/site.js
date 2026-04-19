(function () {
  const data = Object.assign({ analytics: {}, shortlists: {} }, window.IHWAI_SITE_DATA || {});
  const fieldBudgetRank = { lean: 0, roi: 1, enterprise: 2 };
  const fieldSetupRank = { simple: 0, moderate: 1, invest: 2 };
  const beautyBudgetRank = {
    'free-low': 0,
    'under-50': 1,
    '50-150': 2,
    '150-500': 3,
    'multi-location-budget': 4
  };
  const beautySetupRank = { 'simple-mobile': 0, moderate: 1, advanced: 2 };
  let lastShortlistContext = null;

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
            $current_url: window.location.origin + window.location.pathname,
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

  function rankFieldTool(tool, choices) {
    let score = 0;

    if (choices.trade && Array.isArray(tool.tradeFit) && tool.tradeFit.includes(choices.trade)) score += 5;
    if (choices.bottleneck && Array.isArray(tool.problems) && tool.problems.includes(choices.bottleneck)) score += 7;
    if (choices.teamSize && Array.isArray(tool.teamSizeFit) && tool.teamSizeFit.includes(choices.teamSize)) score += 3;

    if (choices.budget) {
      const delta = Number(tool.budgetLevel || 0) - Number(fieldBudgetRank[choices.budget] || 0);
      score -= Math.max(0, delta) * 3;
      if (delta <= 0) score += 1;
    }

    if (choices.setupTolerance) {
      const delta = Number(tool.setupLevel || 0) - Number(fieldSetupRank[choices.setupTolerance] || 0);
      score -= Math.max(0, delta) * 3;
      if (delta <= 0) score += 1;
    }

    if (
      choices.currentStack &&
      Array.isArray(tool.currentStackFit) &&
      tool.currentStackFit.includes(choices.currentStack)
    ) {
      score += 2;
    }

    if (choices.officeSupport === 'none' && Number(tool.officeStrength || 0) > 1) {
      score += Number(tool.officeStrength || 0);
    }
    if (choices.officeSupport === 'one-person' && Number(tool.officeStrength || 0) > 0) {
      score += 1;
    }

    if (choices.afterHoursLeadVolume === 'frequent') score += Number(tool.afterHoursStrength || 0);
    if (choices.afterHoursLeadVolume === 'major') score += Number(tool.afterHoursStrength || 0) * 2;

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

  function rankBeautyTool(tool, choices) {
    let score = 0;

    if (
      choices.businessType &&
      Array.isArray(tool.businessTypeFit) &&
      tool.businessTypeFit.includes(choices.businessType)
    ) {
      score += 6;
    }
    if (choices.bottleneck && Array.isArray(tool.problems) && tool.problems.includes(choices.bottleneck)) {
      score += 7;
    }
    if (choices.teamSize && Array.isArray(tool.teamSizeFit) && tool.teamSizeFit.includes(choices.teamSize)) {
      score += 4;
    }

    if (choices.budget) {
      const delta = Number(tool.budgetLevel || 0) - Number(beautyBudgetRank[choices.budget] || 0);
      score -= Math.max(0, delta) * 2;
      if (delta <= 0) score += 1;
    }

    if (choices.setupTolerance) {
      const delta = Number(tool.setupLevel || 0) - Number(beautySetupRank[choices.setupTolerance] || 0);
      score -= Math.max(0, delta) * 3;
      if (delta <= 0) score += 1;
    }

    if (
      choices.currentStack &&
      Array.isArray(tool.currentStackFit) &&
      tool.currentStackFit.includes(choices.currentStack)
    ) {
      score += 2;
    }

    if (choices.bottleneck === 'no-shows') {
      score += Number(tool.noShowStrength || 0) * 3 + Number(tool.depositStrength || 0) * 2;
    } else if (choices.bottleneck === 'rebooking') {
      score += Number(tool.retentionStrength || 0) * 3 + Number(tool.bookingStrength || 0);
    } else if (choices.bottleneck === 'client-retention') {
      score += Number(tool.retentionStrength || 0) * 3;
    } else if (choices.bottleneck === 'dms-and-lead-response') {
      score += Number(tool.leadResponseStrength || 0) * 3;
    } else if (choices.bottleneck === 'social-content') {
      score += Number(tool.socialStrength || 0) * 4;
    } else if (choices.bottleneck === 'reviews-and-referrals') {
      score += Number(tool.retentionStrength || 0) * 2 + Number(tool.leadResponseStrength || 0);
    } else if (choices.bottleneck === 'deposits-and-cancellations') {
      score += Number(tool.depositStrength || 0) * 3 + Number(tool.noShowStrength || 0) * 2;
    } else if (choices.bottleneck === 'front-desk-admin') {
      score += Number(tool.adminStrength || 0) * 3;
    }

    if (choices.teamSize === 'multi-location' && ['vagaro', 'boulevard', 'mangomint'].includes(tool.slug)) {
      score += 3;
    }
    if (
      choices.currentStack === 'paper-calendar' &&
      ['vagaro', 'glossgenius', 'square-appointments', 'boulevard', 'fresha', 'booksy', 'mangomint'].includes(tool.slug)
    ) {
      score += 3;
    }
    if (
      choices.currentStack === 'instagram-dms' &&
      ['glossgenius', 'vagaro', 'square-appointments', 'booksy', 'fresha'].includes(tool.slug)
    ) {
      score += 2;
    }
    if (choices.bottleneck === 'social-content' && (tool.slug === 'chatgpt' || tool.slug === 'canva')) {
      score += 4;
    }
    if (choices.bottleneck === 'dms-and-lead-response' && tool.slug === 'zapier') {
      score += 2;
    }
    if (choices.currentStack === 'paper-calendar' && tool.slug === 'chatgpt') {
      score -= 3;
    }

    return score;
  }

  function renderResultCard(entry, config) {
    const tool = entry.tool;
    const compareLinks = (tool.compareLinks || [])
      .map(function (compareLink) {
        const token = config.key === 'beauty' ? 'compare_cta beauty_compare_cta' : 'compare_cta';
        return (
          '<a class="inline-link" href="' +
          compareLink.href +
          '" data-analytics="' +
          token +
          '">' +
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

  function renderFieldPrimaryDecision(tool, choices) {
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

  function renderBeautyPrimaryDecision(tool, choices) {
    const lines = [];
    if (choices.bottleneck === 'no-shows') {
      lines.push(
        'Protect the calendar first. If no-shows and late changes are still loose, prettier marketing will not solve the real leak.'
      );
    } else if (choices.bottleneck === 'rebooking' || choices.bottleneck === 'client-retention') {
      lines.push(
        'The next move should make repeat visits easier and more consistent, not just add another place to post content.'
      );
    } else if (choices.bottleneck === 'dms-and-lead-response') {
      lines.push(
        'Start by tightening lead response and booking handoff so interest actually turns into scheduled appointments.'
      );
    } else if (choices.bottleneck === 'social-content') {
      lines.push(
        'Content should support the business, not become a second full-time job. Choose the lightest tool that makes publishing more consistent.'
      );
    } else if (choices.bottleneck === 'front-desk-admin') {
      lines.push(
        'Reduce front-desk drag before layering on more campaigns. Cleaner booking, notes, and reminders usually create the fastest lift.'
      );
    } else {
      lines.push('Pick the tool that best matches the real booking and follow-up bottleneck, not the longest feature list.');
    }

    lines.push(tool.shortlistReason);
    return lines.join(' ');
  }

  const shortlistConfigs = {
    field: {
      key: 'field',
      tools: (((data.shortlists || {}).field || {}).tools || []),
      stepIds: (((data.shortlists || {}).field || {}).stepIds || [
        'trade-team',
        'bottleneck-stack',
        'office-volume',
        'budget-setup'
      ]),
      startEvent: 'ihai_shortlist_started',
      stepEvent: 'ihai_shortlist_step_completed',
      completeEvent: 'ihai_shortlist_completed',
      resultClickEvent: 'ihai_shortlist_result_clicked',
      readChoices: function (form) {
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
      },
      analyticsProps: function (choices) {
        const selected = choices || {};
        return {
          trade: selected.trade || '',
          team_size: selected.teamSize || '',
          bottleneck: selected.bottleneck || '',
          budget: selected.budget || '',
          setup_tolerance: selected.setupTolerance || '',
          current_stack: selected.currentStack || ''
        };
      },
      rankTool: rankFieldTool,
      renderPrimaryDecision: renderFieldPrimaryDecision
    },
    beauty: {
      key: 'beauty',
      tools: (((data.shortlists || {}).beauty || {}).tools || []),
      stepIds: (((data.shortlists || {}).beauty || {}).stepIds || [
        'business-team',
        'bottleneck-stack',
        'budget-setup'
      ]),
      startEvent: 'ihai_beauty_shortlist_started',
      stepEvent: 'ihai_shortlist_step_completed',
      completeEvent: 'ihai_beauty_shortlist_completed',
      resultClickEvent: 'ihai_shortlist_result_clicked',
      readChoices: function (form) {
        return {
          businessType: form.elements.businessType.value,
          teamSize: form.elements.teamSize.value,
          bottleneck: form.elements.bottleneck.value,
          currentStack: form.elements.currentStack.value,
          budget: form.elements.budget.value,
          setupTolerance: form.elements.setupTolerance.value
        };
      },
      analyticsProps: function (choices) {
        const selected = choices || {};
        return {
          vertical: 'beauty',
          business_type: selected.businessType || '',
          team_size: selected.teamSize || '',
          bottleneck: selected.bottleneck || '',
          budget: selected.budget || '',
          setup_tolerance: selected.setupTolerance || ''
        };
      },
      rankTool: rankBeautyTool,
      renderPrimaryDecision: renderBeautyPrimaryDecision
    }
  };

  function initCopyButtons() {
    qsa('[data-copy-target]').forEach(function (button) {
      button.addEventListener('click', async function () {
        const target = document.getElementById(button.getAttribute('data-copy-target'));
        if (!target) return;
        const tokens = getAnalyticsTokens(button);
        const original = button.textContent;
        try {
          await navigator.clipboard.writeText(target.textContent.trim());
          button.textContent = 'Copied';
          if (tokens.includes('beauty_template_copy')) {
            track(
              'ihai_beauty_template_copy_clicked',
              {
                vertical: 'beauty',
                template_id: button.getAttribute('data-copy-target') || ''
              },
              { includePath: false }
            );
          } else {
            track(
              'ihai_template_copy_clicked',
              {
                template_id: button.getAttribute('data-copy-target') || ''
              },
              { includePath: false }
            );
          }
        } catch (error) {
          button.textContent = 'Copy failed';
        }
        window.setTimeout(function () {
          button.textContent = original;
        }, 1400);
      });
    });
  }

  function initShortlists() {
    qsa('[data-shortlist-root]').forEach(function (root) {
      const form = qs('[data-shortlist-form]', root);
      if (!form) return;

      const key = form.getAttribute('data-shortlist-form') || 'field';
      const config = shortlistConfigs[key];
      if (!config) return;

      const steps = config.stepIds
        .map(function (id) {
          return qs('[data-shortlist-step="' + id + '"]', root);
        })
        .filter(Boolean);
      const progressBar = qs('[data-shortlist-progress]', root);
      const progressLabel = qs('[data-shortlist-progress-label]', root);
      const backButton = qs('[data-shortlist-back]', root);
      const nextButton = qs('[data-shortlist-next]', root);
      const submitButton = qs('[data-shortlist-submit]', root);
      const resultGrid = qs('[data-shortlist-grid]', root);
      const primary = qs('[data-shortlist-primary]', root);
      const empty = qs('[data-shortlist-empty]', root);
      const output = qs('[data-shortlist-output]', root);
      const state = {
        started: false,
        currentStep: 0,
        lastChoices: null
      };

      function markStarted() {
        if (state.started) return;
        state.started = true;
        track(config.startEvent, config.analyticsProps(config.readChoices(form)), {
          includePath: false
        });
      }

      function validateCurrentStep() {
        const step = steps[state.currentStep];
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
          step.hidden = index !== state.currentStep;
        });
        if (progressBar) {
          progressBar.style.width = ((state.currentStep + 1) / steps.length) * 100 + '%';
        }
        if (progressLabel) {
          progressLabel.textContent = 'Step ' + (state.currentStep + 1) + ' of ' + steps.length;
        }
        if (backButton) backButton.disabled = state.currentStep === 0;
        if (nextButton) nextButton.hidden = state.currentStep === steps.length - 1;
        if (submitButton) submitButton.hidden = state.currentStep !== steps.length - 1;
      }

      function runShortlist() {
        const choices = config.readChoices(form);
        const ranked = config.tools
          .map(function (tool) {
            return { tool: tool, score: config.rankTool(tool, choices) };
          })
          .filter(function (entry) {
            return entry.score > -3;
          })
          .sort(function (left, right) {
            return right.score - left.score || left.tool.name.localeCompare(right.tool.name);
          })
          .slice(0, 3);

        state.lastChoices = choices;
        lastShortlistContext = {
          config: config,
          choices: choices
        };

        if (resultGrid) {
          resultGrid.innerHTML = ranked.map(function (entry) {
            return renderResultCard(entry, config);
          }).join('');
        }

        if (primary) {
          primary.innerHTML = ranked[0]
            ? '<h3>Recommended first move</h3><p>' +
              config.renderPrimaryDecision(ranked[0].tool, choices) +
              '</p>'
            : '<h3>No strong match yet</h3><p>Try loosening budget or setup constraints first. If the workflow itself is still unclear, start with the hub or problem pages instead of forcing a tool pick.</p>';
        }

        if (empty) empty.hidden = ranked.length !== 0;

        track(config.completeEvent, config.analyticsProps(choices), {
          includePath: false
        });
      }

      form.addEventListener('change', function () {
        markStarted();
      });

      if (backButton) {
        backButton.addEventListener('click', function () {
          state.currentStep = Math.max(0, state.currentStep - 1);
          syncStep();
        });
      }

      if (nextButton) {
        nextButton.addEventListener('click', function () {
          if (!validateCurrentStep()) return;
          markStarted();
          if (config.stepEvent) {
            track(config.stepEvent, config.analyticsProps(config.readChoices(form)), {
              includePath: false
            });
          }
          state.currentStep = Math.min(steps.length - 1, state.currentStep + 1);
          syncStep();
        });
      }

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateCurrentStep()) return;
        markStarted();
        runShortlist();
        if (output && typeof output.scrollIntoView === 'function') {
          output.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      syncStep();
    });
  }

  function getLeadFormKind(form) {
    const key = form.getAttribute('data-lead-form') || '';
    if (key.indexOf('beauty-starter-pack') === 0) return 'beauty_starter_pack';
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
    const businessTypeField = form.elements.businessType;
    if (businessTypeField && businessTypeField.value) props.business_type = businessTypeField.value;
    if (kind === 'beauty_starter_pack') props.vertical = 'beauty';
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
          kind === 'beauty_starter_pack'
            ? 'ihai_beauty_starter_pack_form_started'
            : kind === 'starter_pack'
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
          kind === 'beauty_starter_pack'
            ? 'ihai_beauty_starter_pack_form_submitted'
            : kind === 'starter_pack'
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

        const tokens = getAnalyticsTokens(target);
        const linkProps = buildLinkProps(target);

        if (tokens.includes('home_cta')) {
          track('ihai_home_cta_click', linkProps);
        }
        if (tokens.includes('nav_click')) {
          track('ihai_nav_click', linkProps);
        }
        if (tokens.includes('footer_click')) {
          track('ihai_footer_click', linkProps);
        }
        if (tokens.includes('template_download')) {
          track('ihai_template_download_clicked', linkProps);
        }

        if (tokens.includes('beauty_review_cta')) {
          track(
            'ihai_beauty_review_cta_clicked',
            Object.assign({ vertical: 'beauty' }, linkProps),
            { includePath: false }
          );
        } else if (tokens.includes('review_cta')) {
          track('ihai_review_cta_clicked', linkProps);
        }

        if (tokens.includes('beauty_compare_cta')) {
          track(
            'ihai_beauty_compare_cta_clicked',
            Object.assign({ vertical: 'beauty' }, linkProps),
            { includePath: false }
          );
        } else if (tokens.includes('compare_cta')) {
          track('ihai_compare_cta_clicked', linkProps);
        }

        if (tokens.includes('outbound_tool_click') && linkProps.destination_hostname) {
          track(
            'ihai_outbound_tool_click',
            {
              destination_hostname: linkProps.destination_hostname
            },
            { includePath: false }
          );
        }

        if (tokens.includes('shortlist_result_click') && lastShortlistContext) {
          track(
            lastShortlistContext.config.resultClickEvent,
            lastShortlistContext.config.analyticsProps(lastShortlistContext.choices),
            { includePath: false }
          );
        }
      },
      true
    );
  }

  function initPageEvent() {
    const eventName = document.body.getAttribute('data-page-event') || '';
    if (!eventName) return;
    const rawProps = document.body.getAttribute('data-page-event-props') || '';
    let props = {};
    if (rawProps) {
      try {
        props = JSON.parse(rawProps);
      } catch (error) {
        props = {};
      }
    }
    track(eventName, props, { includePath: false });
  }

  initMenu();
  initCopyButtons();
  initShortlists();
  initLeadForms();
  initLinkTracking();
  initPageEvent();
  track('ihai_page_view', { title: document.title });
})();
