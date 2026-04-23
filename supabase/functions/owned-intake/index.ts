import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  buildCorsHeaders,
  normalizeOwnedPayload,
  readJsonRequest,
  resolveAllowedOrigin
} from './shared.mjs';

type JsonRecord = Record<string, unknown>;
type ResultOk<T> = { ok: true; value: T };
type ResultError = { ok: false; status: number; error: string };
type Result<T> = ResultOk<T> | ResultError;

function isResultError<T>(result: Result<T>): result is ResultError {
  return result.ok === false;
}

function jsonResponse(body: JsonRecord, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

function getEnv(name: string): string {
  return String(Deno.env.get(name) || '').trim();
}

function createAdminClient() {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function stringOrNull(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  return raw ? raw : null;
}

async function findLeadIdByEmail(client: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await client.from('leads').select('id').eq('email', email).maybeSingle();
  if (error) throw error;
  return data ? String(data.id) : '';
}

function buildLeadUpsertArgs(lead: JsonRecord) {
  return {
    p_name: stringOrNull(lead.name),
    p_email: stringOrNull(lead.email),
    p_phone: stringOrNull(lead.phone),
    p_company: stringOrNull(lead.company),
    p_vertical: stringOrNull(lead.vertical),
    p_trade_or_business_type: stringOrNull(lead.trade_or_business_type),
    p_team_size: stringOrNull(lead.team_size),
    p_bottleneck: stringOrNull(lead.bottleneck),
    p_current_stack: stringOrNull(lead.current_stack),
    p_budget_range: stringOrNull(lead.budget_range),
    p_setup_tolerance: stringOrNull(lead.setup_tolerance),
    p_source_page: stringOrNull(lead.source_page),
    p_starter_pack_type: stringOrNull(lead.starter_pack_type),
    p_consent_status: stringOrNull(lead.consent_status)
  };
}

async function upsertLead(client: ReturnType<typeof createAdminClient>, lead: JsonRecord) {
  const email = String(lead.email || '');
  if (!email) return '';

  const { data, error } = await client.rpc('upsert_owned_intake_lead', buildLeadUpsertArgs(lead));
  if (error) throw error;
  return data ? String(data) : '';
}

async function handleFormSubmission(client: ReturnType<typeof createAdminClient>, normalized: JsonRecord) {
  const leadId = await upsertLead(client, normalized.lead as JsonRecord);
  const submission = normalized.submission as JsonRecord;
  const rawPayload = normalized.raw_payload as JsonRecord;

  const { error } = await client.from('form_submissions').insert({
    lead_id: leadId || null,
    form_type: submission.form_type,
    source_page: submission.source_page || null,
    vertical: submission.vertical || null,
    trade_or_business_type: submission.trade_or_business_type || null,
    bottleneck: submission.bottleneck || null,
    message: submission.message || null,
    raw_payload: Object.keys(rawPayload || {}).length ? rawPayload : null
  });

  if (error) throw error;
  return { lead_id: leadId || null, stored: 'form_submission' };
}

async function handleShortlistSession(client: ReturnType<typeof createAdminClient>, normalized: JsonRecord) {
  const email = String(normalized.email || '');
  const leadId = email ? await findLeadIdByEmail(client, email) : '';
  const session = normalized.session as JsonRecord;

  const { error } = await client.from('shortlist_sessions').insert({
    lead_id: leadId || null,
    anonymous_id: session.anonymous_id || null,
    vertical: session.vertical,
    answers: session.answers,
    top_recommendation: session.top_recommendation || null,
    second_recommendation: session.second_recommendation || null,
    third_recommendation: session.third_recommendation || null,
    result_clicked: session.result_clicked || null,
    source_page: session.source_page || null
  });

  if (error) throw error;
  return { lead_id: leadId || null, stored: 'shortlist_session' };
}

Deno.serve(async (request) => {
  const env = {
    OWNED_INTAKE_ALLOWED_ORIGINS: getEnv('OWNED_INTAKE_ALLOWED_ORIGINS'),
    OWNED_INTAKE_DEV_ORIGIN: getEnv('OWNED_INTAKE_DEV_ORIGIN')
  };
  const requestOrigin = String(request.headers.get('origin') || '');
  const allowedOrigin = resolveAllowedOrigin(requestOrigin, env);
  const corsHeaders = buildCorsHeaders(allowedOrigin);

  if (request.method === 'OPTIONS') {
    if (!allowedOrigin) {
      return jsonResponse({ error: 'Origin not allowed' }, 403, buildCorsHeaders(''));
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, {
      ...corsHeaders,
      Allow: 'POST, OPTIONS'
    });
  }

  if (!allowedOrigin) {
    return jsonResponse({ error: 'Origin not allowed' }, 403, buildCorsHeaders(''));
  }

  const parsed = (await readJsonRequest(request)) as Result<JsonRecord>;
  if (isResultError(parsed)) {
    return jsonResponse({ error: parsed.error }, parsed.status, corsHeaders);
  }

  const normalized = normalizeOwnedPayload(parsed.value) as Result<JsonRecord>;
  if (isResultError(normalized)) {
    return jsonResponse({ error: normalized.error }, normalized.status, corsHeaders);
  }

  try {
    const client = createAdminClient();
    const payload = normalized.value as JsonRecord;
    const result =
      payload.type === 'form_submission'
        ? await handleFormSubmission(client, payload)
        : await handleShortlistSession(client, payload);

    return jsonResponse({ ok: true, type: payload.type, result }, 202, corsHeaders);
  } catch (error) {
    console.error('owned-intake failure', error);
    return jsonResponse({ error: 'Owned intake failed' }, 500, corsHeaders);
  }
});
