import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

async function loadFilter() {
  try {
    return await import('../docs/filter.js');
  } catch {
    return null;
  }
}

test('filters providers by free-tier type, card requirement, compatibility, and probe state', async () => {
  const filter = await loadFilter();
  assert.ok(filter, 'docs/filter.js should export filterProviders');

  const activeDirect = filter.filterProviders(providers, {
    category: 'provider-free-tier',
    creditCard: 'not-required',
    openaiCompatible: 'yes',
    probe: 'not-checked',
    query: '',
  });

  assert.ok(activeDirect.length > 0, 'at least one card-free provider free tier should survive');
  for (const provider of activeDirect) {
    assert.equal(provider.category, 'provider-free-tier');
    assert.equal(provider.credit_card_required, false);
    assert.equal(provider.openai_compatible, true);
    assert.equal(provider.probe.classification, 'not-checked');
  }

  const ids = activeDirect.map(({ id }) => id);
  assert.ok(ids.includes('gemini'));
  assert.ok(ids.includes('groq'));
  assert.ok(!ids.includes('cerebras'), 'Cerebras requires a payment method and must be excluded');
});

test('search matches provider names, model labels, and limit summaries', async () => {
  const filter = await loadFilter();
  assert.ok(filter, 'docs/filter.js should export filterProviders');

  const gptOss = filter.filterProviders(providers, { query: 'gpt-oss' });
  assert.ok(gptOss.map(({ id }) => id).includes('groq'));
  for (const provider of gptOss) {
    const haystack = JSON.stringify(provider).toLowerCase();
    assert.ok(haystack.includes('gpt-oss'), `${provider.id} matched 'gpt-oss' without containing it`);
  }

  const retiring = filter.filterProviders(providers, { query: 'retires' });
  assert.ok(retiring.map(({ id }) => id).includes('github-models'));
});

test('all filter values leave the catalog unchanged', async () => {
  const filter = await loadFilter();
  assert.ok(filter, 'docs/filter.js should export filterProviders');

  assert.deepEqual(filter.filterProviders(providers, {}), providers);
});
