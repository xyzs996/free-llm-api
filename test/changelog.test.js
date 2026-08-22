import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
// 用产物里那一套转义,而不是在判据里另写一份 —— 判据量的是「这段内容在不在页上」,
// 不是「转义对不对」;转义有它自己的判据。
import { escapeHtml } from '../src/html.js';

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

// ⚠ 变更记录原先只活在两份 README 和 data/changelog.json 里,**站上一个字都没有**
// —— 而站是这一家里唯一有人来的那一面。把这一页存下来的人回来的理由正好是这一段:
// 他上次拿的那个免费额度还在不在。少了它没有任何一处会红:首页照样 200,
// 目录照样是最新数据,只是不再告诉任何人有什么东西塌了。
test('the catalog page itself says what changed, not only the README', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const artifacts = renderer.renderArtifacts(providers, changelog);
  const week = changelog.weeks[0];

  for (const [path, field] of [['docs/index.html', 'detail'], ['docs/zh/index.html', 'detail_zh']]) {
    const html = artifacts[path];
    assert.ok(html.includes(week.week_of), `${path} should date the block it prints`);
    for (const change of week.changes) {
      const { name } = providers.find((provider) => provider.id === change.provider_id);
      assert.ok(html.includes(name), `${path} drops ${change.provider_id} from the change list`);
      assert.ok(
        html.includes(escapeHtml(change[field])),
        `${path} should print the ${field} of the ${change.provider_id} change`,
      );
    }
  }
});

// 中文页拿英文详情照样是一份「完整」的变更段:条数对得上,名字对得上,读着却是
// 另一种语言。所以这一条量的是两份**不一样**,而不是两份都在。
test('the Chinese change list is the Chinese one', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const artifacts = renderer.renderArtifacts(providers, changelog);
  const translated = changelog.weeks[0].changes.filter(({ detail, detail_zh: zh }) => zh && zh !== detail);
  assert.ok(translated.length > 0, 'this criterion needs at least one translated change to guard');

  for (const change of translated) {
    assert.ok(artifacts['docs/zh/index.html'].includes(escapeHtml(change.detail_zh)));
    assert.ok(!artifacts['docs/zh/index.html'].includes(escapeHtml(change.detail)));
  }
});

// 一条免费通道关掉,读者的下一个问题是「那要花多少钱」—— 而这一页答不了,
// 价格在姊妹仓库那 348 行里。这一段结尾那句话是这家里唯一一条**接着读者
// 问题**的出口;之前只有页脚一句「延伸阅读」,谁也不会在那儿停下。
test('the change block hands the reader somewhere that answers the next question', async () => {
  const renderer = await loadRenderer();
  assert.ok(renderer, 'src/render.js should export renderArtifacts');

  const { FIELD_NOTES_REPO } = await import('../src/field-notes.js');
  const artifacts = renderer.renderArtifacts(providers, changelog);

  for (const path of ['docs/index.html', 'docs/zh/index.html']) {
    const block = artifacts[path].split('changed-band')[1] ?? '';
    const end = block.indexOf('</section>');
    const inside = end === -1 ? block : block.slice(0, end);
    assert.ok(inside.includes(FIELD_NOTES_REPO), `${path} ends the change block without an exit`);
    assert.ok(inside.includes('changelog.json'), `${path} should link the full history`);
  }
});
