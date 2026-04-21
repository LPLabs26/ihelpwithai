const defaultOrigin = process.env.OWNED_INTAKE_ORIGIN || 'https://ihelpwithai.com';

function parseArgs(argv) {
  const result = {
    endpoint: process.env.OWNED_INTAKE_ENDPOINT || '',
    origin: defaultOrigin
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--endpoint' && argv[index + 1]) {
      result.endpoint = argv[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith('--endpoint=')) {
      result.endpoint = value.slice('--endpoint='.length);
      continue;
    }
    if (value === '--origin' && argv[index + 1]) {
      result.origin = argv[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith('--origin=')) {
      result.origin = value.slice('--origin='.length);
      continue;
    }
    if (!value.startsWith('--') && !result.endpoint) {
      result.endpoint = value;
    }
  }

  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function safeEndpoint(raw) {
  const trimmed = String(raw || '').trim();
  assert(trimmed, 'Missing owned-intake endpoint. Pass --endpoint or set OWNED_INTAKE_ENDPOINT.');

  const url = new URL(trimmed);
  assert(url.protocol === 'https:', 'Owned-intake endpoint must use HTTPS.');
  assert(!url.username && !url.password, 'Owned-intake endpoint must not include embedded credentials.');
  assert(!url.hash, 'Owned-intake endpoint must not include a hash fragment.');
  return url.toString();
}

function safeOrigin(raw) {
  const url = new URL(String(raw || '').trim());
  assert(url.origin === String(raw || '').trim(), 'Origin must be a plain origin like https://ihelpwithai.com');
  return url.origin;
}

async function postJson(endpoint, origin, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Origin: origin,
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

function logPass(label, response) {
  console.log(`PASS ${label}: ${response.status}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const endpoint = safeEndpoint(args.endpoint);
  const origin = safeOrigin(args.origin);
  const stamp = Date.now();
  const fakeEmail = `test+owned-intake-${stamp}@example.com`;

  console.log(`Endpoint: ${endpoint}`);
  console.log(`Origin: ${origin}`);

  const formPayload = {
    type: 'form_submission',
    form_type: 'field_starter_pack',
    email: fakeEmail,
    source_page: '/starter-pack/',
    vertical: 'field_trades',
    trade: 'hvac',
    bottleneck: 'missed-calls',
    budget: 'roi',
    setupTolerance: 'moderate'
  };

  const formResult = await postJson(endpoint, origin, formPayload);
  assert(formResult.response.status === 202, `Expected 202 for form_submission, got ${formResult.response.status}`);
  assert(formResult.body && formResult.body.ok === true, 'Expected ok=true for form_submission');
  assert(formResult.body.type === 'form_submission', 'Expected form_submission response type');
  logPass('form_submission', formResult.response);

  const shortlistPayload = {
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
  };

  const shortlistResult = await postJson(endpoint, origin, shortlistPayload);
  assert(shortlistResult.response.status === 202, `Expected 202 for shortlist_session, got ${shortlistResult.response.status}`);
  assert(shortlistResult.body && shortlistResult.body.ok === true, 'Expected ok=true for shortlist_session');
  assert(shortlistResult.body.type === 'shortlist_session', 'Expected shortlist_session response type');
  logPass('shortlist_session', shortlistResult.response);

  const invalidResult = await postJson(endpoint, origin, {
    type: 'tool_intent_event',
    page_path: '/reviews/jobber/'
  });
  assert(invalidResult.response.status >= 400, `Expected invalid payload rejection, got ${invalidResult.response.status}`);
  assert(invalidResult.body && invalidResult.body.error, 'Expected an error body for invalid payload');
  logPass('invalid_payload_rejected', invalidResult.response);

  console.log('owned-intake smoke test passed');
}

main().catch((error) => {
  console.error(`owned-intake smoke test failed: ${error.message}`);
  process.exit(1);
});
