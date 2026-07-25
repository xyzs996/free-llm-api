import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

async function loadClientPages() {
  try {
    return await import('../src/client-pages.js');
  } catch {
    return null;
  }
}

async function readPage(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8').catch(() => null);
}

test('every client landing page exists on disk and matches the renderer', async () => {
  const module = await loadClientPages();
  assert.ok(module, 'src/client-pages.js should export renderClientPages');

  const rendered = module.renderClientPages(providers);
  assert.deepEqual(Object.keys(rendered).sort(), [
    'docs/claude-code.md',
    'docs/cline.md',
    'docs/codex.md',
  ]);

  for (const [relativePath, expected] of Object.entries(rendered)) {
    const actual = await readPage(relativePath);
    assert.equal(actual, expected, `${relativePath} is missing or out of date; run npm run render`);
  }
});

test('each landing page carries the conversion CTA with campaign attribution', async () => {
  const module = await loadClientPages();
  assert.ok(module, 'src/client-pages.js should export renderClientPages');

  const cta = new URL(module.HOSTED_CTA_URL);
  assert.equal(cta.searchParams.get('utm_source'), 'github');
  assert.equal(cta.searchParams.get('utm_medium'), 'repo');
  assert.equal(cta.searchParams.get('utm_campaign'), 'free-llm-api');

  for (const page of Object.values(module.renderClientPages(providers))) {
    assert.ok(page.includes(module.HOSTED_CTA_URL), 'CTA link must keep its utm parameters');
    assert.match(page, /hitting 429 every day\?/);
  }
});

test('landing pages target their client search intent and cite an official source', async () => {
  const module = await loadClientPages();
  assert.ok(module, 'src/client-pages.js should export renderClientPages');

  const pages = module.renderClientPages(providers);
  const expectations = [
    ['docs/claude-code.md', /^# Claude Code with a free LLM API$/m, 'docs.anthropic.com/en/docs/claude-code/llm-gateway'],
    ['docs/codex.md', /^# Codex CLI with a custom model provider$/m, 'developers.openai.com/codex/config-advanced'],
    ['docs/cline.md', /^# Cline with a free OpenAI-compatible API$/m, 'docs.cline.bot/provider-config/openai-compatible'],
  ];

  for (const [relativePath, heading, source] of expectations) {
    const page = pages[relativePath];
    assert.match(page, heading);
    assert.ok(page.includes(source), `${relativePath} should cite ${source}`);
    assert.match(page, /npx free-llm-api setup /);
  }
});

test('landing page tables only list open, card-free, OpenAI-compatible free access', async () => {
  const module = await loadClientPages();
  assert.ok(module, 'src/client-pages.js should export renderClientPages');

  const page = module.renderClientPages(providers)['docs/cline.md'];
  const listed = providers.filter((provider) => page.includes(`| ${provider.name} |`));

  assert.ok(listed.length >= 15, `expected a usable shortlist, found ${listed.length}`);
  for (const provider of listed) {
    assert.equal(provider.openai_compatible, true);
    assert.equal(provider.credit_card_required, false);
    assert.equal(provider.availability.accepting_new_users, true);
    assert.notEqual(provider.category, 'metered-access');
  }

  const names = listed.map(({ name }) => name);
  assert.ok(!names.includes('IBM watsonx.ai'), 'a non-OpenAI-compatible provider must not appear');
  assert.ok(!names.includes('Cerebras Inference'), 'a card-gated provider must not appear');
  assert.ok(!names.includes('GitHub Models'), 'a provider closed to new users must not appear');
});

test('limit columns are written for readers, never as raw status slugs', async () => {
  const module = await loadClientPages();
  assert.ok(module, 'src/client-pages.js should export renderClientPages');

  const statuses = [...new Set(providers.map(({ limits }) => limits.status))];
  for (const status of statuses) {
    assert.ok(
      Object.hasOwn(module.LIMIT_STATUS_LABELS, status),
      `limits.status "${status}" has no reader-facing label`,
    );
  }

  const page = module.renderClientPages(providers)['docs/codex.md'];
  const table = page.slice(page.indexOf('| Provider |'), page.indexOf('\n\nNumbers come from'));
  assert.doesNotMatch(table, /\| [a-z-]+_[a-z-]+ \|/, 'no snake_case slug should reach the table');
  assert.doesNotMatch(table, /\| documented-/, 'no documented-* slug should reach the table');
});

test('published docs contain no reward-for-star wording', async () => {
  const banned = /star (to|for|and get)|star.*unlock|更多 key/i;
  const files = [
    'README.md',
    'docs/claude-code.md',
    'docs/cline.md',
    'docs/codex.md',
    'docs/clients.md',
    'docs/doctor.md',
  ];

  for (const relativePath of files) {
    const content = await readPage(relativePath);
    assert.ok(content, `${relativePath} should exist`);
    for (const line of content.split('\n')) {
      assert.doesNotMatch(line, banned, `${relativePath}: ${line}`);
    }
  }
});
