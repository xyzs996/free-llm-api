import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LOCALES } from '../src/site.js';

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
  // The per-provider, per-family, per-client and per-comparison matrix is counted in
  // test/pages.test.js; everything outside it is enumerated here so a new
  // top-level artifact cannot appear unnoticed. Every locale publishes that
  // same matrix under its own prefix, so the prefixes come from the locale
  // list rather than from a pattern loose enough to swallow a stray folder.
  const prefixes = LOCALES.map(({ path_prefix: prefix }) => prefix).join('|');
  const matrix = new RegExp(`^docs/(${prefixes})(provider|model|client|compare)/[a-z0-9-]+\\.html$`);
  assert.deepEqual(Object.keys(first).filter((path) => !matrix.test(path)).sort(), [
    'README.md',
    'README_zh.md',
    'docs/.nojekyll',
    'docs/badges/checked.json',
    'docs/badges/providers.json',
    'docs/claude-code.md',
    'docs/cline.md',
    'docs/codex.md',
    'docs/index.html',
    'docs/llms.txt',
    'docs/methodology.html',
    'docs/providers.json',
    'docs/robots.txt',
    'docs/sitemap.xml',
    'docs/verify.html',
    'docs/zh/index.html',
    'docs/zh/methodology.html',
    'docs/zh/verify.html',
    'examples/README.md',
    'examples/curl/verify.sh',
    'examples/node/chat.mjs',
    'examples/python/chat.py',
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

test('README leads with GitHub acquisition paths and keeps its safety contract', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const readme = renderer.renderArtifacts(providers)['README.md'];
  assert.match(readme, /^# Free LLM APIs/m);
  assert.match(readme, /Permanent free tiers, no-card options, direct API key links/);
  assert.ok(
    readme.indexOf('## Pick a free API by goal') < readme.indexOf('## Permanent free tiers'),
    'quick picks should appear before the main catalog',
  );
  assert.ok(
    readme.indexOf('## Permanent free tiers') < readme.indexOf('## Other access options'),
    'permanent free tiers should not be mixed with trials or metered access',
  );
  assert.match(
    readme,
    /\| Provider \| Models \| Published limits \| Card \| OpenAI compatible \| Get API key \|/,
  );
  assert.match(readme, /## Quick start/);
  assert.match(readme, /from openai import OpenAI/);
  assert.match(readme, /## Why trust this list/);
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
    readme.indexOf('## Why trust this list') < readme.indexOf('utm_campaign=free-llm-api'),
    'hosted fallback should follow the free catalog and trust explanation',
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

test('home page leads with acquisition paths before the full directory', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const html = renderer.renderArtifacts(providers)['docs/index.html'];
  assert.match(html, /<nav class="site-nav"/);
  assert.match(html, /<h1>Free LLM APIs with direct API key links<\/h1>/);
  assert.match(html, /class="hero-actions"/);
  assert.match(html, /id="pick-by-goal"/);
  assert.match(html, /id="best-free-picks"/);
  assert.match(html, /id="directory"/);
  assert.match(html, /id="quick-start"/);
  assert.match(html, /id="trust"/);
  assert.ok(html.indexOf('id="pick-by-goal"') < html.indexOf('id="directory"'));
  assert.ok(html.indexOf('id="best-free-picks"') < html.indexOf('id="directory"'));
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
