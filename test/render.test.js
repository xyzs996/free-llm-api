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
  // 这一格量的是「下线日期出现在表里」。日期到了之后措辞得是过去式 ——
  // 时态那条判据在本文件末尾。
  assert.match(html, /Retired 2026-07-30/);
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

// The catalog was fetchable long before anything said so: `providers.json` has
// been published, CORS-open, on both the Pages host and the CDN the whole time,
// and it took 0 fetches a month while the README described it only as "the
// reviewed source dataset" in the local-development notes. The proxy list next
// door does the opposite — it puts the URL you copy in the table itself — and
// takes about 39,000 a month. So these assertions are about the address being
// on the page a reader actually reads, in both languages.
test('both READMEs hand the reader a URL that fetches the catalog', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const artifacts = renderer.renderArtifacts(providers);
  for (const path of ['README.md', 'README_zh.md']) {
    const readme = artifacts[path];
    // The bare fetch on its own line, not just the one buried in the `jq`
    // pipeline below it: a reader who wants to look at the file first has to
    // be able to copy a line that does only that.
    assert.match(
      readme,
      /```bash\ncurl -s https:\/\/xyzs996\.github\.io\/free-llm-api\/providers\.json\n```/,
    );
    assert.match(readme, /cdn\.jsdelivr\.net\/gh\/xyzs996\/free-llm-api@main\/data\/providers\.json/);
    // Ahead of the local-development notes, which is where the file used to be
    // mentioned and where nobody looking for data goes.
    assert.ok(
      readme.indexOf('providers.json') < readme.indexOf('npm run validate'),
      `${path} still names the catalog first in the build notes`,
    );
  }
});

// The number in the sentence and the filter the reader copies are one rule.
// Written twice, they part company the first time a provider starts asking for
// a card, and nothing about the page looks wrong afterwards.
test('the count printed beside the jq is the count that jq returns', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const { NO_CARD_OPENAI_JQ, noCardOpenAiCompatible } = await import('../src/growth.js');
  const expected = noCardOpenAiCompatible(providers);
  assert.ok(expected.length > 0 && expected.length < providers.length);

  const artifacts = renderer.renderArtifacts(providers);
  assert.match(artifacts['README.md'], new RegExp(`The ${expected.length} that speak OpenAI`));
  assert.match(artifacts['README_zh.md'], new RegExp(`有 ${expected.length} 家`));
  for (const path of ['README.md', 'README_zh.md']) {
    assert.ok(artifacts[path].includes(NO_CARD_OPENAI_JQ));
  }

  // And it moves with the data rather than being a constant that happens to fit.
  const carded = structuredClone(providers);
  for (const provider of carded) {
    if (provider.openai_compatible) provider.credit_card_required = true;
  }
  assert.equal(noCardOpenAiCompatible(carded).length, 0);
  assert.match(renderer.renderArtifacts(carded)['README.md'], /The 0 that speak OpenAI/);
});

// ⚠ 2026-08-22 抓线上产物:首页表格、README、给模型读的 llms.txt 三处都写着
// 「Retires 2026-07-30」—— 那一天已经过去 23 天。六个渲染点各自判断
// `availability.retires_at` 非空就排将来时,关停当天一起开始说假话,而字段还在、
// 页面照样 200,没有一处会红。时态现在只认 `hasRetired()`,这一条守住它:
// 已经下线的那家,任何一份产物里都不能再和将来时的措辞挨在一起。
test('a provider that has already shut down is not described in the future tense', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const retired = providers.filter(
    ({ availability }) => availability.status === 'retired' && availability.retires_at,
  );
  assert.ok(retired.length > 0, 'this criterion needs at least one shut-down provider to guard');

  const artifacts = renderer.renderArtifacts(providers);
  for (const { id, availability: { retires_at: date } } of retired) {
    for (const [path, body] of Object.entries(artifacts)) {
      if (typeof body !== 'string') continue;
      for (const phrase of [`Retires ${date}`, `retires ${date}`, `${date} 下线`]) {
        assert.ok(
          !body.includes(phrase),
          `${path} says "${phrase}" about ${id}, which shut down on ${date}`,
        );
      }
    }
  }
});
