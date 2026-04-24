#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
ENDPOINT="${OWNED_INTAKE_ENDPOINT:-}"
ORIGIN="${OWNED_INTAKE_ORIGIN:-https://ihelpwithai.com}"
APPLY_SCHEMA="${OWNED_INTAKE_APPLY_SCHEMA:-false}"
APPLY_DEDUPE_MIGRATION="${OWNED_INTAKE_APPLY_DEDUPE_MIGRATION:-true}"

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

is_true() {
  local value
  value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "${value}" in
    1|true|yes|y|on) return 0 ;;
    *) return 1 ;;
  esac
}

if ! command -v supabase >/dev/null 2>&1; then
  echo "Missing Supabase CLI. Install it or provide a deployment environment with supabase available." >&2
  exit 1
fi

require_var SUPABASE_PROJECT_REF
require_var SUPABASE_URL
require_var SUPABASE_SERVICE_ROLE_KEY
require_var OWNED_INTAKE_ALLOWED_ORIGINS

if ! grep -q 'verify_jwt = false' "${ROOT_DIR}/supabase/config.toml"; then
  echo "supabase/config.toml must keep verify_jwt = false for functions.owned-intake" >&2
  exit 1
fi

echo "Linking Supabase project ${PROJECT_REF}..."
supabase link --project-ref "${PROJECT_REF}"

if is_true "${APPLY_SCHEMA}" || is_true "${APPLY_DEDUPE_MIGRATION}"; then
  if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    echo "Secure SQL access is required for the selected database apply steps." >&2
    echo "Set SUPABASE_DB_URL, or explicitly set OWNED_INTAKE_APPLY_SCHEMA=false and OWNED_INTAKE_APPLY_DEDUPE_MIGRATION=false after verifying production is already migrated." >&2
    exit 1
  fi

  if ! command -v psql >/dev/null 2>&1; then
    echo "SUPABASE_DB_URL was provided, but psql is not installed." >&2
    exit 1
  fi
fi

if is_true "${APPLY_SCHEMA}"; then
  echo "Applying docs/supabase-schema.sql..."
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/docs/supabase-schema.sql"
else
  echo "Skipping broad schema apply. Set OWNED_INTAKE_APPLY_SCHEMA=true for first-time/full schema setup."
fi

if is_true "${APPLY_DEDUPE_MIGRATION}"; then
  echo "Applying supabase/migrations/20260422_owned_intake_dedupe_hardening.sql..."
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/supabase/migrations/20260422_owned_intake_dedupe_hardening.sql"
else
  echo "Skipping dedupe migration apply. Only do this after verifying production already has the PR #9 migration."
fi

echo "Setting owned-intake function secrets..."
secret_args=(
  "SUPABASE_URL=${SUPABASE_URL}"
  "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}"
  "OWNED_INTAKE_ALLOWED_ORIGINS=${OWNED_INTAKE_ALLOWED_ORIGINS}"
)

if [[ -n "${OWNED_INTAKE_DEV_ORIGIN:-}" ]]; then
  secret_args+=("OWNED_INTAKE_DEV_ORIGIN=${OWNED_INTAKE_DEV_ORIGIN}")
fi

supabase secrets set --project-ref "${PROJECT_REF}" "${secret_args[@]}"

echo "Deploying owned-intake Edge Function..."
supabase functions deploy owned-intake --project-ref "${PROJECT_REF}"

if [[ -z "${ENDPOINT}" ]]; then
  ENDPOINT="https://${PROJECT_REF}.supabase.co/functions/v1/owned-intake"
fi

echo "Running smoke tests against ${ENDPOINT}..."
node "${ROOT_DIR}/scripts/smoke-owned-intake.mjs" --endpoint "${ENDPOINT}" --origin "${ORIGIN}"

echo "Owned-intake deployment flow completed."
