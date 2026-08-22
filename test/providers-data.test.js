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
  // 2026-07-30 到了,这一栏就不再是「即将」。写死 'retiring' 的那版判据在
  // 关停当天开始变成一条错的期望 —— 它绿着,而站上那句话已经假了 23 天。
  assert.equal(githubModels.availability.status, 'retired');
  assert.equal(githubModels.availability.accepting_new_users, false);
  assert.equal(githubModels.availability.retires_at, '2026-07-30');
  assert.equal(githubModels.signup_url, null);
});

// ⚠ github-models 的 retires_at 是 2026-07-30,而它的状态在那天之后仍写着
// 「即将下线」,站上就这么以将来时挂了 23 天 —— 没有一条判据会因为日历翻页而变红。
// 这一条会:下线日一到,状态没跟上就红,不需要任何人先改一行代码。
// 渲染那一面故意不看钟(见 src/lifecycle.js),让钟只在这里响一次。
test('a retirement date that has passed is not still spoken of as upcoming', async () => {
  const providers = await readCatalog();
  assert.ok(providers, 'data/providers.json should exist and contain valid JSON');

  const today = new Date().toISOString().slice(0, 10);
  for (const provider of providers) {
    const date = provider.availability.retires_at;
    if (!date || date > today) continue;
    assert.equal(
      provider.availability.status,
      'retired',
      `${provider.id} retired on ${date} but availability.status still reads "${provider.availability.status}"`,
    );
  }
});
