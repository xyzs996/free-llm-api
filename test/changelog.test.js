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

test('README opens with the latest changelog week and links the full history', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const readme = renderer.renderArtifacts(providers, changelog)['README.md'];
  const [week] = changelog.weeks;

  assert.match(readme, /## Changed this week/);
  assert.ok(
    readme.indexOf('## Changed this week') < readme.indexOf('## Provider catalog'),
    'the weekly block belongs above the catalog table',
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

  const readme = renderer.renderArtifacts(providers, changelog)['README.md'];
  const added = changelog.weeks[0].changes.filter(({ type }) => type === 'added');
  assert.ok(added.length > 3, 'this fixture assumes the launch week added many providers');

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
  assert.match(readme, /## Provider catalog/);
});
