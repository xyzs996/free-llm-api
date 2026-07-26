import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

async function loadRenderer() {
  try {
    return await import('../src/render.js');
  } catch {
    return null;
  }
}

test('renderer produces deterministic README, Pages data, and pre-rendered HTML', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const first = renderer.renderArtifacts(providers);
  const second = renderer.renderArtifacts(structuredClone(providers));

  assert.deepEqual(first, second);
  // The per-provider, per-family and per-client matrix is counted in
  // test/pages.test.js; everything outside it is enumerated here so a new
  // top-level artifact cannot appear unnoticed.
  const matrix = /^docs\/(provider|model|client)\/[a-z0-9-]+\.html$/;
  assert.deepEqual(Object.keys(first).filter((path) => !matrix.test(path)).sort(), [
    'README.md',
    'README_zh.md',
    'docs/.nojekyll',
    'docs/claude-code.md',
    'docs/cline.md',
    'docs/codex.md',
    'docs/index.html',
    'docs/methodology.html',
    'docs/providers.json',
    'docs/robots.txt',
    'docs/sitemap.xml',
    'docs/verify.html',
  ]);
  assert.deepEqual(JSON.parse(first['docs/providers.json']), providers);
});

test('generated text artifacts contain no trailing whitespace', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  for (const [relativePath, content] of Object.entries(renderer.renderArtifacts(providers))) {
    assert.doesNotMatch(content, /[ \t]+$/m, relativePath);
  }
});

test('README leads with a runnable command, limitations, sources, and a measured CTA', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const readme = renderer.renderArtifacts(providers)['README.md'];
  assert.match(readme, /^# Free LLM API/m);
  assert.match(readme, /npm run render && npm run serve/);
  assert.match(readme, /A probe describes one sampled request, not provider-wide uptime\./);
  assert.match(readme, /GitHub Models.*2026-07-30/);
  assert.match(readme, /https:\/\/console\.groq\.com\/docs\/rate-limits/);
  assert.match(
    readme,
    /https:\/\/aiapiv2\.pekpik\.com\/register\?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api/,
  );
  assert.match(readme, /Star this repository to bookmark the dataset and follow releases\./);
  assert.match(readme, /GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq/);
  assert.match(readme, /data\/probe-output\.json/);
  assert.doesNotMatch(readme, /429.*exhausted its quota/);
  assert.ok(
    readme.indexOf('utm_campaign=free-llm-api') < readme.indexOf('## Provider catalog'),
    'hosted fallback should be visible before the catalog',
  );
  assert.match(readme, /docs\/assets\/status-page\.png/);
  assert.match(readme, /npx free-llm-api setup claude-code/);
  assert.match(readme, /https:\/\/github\.com\/xyzs996\/free-tier-llm-router/);
  assert.doesNotMatch(readme, /linny006-tecch/);
});

test('Pages HTML includes accessible filters and source-backed provider rows before JavaScript', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const html = renderer.renderArtifacts(providers)['docs/index.html'];
  for (const id of [
    'search-filter',
    'category-filter',
    'card-filter',
    'compatibility-filter',
    'probe-filter',
    'provider-table',
    'provider-count',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /GitHub Models/);
  assert.match(html, /Retires 2026-07-30/);
  assert.match(html, /No authenticated probe has been published\./);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.match(
    html,
    /href="https:\/\/github\.com\/xyzs996\/free-llm-api\/blob\/main\/README\.md#data"/,
  );
  assert.doesNotMatch(html, /linny006-tecch/);
  assert.doesNotMatch(html, /href="\.\.\/README\.md"/);
  for (const classification of [
    'not-checked',
    'available',
    'credential-rejected',
    'sample-rate-limited',
    'endpoint-error',
    'network-error',
    'request-rejected',
  ]) {
    assert.match(html, new RegExp(`<option value="${classification}">`));
  }
});

test('renderer escapes provider-controlled HTML text', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const unsafeProviders = structuredClone(providers);
  unsafeProviders[0].name = '<script>alert(1)</script>';
  const html = renderer.renderArtifacts(unsafeProviders)['docs/index.html'];

  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
