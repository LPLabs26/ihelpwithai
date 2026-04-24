const DEFAULT_SITE = 'https://ihelpwithai.com';
const DEFAULT_ORIGIN = 'https://ihelpwithai.com';
const EXPECTED_ENDPOINT = 'https://fiopwsdzcbmjcbpkdxwr.supabase.co/functions/v1/owned-intake';
const EXPECTED_ALLOWED_HOST = 'fiopwsdzcbmjcbpkdxwr.supabase.co';
const FORMS_TO_CHECK = ['/starter-pack/', '/beauty/starter-pack/', '/contact/', '/for-vendors/'];
const FORMSUBMIT_ACTION = 'https://formsubmit.co/info@ihelpwithai.com';

const flags = new Set(process.argv.slice(2));
const shouldRunSmoke = flags.has('--smoke') || process.env.OWNED_INTAKE_VERIFY_SMOKE === 'true';
const site = String(process.env.OWNED_INTAKE_VERIFY_SITE || DEFAULT_SITE).replace(/\/$/, '');
const origin = String(process.env.OWNED_INTAKE_ORIGIN || DEFAULT_ORIGIN);
const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'owned-intake-live-verifier'
    }
  });
  const text = await response.text();
  assert(response.ok, `${url} returned ${response.status}`);
  return text;
}

function parseSiteData(raw) {
  const prefix = 'window.IHWAI_SITE_DATA = ';
  assert(raw.startsWith(prefix), 'live site-data.js is missing the expected prefix');
  const json = raw.trim().slice(prefix.length).replace(/;$/, '');

  try {
    return JSON.parse(json);
  } catch (error) {
    fail(`live site-data.js could not be parsed: ${error.message}`);
    return {};
  }
}

async function verifyLiveConfig() {
  const raw = await fetchText(`${site}/assets/site-data.js`);
  const data = parseSiteData(raw);
  const allowedHosts = Array.isArray(data.ownedDataAllowedHosts) ? data.ownedDataAllowedHosts : [];

  assert(data.ownedDataEndpoint === EXPECTED_ENDPOINT, 'live ownedDataEndpoint does not match production');
  assert(allowedHosts.length === 1, 'live ownedDataAllowedHosts should contain exactly one host');
  assert(allowedHosts[0] === EXPECTED_ALLOWED_HOST, 'live ownedDataAllowedHosts does not match production');

  return data.ownedDataEndpoint || EXPECTED_ENDPOINT;
}

async function verifyForms() {
  for (const path of FORMS_TO_CHECK) {
    const html = await fetchText(`${site}${path}`);
    assert(html.includes(FORMSUBMIT_ACTION), `${path} no longer posts to FormSubmit`);
  }
}

async function verifyPrivacyCopy() {
  const html = await fetchText(`${site}/privacy/`);
  assert(html.includes('FormSubmit'), 'privacy page no longer mentions FormSubmit');
  assert(html.includes('owned Supabase intake'), 'privacy page no longer mentions owned Supabase intake');
  assert(html.includes('behavior-only'), 'privacy page no longer says analytics is behavior-only');
}

async function postJson(endpoint, originHeader, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Origin: originHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }

  return { response, body };
}

async function verifySmoke(endpoint) {
  const stamp = Date.now();
  const fakeEmail = `test+owned-intake-${stamp}@example.com`;

  const formResult = await postJson(endpoint, origin, {
    type: 'form_submission',
    form_type: 'field_starter_pack',
    email: fakeEmail,
    source_page: '/starter-pack/',
    vertical: 'field_trades',
    trade: 'hvac',
    bottleneck: 'missed-calls',
    budget: 'roi',
    setupTolerance: 'moderate'
  });
  assert(formResult.response.status === 202, `form_submission smoke returned ${formResult.response.status}`);

  const shortlistResult = await postJson(endpoint, origin, {
    type: 'shortlist_session',
    vertical: 'beauty',
    page_path: '/beauty/shortlist/',
    anonymous_id: `smoke-${stamp}`,
    answers: {
      businessType: 'hair-salons',
      teamSize: 'small-team',
      bottleneck: 'rebooking',
      budget: '50-150',
      setupTolerance: 'moderate'
    },
    top_recommendation: 'glossgenius'
  });
  assert(shortlistResult.response.status === 202, `shortlist_session smoke returned ${shortlistResult.response.status}`);

  const invalidResult = await postJson(endpoint, origin, {
    type: 'tool_intent_event',
    page_path: '/reviews/jobber/'
  });
  assert(invalidResult.response.status >= 400, `invalid payload smoke returned ${invalidResult.response.status}`);

  const blockedResult = await postJson(endpoint, 'https://not-ihelpwithai.example', {
    type: 'form_submission',
    form_type: 'contact',
    email: 'test+blocked@example.com'
  });
  assert(blockedResult.response.status === 403, `disallowed origin smoke returned ${blockedResult.response.status}`);
}

async function main() {
  const endpoint = await verifyLiveConfig();
  await verifyForms();
  await verifyPrivacyCopy();

  if (shouldRunSmoke) {
    await verifySmoke(endpoint);
  }

  if (failures.length > 0) {
    console.error('owned-intake live verification failed:');
    for (const message of failures) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log('owned-intake live verification passed');
  console.log(`site=${site}`);
  console.log(`endpoint=${endpoint}`);
  console.log(`smoke=${shouldRunSmoke ? 'run' : 'skipped'}`);
}

await main();
