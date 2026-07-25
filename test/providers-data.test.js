import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalogUrl = new URL('../data/providers.json', import.meta.url);

async function readCatalog() {
  try {
    return JSON.parse(await readFile(catalogUrl, 'utf8'));
  } catch {
    return null;
  }
}

test('catalog carries enough source-backed providers to be worth reading', async () => {
  const providers = await readCatalog();

  assert.ok(providers, 'data/providers.json should exist and contain valid JSON');
  assert.ok(
    providers.length >= 25,
    `catalog should list at least 25 providers, found ${providers.length}`,
  );

  const ids = providers.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, 'provider ids must be unique');
});

test('every provider states where its numbers came from and when they were checked', async () => {
  const providers = await readCatalog();
  assert.ok(providers, 'data/providers.json should exist and contain valid JSON');

  for (const provider of providers) {
    assert.match(provider.source_checked_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(
      provider.official_sources.length > 0,
      `${provider.id} must cite at least one official source`,
    );
    assert.ok(provider.official_sources.every((source) => source.url.startsWith('https://')));
    assert.equal(provider.probe.checked_at, null, `${provider.id} must not claim an unpublished probe`);
  }
});

test('catalog marks GitHub Models retirement without presenting a signup path', async () => {
  const providers = await readCatalog();
  assert.ok(providers, 'data/providers.json should exist and contain valid JSON');

  const githubModels = providers.find(({ id }) => id === 'github-models');
  assert.equal(githubModels.availability.status, 'retiring');
  assert.equal(githubModels.availability.accepting_new_users, false);
  assert.equal(githubModels.availability.retires_at, '2026-07-30');
  assert.equal(githubModels.signup_url, null);
});
