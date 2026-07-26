import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  AVAILABILITY_STATUS_ZH,
  CATEGORY_TITLES_ZH,
  CHANGE_LABELS_ZH,
  renderReadmeZh,
} from '../src/readme-zh.js';
import { HOSTED_CTA_URL } from '../src/client-pages.js';
import { renderArtifacts } from '../src/render.js';
import { CHANGELOG_CHANGE_TYPES } from '../src/validate.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);

test('README_zh.md is a rendered artifact that matches what is on disk', async () => {
  const artifacts = renderArtifacts(providers, changelog);
  assert.ok(Object.hasOwn(artifacts, 'README_zh.md'));

  const onDisk = await readFile(new URL('../README_zh.md', import.meta.url), 'utf8');
  assert.equal(onDisk, artifacts['README_zh.md'], 'run npm run render');
});

test('the two READMEs link to each other and carry the same catalog', () => {
  const artifacts = renderArtifacts(providers, changelog);
  assert.match(artifacts['README.md'], /^English · \[简体中文\]\(README_zh\.md\)$/m);
  assert.match(artifacts['README_zh.md'], /^\[English\]\(README\.md\) · 简体中文$/m);

  const chinese = artifacts['README_zh.md'];
  for (const provider of providers) {
    assert.ok(chinese.includes(`[${provider.name}]`), `${provider.name} is missing from README_zh.md`);
  }
});

test('Chinese README mirrors the growth-first information architecture', () => {
  const readme = renderArtifacts(providers, changelog)['README_zh.md'];

  assert.match(readme, /^# 免费大模型 API 清单/m);
  assert.ok(readme.indexOf('## 按需求选择免费 API') < readme.indexOf('## 永久免费额度'));
  assert.ok(readme.indexOf('## 永久免费额度') < readme.indexOf('## 其他访问方式'));
  assert.match(readme, /## 快速开始/);
  assert.match(readme, /## 为什么可以信任这份清单/);
});

test('every catalog category, status, and change type has a Chinese label', () => {
  for (const category of new Set(providers.map(({ category }) => category))) {
    assert.ok(Object.hasOwn(CATEGORY_TITLES_ZH, category), `category "${category}" has no Chinese title`);
  }
  for (const status of new Set(providers.map(({ availability }) => availability.status))) {
    assert.ok(Object.hasOwn(AVAILABILITY_STATUS_ZH, status), `status "${status}" has no Chinese label`);
  }
  for (const type of Object.values(CHANGELOG_CHANGE_TYPES)) {
    assert.ok(Object.hasOwn(CHANGE_LABELS_ZH, type), `change type "${type}" has no Chinese label`);
  }

  const table = renderReadmeZh(providers, changelog);
  assert.match(table, /^\| 服务商 \| 模型 \| 官方公布限额 \| 信用卡 \| OpenAI 兼容 \| 获取 API Key \|$/m);
  assert.match(table, /^\| 服务商 \| 访问形式 \| 模型 \| 官方公布限额 \| 信用卡 \| OpenAI 兼容 \| 获取 API Key \|$/m);
  assert.doesNotMatch(table, /\| (provider-free-tier|trial-credit|metered-access) \|/);
  assert.doesNotMatch(table, /\| (active|retiring) \|/);
});

test('the Chinese weekly block uses the translated copy and falls back when it is absent', () => {
  const week = changelog.weeks[0];
  const lifecycle = week.changes.find(({ type }) => type === 'lifecycle');
  assert.ok(lifecycle?.detail_zh, 'the published week should carry translated lifecycle copy');

  const translated = renderReadmeZh(providers, changelog);
  assert.ok(translated.includes(week.summary_zh));
  assert.ok(translated.includes(lifecycle.detail_zh));
  assert.ok(!translated.includes(lifecycle.detail), 'the English detail should not be duplicated');

  const english = structuredClone(changelog);
  delete english.weeks[0].summary_zh;
  for (const change of english.weeks[0].changes) delete change.detail_zh;
  const fallback = renderReadmeZh(providers, english);
  assert.ok(fallback.includes(week.summary), 'an untranslated week still has to render');
  assert.ok(fallback.includes(lifecycle.detail));
});

test('the Chinese README keeps the probe caveat, the CTA, and no reward-for-star wording', () => {
  const chinese = renderReadmeZh(providers, changelog);

  assert.match(chinese, /不代表服务商整体可用性/);
  assert.match(chinese, /只说明这次采样被限流；原因和剩余额度都是未知的/);
  assert.ok(chinese.includes(HOSTED_CTA_URL));
  assert.match(chinese, /本项目也不会因为 Star 给出任何回报/);

  const banned = /star (to|for|and get)|star.*unlock|更多 key/i;
  for (const line of chinese.split('\n')) {
    assert.doesNotMatch(line, banned, line);
  }
});
