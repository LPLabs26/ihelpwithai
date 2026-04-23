import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  buildAllowedOrigins,
  normalizeOwnedPayload,
  readJsonRequest,
  resolveAllowedOrigin
} from '../supabase/functions/owned-intake/shared.mjs';

async function main() {
  const allowedOrigins = buildAllowedOrigins({
    OWNED_INTAKE_ALLOWED_ORIGINS: '',
    OWNED_INTAKE_DEV_ORIGIN: 'http://127.0.0.1:4173'
  });

  assert.ok(allowedOrigins.includes('https://ihelpwithai.com'));
  assert.ok(allowedOrigins.includes('https://www.ihelpwithai.com'));
  assert.ok(allowedOrigins.includes('http://127.0.0.1:4173'));
  assert.equal(
    resolveAllowedOrigin('https://ihelpwithai.com', {
      OWNED_INTAKE_ALLOWED_ORIGINS: '',
      OWNED_INTAKE_DEV_ORIGIN: ''
    }),
    'https://ihelpwithai.com'
  );
  assert.equal(
    resolveAllowedOrigin('https://bad.example.com', {
      OWNED_INTAKE_ALLOWED_ORIGINS: '',
      OWNED_INTAKE_DEV_ORIGIN: ''
    }),
    ''
  );

  const parsed = await readJsonRequest(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'form_submission',
        form_type: 'field_starter_pack',
        email: 'Owner@Example.com',
        source_page: '/starter-pack/',
        vertical: 'field_trades',
        trade: 'hvac',
        bottleneck: 'missed-calls',
        budget: 'roi',
        name: 'Owner Name',
        _honey: 'ignore-me'
      })
    })
  );
  assert.equal(parsed.ok, true);

  const normalizedForm = normalizeOwnedPayload(parsed.value);
  assert.equal(normalizedForm.ok, true);
  assert.equal(normalizedForm.value.lead.email, 'owner@example.com');
  assert.equal(normalizedForm.value.lead.trade_or_business_type, 'hvac');
  assert.equal(normalizedForm.value.submission.form_type, 'field_starter_pack');
  assert.equal(normalizedForm.value.raw_payload.trade_or_business_type, 'hvac');
  assert.equal('name' in normalizedForm.value.raw_payload, false);

  const repeatedFormA = normalizeOwnedPayload({
    type: 'form_submission',
    form_type: 'contact',
    email: 'Owner@Example.com',
    source_page: '/contact/'
  });
  const repeatedFormB = normalizeOwnedPayload({
    type: 'form_submission',
    form_type: 'contact',
    email: 'owner@example.com',
    source_page: '/contact/'
  });
  assert.equal(repeatedFormA.ok, true);
  assert.equal(repeatedFormB.ok, true);
  assert.equal(repeatedFormA.value.lead.email, 'owner@example.com');
  assert.equal(repeatedFormA.value.lead.email, repeatedFormB.value.lead.email);

  const normalizedShortlist = normalizeOwnedPayload({
    type: 'shortlist_session',
    vertical: 'beauty',
    page_path: '/beauty/shortlist/',
    anonymous_id: 'anon-123',
    answers: {
      businessType: 'hair-salons',
      teamSize: 'small-team',
      bottleneck: 'rebooking',
      budget: '50-150'
    },
    top_recommendation: 'glossgenius'
  });
  assert.equal(normalizedShortlist.ok, true);
  assert.equal(normalizedShortlist.value.session.vertical, 'beauty');
  assert.equal(normalizedShortlist.value.session.answers.businessType, 'hair-salons');

  const unsupported = normalizeOwnedPayload({ type: 'tool_intent_event' });
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.status, 400);

  const malformed = await readJsonRequest(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad json'
    })
  );
  assert.equal(malformed.ok, false);
  assert.equal(malformed.status, 400);

  const migrationSql = await fs.readFile(
    new URL('../supabase/migrations/20260422_owned_intake_dedupe_hardening.sql', import.meta.url),
    'utf8'
  );
  assert.match(migrationSql, /create unique index if not exists leads_email_normalized_unique_idx/i);
  assert.match(migrationSql, /create or replace function public\.upsert_owned_intake_lead/i);
  assert.match(migrationSql, /on conflict\s*\(\(public\.normalize_owned_intake_email\(email\)\)\)\s*do update/i);

  const cleanupSql = await fs.readFile(
    new URL('../docs/owned-intake-fake-smoke-cleanup.sql', import.meta.url),
    'utf8'
  );
  assert.match(cleanupSql, /test\+owned-intake-%@example\.com/);
  assert.match(cleanupSql, /anonymous_id like 'smoke-%'/);

  const edgeFunctionSource = await fs.readFile(
    new URL('../supabase/functions/owned-intake/index.ts', import.meta.url),
    'utf8'
  );
  assert.match(edgeFunctionSource, /rpc\('upsert_owned_intake_lead'/);
  assert.doesNotMatch(edgeFunctionSource, /\.insert\(buildLeadInsert/);

  console.log('owned-intake validation passed');
}

await main();
