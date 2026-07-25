import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkScript = path.join(repoRoot, 'scripts', 'check-repo.js');

const completeFiles = {
  'package.json': '{"name":"fixture","version":"0.1.0"}\n',
  'README.md': '# Fixture\n',
  'README_zh.md': '# 示例\n',
  'LICENSE': 'MIT License\n',
  'SECURITY.md': '# Security\n',
  'src/cli.js': '#!/usr/bin/env node\n',
  'test/smoke.test.js': "import test from 'node:test';\n",
  'docs/clients.md': '# Clients\n',
  'docs/doctor.md': '# Doctor\n',
  '.github/workflows/ci.yml': 'name: CI\n',
};

async function createFixture(overrides = {}, omitted = []) {
  const root = await mkdtemp(path.join(tmpdir(), 'free-llm-check-'));
  const files = { ...completeFiles, ...overrides };
  for (const [relativePath, content] of Object.entries(files)) {
    if (omitted.includes(relativePath)) continue;
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, 'utf8');
  }
  return root;
}

function runCheck(root) {
  return spawnSync(process.execPath, [checkScript, '--root', root], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('repository check accepts a complete repository without credential patterns', async () => {
  const root = await createFixture();
  const result = runCheck(root);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Repository check passed/);
});

test('repository check rejects a repository missing a required file', async () => {
  const root = await createFixture({}, ['README.md']);
  const result = runCheck(root);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required file: README\.md/);
});

test('repository check rejects credential-like content without echoing it', async () => {
  const credential = ['sk', 'proj', 'A'.repeat(48)].join('-');
  const root = await createFixture({
    'src/example.js': `export const value = '${credential}';\n`,
  });
  const result = runCheck(root);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Credential-like pattern in src\/example\.js/);
  assert.doesNotMatch(result.stdout, new RegExp(credential));
  assert.doesNotMatch(result.stderr, new RegExp(credential));
});

test('repository check rejects a fine-grained GitHub PAT without echoing it', async () => {
  const credential = ['github', 'pat', 'A'.repeat(24), 'B'.repeat(48)].join('_');
  const root = await createFixture({
    'src/example.js': `export const value = '${credential}';\n`,
  });
  const result = runCheck(root);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /GitHub fine-grained token/);
  assert.doesNotMatch(result.stdout, new RegExp(credential));
  assert.doesNotMatch(result.stderr, new RegExp(credential));
});
