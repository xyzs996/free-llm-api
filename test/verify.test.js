import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { modelsUrl } from '../scripts/cors-check.js';
import { findCredentialLeaks } from '../src/check.js';
import {
  SITE_URL,
  connectSrcOrigins,
  contentSecurityPolicy,
  renderVerifyPage,
  verifyTargets,
} from '../src/verify-page.js';
import {
  VERIFY_STATES,
  classifyVerifyResponse,
  readPageQuery,
  scrubbedSearch,
  selectProvider,
  verifyUrl,
} from '../docs/verify-contract.js';
import { checkKey } from '../docs/verify.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const page = renderVerifyPage(providers);
const targets = verifyTargets(providers);

function connectSrc(html) {
  const match = html.match(/connect-src ([^;"]+)/);
  assert.ok(match, 'the page must declare a connect-src allowlist');
  return match[1].split(' ');
}

test('the allowlist is exactly the provider origins, so a key has nowhere else to go', () => {
  const allowed = connectSrc(page);
  const catalog = connectSrcOrigins(providers);

  assert.deepEqual(allowed, catalog, 'connect-src drifted from the catalog');
  assert.equal(allowed.length, new Set(allowed).size);
  for (const origin of allowed) assert.match(origin, /^https:\/\/[a-z0-9.-]+$/);
});

test('the policy names neither this site nor any third party', () => {
  const policy = contentSecurityPolicy(providers);

  assert.match(policy, /^default-src 'none'/);
  assert.match(policy, /form-action 'none'/);
  assert.match(policy, /base-uri 'none'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
  // 'self' is the page's own origin. Allowing it as a connection target would
  // give the key a route back to us, which is the one thing this page promises.
  assert.doesNotMatch(connectSrc(page).join(' '), /'self'|xyzs996\.github\.io|cloudflareinsights|google-analytics|plausible/);
});

test('the browser scripts never persist a key', async () => {
  for (const name of ['verify.js', 'verify-contract.js', 'app.js', 'filter.js']) {
    const source = await readFile(new URL(`../docs/${name}`, import.meta.url), 'utf8');
    assert.doesNotMatch(
      source,
      /localStorage|sessionStorage|document\.cookie|indexedDB|navigator\.sendBeacon/,
      `docs/${name} reaches for storage or a beacon`,
    );
  }
});

test('a key handed to the page in a query string is refused and stripped', async () => {
  const query = readPageQuery('?provider=groq&key=abc123');

  assert.equal(query.providerId, 'groq');
  assert.equal(query.carriedSecret, true, 'the page must notice a key in the URL');
  assert.equal(Object.hasOwn(query, 'key'), false, 'the value itself is never handed back');
  assert.equal(scrubbedSearch('?provider=groq&key=abc123'), '?provider=groq');
  assert.equal(scrubbedSearch('?api_key=abc&token=def&secret=ghi&password=j'), '');
  assert.equal(scrubbedSearch('?provider=groq'), '?provider=groq');
  assert.equal(readPageQuery('?provider=groq').carriedSecret, false);

  // The URL is rewritten so the value leaves the address bar, the history
  // entry, and any referrer this page would otherwise send.
  const source = await readFile(new URL('../docs/verify.js', import.meta.url), 'utf8');
  assert.match(source, /history\.replaceState\(null, '', `\$\{window\.location\.pathname\}\$\{scrubbedSearch/);
});

test('every request target the page can build stays inside the allowlist', () => {
  const allowed = new Set(connectSrcOrigins(providers));

  for (const target of targets) {
    assert.ok(allowed.has(new URL(target.url).origin), `${target.id} points outside the allowlist`);
    assert.equal(new URL(target.url).origin, target.origin);
    assert.match(target.url, /\/models$/);
  }
});

test('the page and the CORS script agree on which endpoint gets called', () => {
  for (const provider of providers) {
    assert.equal(
      verifyUrl(provider.base_url),
      modelsUrl(provider.base_url),
      `${provider.id} would be measured at one URL and checked at another`,
    );
  }
});

test('a status code becomes a verdict that separates the key from the provider', () => {
  assert.equal(classifyVerifyResponse(200), VERIFY_STATES.KEY_ACCEPTED);
  assert.equal(classifyVerifyResponse(204), VERIFY_STATES.KEY_ACCEPTED);
  assert.equal(classifyVerifyResponse(401), VERIFY_STATES.KEY_REJECTED);
  assert.equal(classifyVerifyResponse(403), VERIFY_STATES.KEY_REJECTED);
  assert.equal(classifyVerifyResponse(429), VERIFY_STATES.RATE_LIMITED);
  assert.equal(classifyVerifyResponse(404), VERIFY_STATES.REQUEST_REJECTED);
  assert.equal(classifyVerifyResponse(502), VERIFY_STATES.ENDPOINT_ERROR);
  assert.throws(() => classifyVerifyResponse('200'), /needs an HTTP status code/);
});

test('a failed fetch is reported as no answer, not as a bad key', async () => {
  const target = targets.find(({ browserCheck }) => browserCheck === 'supported');
  const verdict = await checkKey(target, 'whatever', () => Promise.reject(new TypeError('Failed to fetch')));

  assert.equal(verdict.state, VERIFY_STATES.UNREACHABLE);
  assert.equal(verdict.status, null);
  assert.match(verdict.explanation, /not a verdict about your key/);
  assert.equal(verdict.tone, 'unknown');
});

test('the key travels only to the chosen provider, in one Authorization header', async () => {
  const target = targets.find(({ id }) => id === 'groq');
  const calls = [];
  const verdict = await checkKey(target, 'the-key-the-reader-pasted', (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ status: 200 });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, target.url);
  assert.equal(new URL(calls[0].url).origin, 'https://api.groq.com');
  assert.deepEqual(Object.keys(calls[0].init.headers), ['Authorization']);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer the-key-the-reader-pasted');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.referrerPolicy, 'no-referrer');
  // A redirect could carry the Authorization header to a host the allowlist
  // never approved, so the request refuses to follow one.
  assert.equal(calls[0].init.redirect, 'error');
  assert.equal(verdict.state, VERIFY_STATES.KEY_ACCEPTED);
});

test('a provider no browser can reach still gets a terminal command', () => {
  const blocked = targets.filter(({ browserCheck }) => browserCheck !== 'supported');
  assert.ok(blocked.length > 0, 'the catalog should still contain browser-blocked providers');

  for (const target of blocked) {
    assert.match(target.curl, /^curl /m, `${target.id} has no fallback command`);
    assert.ok(target.curl.includes(target.keyEnv));
    assert.ok(target.browserCheckNote.length > 30);
  }
  for (const target of targets) {
    assert.deepEqual(findCredentialLeaks(`verify/${target.id}`, target.curl), []);
  }
});

test('a deep link selects a provider and an unknown one falls back to a checkable default', () => {
  assert.equal(selectProvider(targets, 'groq').id, 'groq');
  assert.equal(selectProvider(targets, 'no-such-provider').browserCheck, 'supported');
  assert.equal(selectProvider(targets, null).browserCheck, 'supported');
  assert.equal(selectProvider([], 'groq'), null);
});

test('the generated page ships no credential and offers both groups of providers', () => {
  assert.deepEqual(findCredentialLeaks('docs/verify.html', page), []);
  assert.doesNotMatch(page, /Bearer\s+[A-Za-z0-9_-]{16,}/);
  assert.match(page, /<optgroup label="Checkable in a browser">/);
  assert.match(page, /<optgroup label="Terminal only">/);
  assert.match(page, /<input id="key-input" name="key" type="password"/);
  assert.match(page, /<link rel="canonical"/);

  for (const origin of connectSrcOrigins(providers)) {
    assert.ok(page.includes(`<li><code>${origin}</code></li>`), `${origin} is not shown to the reader`);
  }
});

test('a hostile provider name cannot become markup or script', () => {
  const hostile = structuredClone(providers);
  hostile[0].name = '<script>alert(1)</script>';
  hostile[0].official_sources = [{ title: '</script><img onerror=alert(1)>', url: 'https://example.com/a' }];
  const rendered = renderVerifyPage(hostile);

  assert.doesNotMatch(rendered, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(rendered, /<img onerror/);
  assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  // The embedded data block must not be closable from inside its own payload.
  const block = rendered.match(/<script id="verify-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(block, 'the page must embed its targets as a data block');
  assert.doesNotMatch(block[1], /</);
  assert.equal(JSON.parse(block[1].replaceAll('\\u003c', '<'))[0].name, '<script>alert(1)</script>');
});

test('the catalog page and both READMEs link to the checker', async () => {
  const { renderArtifacts } = await import('../src/render.js');
  const artifacts = renderArtifacts(providers);

  assert.ok(Object.hasOwn(artifacts, 'docs/verify.html'));
  assert.match(artifacts['docs/index.html'], /href="\.\/verify\.html"/);
  assert.match(artifacts['README.md'], /\[browser key checker\]\(https:\/\/[^)]+\/verify\.html\)/);
  assert.match(artifacts['README_zh.md'], /\[浏览器 key 检测页\]\(https:\/\/[^)]+\/verify\.html\)/);
});

test('the canonical URL the pages advertise is the one the site config declares', async () => {
  const site = JSON.parse(await readFile(new URL('../data/site.json', import.meta.url), 'utf8'));

  assert.equal(SITE_URL, site.site_url, 'the canonical link would point away from the published site');
  assert.match(page, new RegExp(`<link rel="canonical" href="${SITE_URL}verify\\.html">`));
});
