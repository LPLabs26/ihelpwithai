export const MAX_REQUEST_BYTES = 32768;
export const DEFAULT_ALLOWED_ORIGINS = ['https://ihelpwithai.com', 'https://www.ihelpwithai.com'];
export const SUPPORTED_PAYLOAD_TYPES = ['form_submission', 'shortlist_session'];

function resultOk(value) {
  return { ok: true, value };
}

function resultError(status, error) {
  return { ok: false, status, error };
}

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch (error) {
    return '';
  }
}

export function buildAllowedOrigins(env = {}) {
  const allowed = new Set(DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin).filter(Boolean));
  const configured = String(env.OWNED_INTAKE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  for (const origin of configured) {
    allowed.add(origin);
  }

  const devOrigin = normalizeOrigin(env.OWNED_INTAKE_DEV_ORIGIN || '');
  if (devOrigin) {
    allowed.add(devOrigin);
  }

  return Array.from(allowed);
}

export function resolveAllowedOrigin(origin, env = {}) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return '';
  return buildAllowedOrigins(env).includes(normalized) ? normalized : '';
}

export function buildCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function cleanString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizeEmail(value) {
  const email = cleanString(value, 320).toLowerCase();
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizePath(value) {
  const path = cleanString(value, 200);
  return path.startsWith('/') ? path : '';
}

function normalizeChoice(value) {
  const cleaned = cleanString(value, 120);
  return /^[a-z0-9-_/+. ]*$/i.test(cleaned) ? cleaned : '';
}

function normalizePlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function pickPresentValues(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== '' && value !== null && typeof value !== 'undefined')
  );
}

function minimalRawPayload(payload) {
  return pickPresentValues({
    form_type: cleanString(payload.form_type, 80),
    source_page: normalizePath(payload.source_page || payload.page_path),
    vertical: normalizeChoice(payload.vertical),
    starter_pack_type: normalizeChoice(payload.starter_pack_type),
    trade_or_business_type: normalizeChoice(
      payload.trade_or_business_type || payload.trade || payload.businessType
    ),
    bottleneck: normalizeChoice(payload.bottleneck),
    current_stack: normalizeChoice(payload.current_stack || payload.currentStack),
    budget_range: normalizeChoice(payload.budget_range || payload.budget),
    setup_tolerance: normalizeChoice(payload.setup_tolerance || payload.setupTolerance),
    team_size: normalizeChoice(payload.team_size || payload.teamSize),
    consent_status: normalizeChoice(payload.consent_status)
  });
}

function normalizeFormSubmission(payload) {
  const record = normalizePlainObject(payload);
  if (!record) return resultError(400, 'Payload must be a JSON object');

  const formType = cleanString(record.form_type, 80);
  const supportedFormTypes = new Set(['field_starter_pack', 'beauty_starter_pack', 'contact', 'vendor']);
  if (!supportedFormTypes.has(formType)) {
    return resultError(400, 'Unsupported form_type');
  }

  const email = normalizeEmail(record.email);
  if (!email) {
    return resultError(400, 'A valid email is required for form_submission');
  }

  const normalized = {
    type: 'form_submission',
    lead: pickPresentValues({
      name: cleanString(record.name, 200),
      email,
      phone: cleanString(record.phone, 50),
      company: cleanString(record.company, 200),
      vertical: normalizeChoice(record.vertical),
      trade_or_business_type: normalizeChoice(
        record.trade_or_business_type || record.trade || record.businessType
      ),
      team_size: normalizeChoice(record.team_size || record.teamSize),
      bottleneck: normalizeChoice(record.bottleneck),
      current_stack: normalizeChoice(record.current_stack || record.currentStack),
      budget_range: normalizeChoice(record.budget_range || record.budget),
      setup_tolerance: normalizeChoice(record.setup_tolerance || record.setupTolerance),
      source_page: normalizePath(record.source_page || record.page_path),
      starter_pack_type: normalizeChoice(record.starter_pack_type),
      consent_status: normalizeChoice(record.consent_status)
    }),
    submission: pickPresentValues({
      form_type: formType,
      source_page: normalizePath(record.source_page || record.page_path),
      vertical: normalizeChoice(record.vertical),
      trade_or_business_type: normalizeChoice(
        record.trade_or_business_type || record.trade || record.businessType
      ),
      bottleneck: normalizeChoice(record.bottleneck),
      message: cleanString(record.message || record.use_case, 5000)
    }),
    raw_payload: minimalRawPayload(record)
  };

  return resultOk(normalized);
}

function normalizeAnswers(answers) {
  const record = normalizePlainObject(answers);
  if (!record) return {};

  const allowedKeys = [
    'trade',
    'businessType',
    'teamSize',
    'bottleneck',
    'currentStack',
    'officeSupport',
    'afterHoursLeadVolume',
    'budget',
    'setupTolerance'
  ];

  return Object.fromEntries(
    allowedKeys
      .map((key) => [key, normalizeChoice(record[key])])
      .filter(([, value]) => value)
  );
}

function normalizeShortlistSession(payload) {
  const record = normalizePlainObject(payload);
  if (!record) return resultError(400, 'Payload must be a JSON object');

  const vertical = normalizeChoice(record.vertical);
  if (!['field_trades', 'beauty'].includes(vertical)) {
    return resultError(400, 'Unsupported shortlist vertical');
  }

  const answers = normalizeAnswers(record.answers);
  if (Object.keys(answers).length === 0) {
    return resultError(400, 'Shortlist answers are required');
  }

  const normalized = {
    type: 'shortlist_session',
    email: normalizeEmail(record.email),
    session: pickPresentValues({
      anonymous_id: cleanString(record.anonymous_id, 120),
      vertical,
      answers,
      top_recommendation: normalizeChoice(record.top_recommendation),
      second_recommendation: normalizeChoice(record.second_recommendation),
      third_recommendation: normalizeChoice(record.third_recommendation),
      result_clicked: normalizeChoice(record.result_clicked),
      source_page: normalizePath(record.source_page || record.page_path)
    })
  };

  return resultOk(normalized);
}

export function normalizeOwnedPayload(payload) {
  const record = normalizePlainObject(payload);
  if (!record) return resultError(400, 'Payload must be a JSON object');

  const type = cleanString(record.type, 80);
  if (type === 'form_submission') return normalizeFormSubmission(record);
  if (type === 'shortlist_session') return normalizeShortlistSession(record);
  return resultError(400, 'Unsupported payload type');
}

export async function readJsonRequest(request) {
  const contentType = String(request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return resultError(415, 'Content-Type must be application/json');
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength && contentLength > MAX_REQUEST_BYTES) {
    return resultError(413, 'Payload too large');
  }

  let text = '';
  try {
    text = await request.text();
  } catch (error) {
    return resultError(400, 'Unable to read request body');
  }

  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > MAX_REQUEST_BYTES) {
    return resultError(413, 'Payload too large');
  }

  try {
    return resultOk(JSON.parse(text || '{}'));
  } catch (error) {
    return resultError(400, 'Malformed JSON');
  }
}
