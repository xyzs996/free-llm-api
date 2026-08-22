import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { STALE_AFTER_DAYS, hasRetired, staleSources } from '../src/lifecycle.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

function fixture(id, checkedAt) {
  return { id, source_checked_at: checkedAt, availability: { status: 'open' } };
}

// 渲染必须是数据的纯函数。让六个渲染点各自看钟的后果不是「时态更准」,是同一份
// 数据今天和明天编出两份产物 —— `render.js --check` 会在无人改动的那天变红,而
// 红的原因和真正的问题无关。
test('the tense of a page comes from the data, never from the clock', () => {
  const shutDown = { availability: { status: 'retired', retires_at: '2026-07-30' } };
  const stillRunning = { availability: { status: 'retiring', retires_at: '2026-07-30' } };

  assert.equal(hasRetired(shutDown), true);
  assert.equal(hasRetired(stillRunning), false);
});

test('a source read longer ago than the window is listed, newest last', () => {
  const listed = staleSources(
    [fixture('fresh', '2026-08-20'), fixture('old', '2026-06-01'), fixture('older', '2026-05-01')],
    '2026-08-22',
    30,
  );

  assert.deepEqual(listed.map(({ id }) => id), ['older', 'old']);
  assert.equal(listed[0].daysAgo, 113);
  assert.equal(listed[1].checkedAt, '2026-06-01');
});

// 边界两侧各一条:正好卡在窗口上的那家不算欠账,晚一天的算。少了这两条,
// 把比较写成 `<=` 或者把天数记成月份都照样绿。
test('the window counts days, and the day it lands on is still inside it', () => {
  const onTheEdge = staleSources([fixture('edge', '2026-07-23')], '2026-08-22', 30);
  assert.deepEqual(onTheEdge, []);

  const justOver = staleSources([fixture('edge', '2026-07-22')], '2026-08-22', 30);
  assert.deepEqual(justOver.map(({ id, daysAgo }) => [id, daysAgo]), [['edge', 31]]);
});

// ⚠ 只在有欠账时说话的检查,和被人删掉的检查,输出一模一样 —— 所以它每次都得
// 报一行,这一条量的就是那一行确实还在。
test('the repository check reports source freshness every run, not only when it is bad', () => {
  const run = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'check-repo.js')], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^Sources[: ]/m);
  assert.ok(
    run.stdout.includes(`${providers.length}`),
    'the freshness line should account for every provider in the catalog',
  );
  assert.ok(
    run.stdout.includes(`${STALE_AFTER_DAYS} days`),
    'the freshness line should say what window it applied',
  );
});
