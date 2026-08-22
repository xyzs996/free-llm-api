import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);

async function loadValidator() {
  try {
    return await import('../src/validate.js');
  } catch {
    return null;
  }
}

async function loadRenderer() {
  try {
    return await import('../src/render.js');
  } catch {
    return null;
  }
}

test('validator accepts the published changelog', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateChangelog');

  assert.deepEqual(validator.validateChangelog(changelog, providers), []);
});

test('changelog entries must name a real catalog provider and a known change type', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateChangelog');

  const unknownProvider = structuredClone(changelog);
  unknownProvider.weeks[0].changes[0].provider_id = 'provider-that-was-never-listed';
  assert.ok(
    validator
      .validateChangelog(unknownProvider, providers)
      .some((error) => error.includes('is not in the catalog')),
  );

  const unknownType = structuredClone(changelog);
  unknownType.weeks[0].changes[0].type = 'improved';
  assert.ok(
    validator
      .validateChangelog(unknownType, providers)
      .some((error) => error.includes('.type must be one of')),
  );

  const undated = structuredClone(changelog);
  undated.weeks[0].week_of = '2026-02-30';
  assert.ok(
    validator
      .validateChangelog(undated, providers)
      .some((error) => error.includes('week_of must be a real')),
  );
});

test('a removed provider may only be logged once it has left the catalog', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateChangelog');

  const stillListed = structuredClone(changelog);
  stillListed.weeks[0].changes[0] = {
    type: 'removed',
    provider_id: 'groq',
    detail: 'Removed while still present in the catalog.',
  };
  assert.ok(
    validator
      .validateChangelog(stillListed, providers)
      .some((error) => error.includes('is still in the catalog')),
  );

  const genuinelyGone = structuredClone(changelog);
  genuinelyGone.weeks[0].changes[0] = {
    type: 'removed',
    provider_id: 'provider-that-shut-down',
    detail: 'Endpoint returned 410 and the signup page is gone.',
  };
  assert.deepEqual(validator.validateChangelog(genuinelyGone, providers), []);
});

test('Chinese copy is optional but may not be an empty placeholder', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateChangelog');

  const withoutChinese = structuredClone(changelog);
  delete withoutChinese.weeks[0].summary_zh;
  for (const change of withoutChinese.weeks[0].changes) delete change.detail_zh;
  assert.deepEqual(validator.validateChangelog(withoutChinese, providers), []);

  const blankSummary = structuredClone(changelog);
  blankSummary.weeks[0].summary_zh = '   ';
  assert.ok(
    validator
      .validateChangelog(blankSummary, providers)
      .some((error) => error.includes('summary_zh must be a non-empty string when present')),
  );

  const blankDetail = structuredClone(changelog);
  blankDetail.weeks[0].changes[0].detail_zh = '';
  assert.ok(
    validator
      .validateChangelog(blankDetail, providers)
      .some((error) => error.includes('detail_zh must be a non-empty string when present')),
  );
});

test('weeks are ordered newest first so the README block is unambiguous', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateChangelog');

  const outOfOrder = structuredClone(changelog);
  outOfOrder.weeks = [
    { ...outOfOrder.weeks[0], week_of: '2026-07-11' },
    { ...outOfOrder.weeks[0], week_of: '2026-07-25' },
  ];
  assert.ok(
    validator
      .validateChangelog(outOfOrder, providers)
      .some((error) => error.includes('weeks are newest first')),
  );
});

test('README keeps the latest changelog below the acquisition and trust sections', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const readme = renderer.renderArtifacts(providers, changelog)['README.md'];
  const [week] = changelog.weeks;

  assert.match(readme, /## Changed this week/);
  assert.ok(
    readme.indexOf('## Why trust this list') < readme.indexOf('## Changed this week'),
    'the weekly block should not interrupt the acquisition path',
  );
  assert.ok(readme.includes(`Week of ${week.week_of}`));
  assert.ok(readme.includes(week.summary));
  assert.match(readme, /\[`data\/changelog\.json`\]\(data\/changelog\.json\)/);

  const lifecycle = week.changes.find(({ type }) => type === 'lifecycle');
  assert.ok(lifecycle, 'the published week should record at least one lifecycle change');
  assert.ok(readme.includes(lifecycle.detail), 'lifecycle detail should be spelled out');
});

test('a bulk week is grouped by name instead of repeating one bullet per provider', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  // 发布那一周已经不是最新的一周了。这条量的是「一周里加了很多家时 README 怎么排」,
  // 所以把那一周单独拎出来当最新周渲染,而不是赌它永远排在第一个。
  const bulk = changelog.weeks.find(
    (week) => week.changes.filter(({ type }) => type === 'added').length > 3,
  );
  assert.ok(bulk, 'the catalog should still contain the week that added many providers');

  const readme = renderer.renderArtifacts(providers, { ...changelog, weeks: [bulk] })['README.md'];
  const added = bulk.changes.filter(({ type }) => type === 'added');

  assert.match(readme, new RegExp(`\\*\\*Added \\(${added.length}\\):\\*\\*`));
  for (const { provider_id: id } of added) {
    const { name } = providers.find((provider) => provider.id === id);
    assert.ok(readme.includes(name), `${id} should still be named in the weekly block`);
  }
});

test('README omits the weekly block when no changelog is supplied', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const readme = renderer.renderArtifacts(providers)['README.md'];
  assert.doesNotMatch(readme, /## Changed this week/);
  assert.match(readme, /## Permanent free tiers/);
});
