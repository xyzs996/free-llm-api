import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { accessGroups, catalogSummary, quickPicks } from '../src/growth.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

test('growth groups keep provider free tiers separate from other access types', () => {
  const groups = accessGroups(providers);

  assert.ok(groups.permanent.length > 0);
  assert.ok(groups.permanent.every(({ category }) => category === 'provider-free-tier'));
  assert.ok(groups.other.every(({ category }) => category !== 'provider-free-tier'));
  assert.equal(groups.permanent.length + groups.other.length, providers.length);
});

test('catalog summary reports actionable free-tier counts', () => {
  const summary = catalogSummary(providers);

  assert.equal(summary.permanentFree, 15);
  assert.equal(summary.noCardPermanentFree, 15);
  assert.equal(summary.openAiCompatiblePermanentFree, 15);
  assert.equal(summary.latestReview, '2026-07-25');
});

test('quick picks are deterministic and explain their selection rule', () => {
  const picks = quickPicks(providers);

  assert.deepEqual(
    picks.map(({ id }) => id),
    ['highest-daily-limit', 'highest-rpm', 'browser-ready', 'coding-agents'],
  );
  assert.equal(picks[0].provider.id, 'groq');
  assert.equal(picks[1].provider.id, 'siliconflow');
  assert.equal(picks[2].provider.id, 'gemini');
  assert.equal(picks[3].provider.id, 'groq');
  assert.match(picks[0].reason, /1,000 requests\/day/);
  assert.ok(picks.every(({ provider }) => provider.category === 'provider-free-tier'));
});
