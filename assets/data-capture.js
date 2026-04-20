(function () {
  const data = Object.assign({ ownedDataEndpoint: '', ownedDataAllowedHosts: [] }, window.IHWAI_SITE_DATA || {});

  function normalizeAllowedHosts(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(function (entry) {
        return String(entry || '').trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function resolveOwnedEndpoint(value, allowedHosts) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:') return '';
      if (url.username || url.password || url.hash) return '';
      if (!allowedHosts.includes(url.hostname.toLowerCase())) return '';
      return url.toString();
    } catch (error) {
      return '';
    }
  }

  const allowedHosts = normalizeAllowedHosts(data.ownedDataAllowedHosts);
  const endpoint = resolveOwnedEndpoint(data.ownedDataEndpoint, allowedHosts);
  const enabled = Boolean(endpoint);

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function setFieldValue(form, name, value) {
    const field = form.elements.namedItem(name);
    if (!field || typeof field.value === 'undefined') return;
    field.value = value || '';
  }

  function getFieldValue(form, name) {
    const field = form.elements.namedItem(name);
    if (!field || typeof field.value === 'undefined') return '';
    return String(field.value || '').trim();
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function syncFormMetadata(form) {
    const selectedType = getFieldValue(form, 'trade') || getFieldValue(form, 'businessType');

    setFieldValue(form, 'source_page', window.location.pathname);
    setFieldValue(form, 'vertical', form.getAttribute('data-vertical') || '');
    setFieldValue(form, 'starter_pack_type', form.getAttribute('data-starter-pack-type') || '');
    setFieldValue(form, 'trade_or_business_type', selectedType);
    setFieldValue(form, 'bottleneck', getFieldValue(form, 'bottleneck'));
  }

  function buildFormPayload(form) {
    syncFormMetadata(form);

    const payload = {
      type: 'form_submission',
      form_type: form.getAttribute('data-form-type') || '',
      page_path: window.location.pathname
    };
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (!key || key === '_honey' || key.startsWith('_')) continue;
      if (typeof value !== 'string') continue;
      payload[key] = value.trim();
    }

    return payload;
  }

  function sendToOwnedEndpoint(payload) {
    if (!enabled || !payload) return false;

    const body = JSON.stringify(payload);

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) return true;
      }
    } catch (error) {
      void error;
    }

    try {
      window
        .fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          mode: 'cors',
          credentials: 'omit',
          keepalive: true
        })
        .catch(function () {});
      return true;
    } catch (error) {
      void error;
      return false;
    }
  }

  function captureForm(form, extra) {
    if (!form) return false;
    // This helper may eventually send PII to an owned endpoint only.
    // It must never be reused to forward names, emails, phone numbers,
    // addresses, or message bodies into analytics tooling.
    return sendToOwnedEndpoint(Object.assign(buildFormPayload(form), extra || {}));
  }

  function captureShortlist(payload) {
    if (!payload) return false;
    return sendToOwnedEndpoint(
      Object.assign(
        {
          type: 'shortlist_session',
          page_path: window.location.pathname,
          anonymous_id: safeStorageGet('ihai_anon_id')
        },
        payload
      )
    );
  }

  function captureToolIntent(payload) {
    if (!payload) return false;
    return sendToOwnedEndpoint(
      Object.assign(
        {
          type: 'tool_intent_event',
          page_path: window.location.pathname
        },
        payload
      )
    );
  }

  qsa('form[data-form-type]').forEach(function (form) {
    syncFormMetadata(form);
    form.addEventListener('change', function () {
      syncFormMetadata(form);
    });
    form.addEventListener('submit', function () {
      syncFormMetadata(form);
      captureForm(form);
    });
  });

  window.IHWAI_DATA_CAPTURE = {
    enabled: enabled,
    captureForm: captureForm,
    captureShortlist: captureShortlist,
    captureToolIntent: captureToolIntent,
    syncFormMetadata: syncFormMetadata
  };
})();
