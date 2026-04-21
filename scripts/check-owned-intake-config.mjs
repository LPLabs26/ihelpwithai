import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const { site } = await import(pathToFileURL(path.join(repoRoot, 'src/data/site-content.mjs')).href);

const failures = [];
const actionUrl = 'https://formsubmit.co/info@ihelpwithai.com';

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isHostnameOnly(value) {
  return /^[a-z0-9.-]+$/i.test(value) && !value.includes('..') && !value.startsWith('.') && !value.endsWith('.');
}

function isObviousNonProductionHost(value) {
  const host = String(value || '').toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.test') ||
    host.includes('ngrok') ||
    host === 'example.com' ||
    host === 'example.org' ||
    host === 'example.net'
  );
}

function parseSiteData(raw, label) {
  const prefix = 'window.IHWAI_SITE_DATA = ';
  assert(raw.startsWith(prefix), `${label} is missing the expected site data prefix`);
  const trimmed = raw.trim();
  const json = trimmed.slice(prefix.length, trimmed.endsWith(';') ? -1 : undefined);

  try {
    return JSON.parse(json);
  } catch (error) {
    fail(`${label} could not be parsed as JSON: ${error.message}`);
    return null;
  }
}

function validateSourceConfig() {
  const endpoint = String(site.ownedDataEndpoint || '').trim();
  const allowedHosts = Array.isArray(site.ownedDataAllowedHosts) ? site.ownedDataAllowedHosts.map(String) : [];

  for (const host of allowedHosts) {
    assert(isHostnameOnly(host), `ownedDataAllowedHosts entry must be hostname-only: ${host}`);
    assert(!host.includes('://'), `ownedDataAllowedHosts entry must not include a URL scheme: ${host}`);
    assert(!host.includes('/'), `ownedDataAllowedHosts entry must not include a path: ${host}`);
    assert(!host.includes('?') && !host.includes('#') && !host.includes('@') && !host.includes(':'), `ownedDataAllowedHosts entry must be a bare hostname without auth, port, query, or hash: ${host}`);
  }

  if (!endpoint) {
    assert(allowedHosts.length === 0, 'ownedDataAllowedHosts must stay empty while ownedDataEndpoint is blank');
    return { endpoint: '', allowedHosts };
  }

  let url;
  try {
    url = new URL(endpoint);
  } catch (error) {
    fail(`ownedDataEndpoint must be a valid URL: ${error.message}`);
    return { endpoint, allowedHosts };
  }

  assert(url.protocol === 'https:', 'ownedDataEndpoint must use HTTPS');
  assert(!url.username && !url.password, 'ownedDataEndpoint must not include username or password');
  assert(!url.hash, 'ownedDataEndpoint must not include a hash fragment');
  assert(!url.search, 'ownedDataEndpoint must not include a query string');
  assert(url.pathname.endsWith('/functions/v1/owned-intake'), 'ownedDataEndpoint path must end with /functions/v1/owned-intake');
  assert(url.hostname.endsWith('.supabase.co'), 'ownedDataEndpoint hostname must be a Supabase host');
  assert(allowedHosts.includes(url.hostname), 'ownedDataEndpoint hostname must be included in ownedDataAllowedHosts');
  assert(!isObviousNonProductionHost(url.hostname), `ownedDataEndpoint must not point to a localhost/test host: ${url.hostname}`);

  for (const host of allowedHosts) {
    assert(!isObviousNonProductionHost(host), `ownedDataAllowedHosts must not include localhost/test hosts in production config: ${host}`);
  }

  return { endpoint, allowedHosts };
}

async function validateGeneratedSiteData(expected) {
  for (const relativePath of ['assets/site-data.js', 'public/assets/site-data.js']) {
    const filePath = path.join(repoRoot, relativePath);
    const parsed = parseSiteData(await readFile(filePath, 'utf8'), relativePath);
    if (!parsed) continue;

    assert(parsed.ownedDataEndpoint === expected.endpoint, `${relativePath} ownedDataEndpoint does not match src/data/site-content.mjs`);
    assert(
      JSON.stringify(parsed.ownedDataAllowedHosts || []) === JSON.stringify(expected.allowedHosts),
      `${relativePath} ownedDataAllowedHosts does not match src/data/site-content.mjs`
    );
  }
}

async function validateGeneratedForms() {
  const formPages = [
    'starter-pack/index.html',
    'beauty/starter-pack/index.html',
    'contact/index.html',
    'for-vendors/index.html',
    'public/starter-pack/index.html',
    'public/beauty/starter-pack/index.html',
    'public/contact/index.html',
    'public/for-vendors/index.html'
  ];

  for (const relativePath of formPages) {
    const html = await readFile(path.join(repoRoot, relativePath), 'utf8');
    assert(html.includes(actionUrl), `${relativePath} no longer posts to ${actionUrl}`);
  }
}

async function main() {
  const expected = validateSourceConfig();
  await validateGeneratedSiteData(expected);
  await validateGeneratedForms();

  if (failures.length > 0) {
    console.error('owned-intake config check failed:');
    for (const message of failures) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log('owned-intake config check passed');
}

await main();
