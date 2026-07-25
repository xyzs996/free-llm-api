import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validateScript = path.join(repoRoot, 'src', 'validate.js');

function runValidate(args = []) {
  return spawnSync(process.execPath, [validateScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('validate exits zero on the published catalog and changelog', () => {
  const result = runValidate();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated \d+ providers and \d+ changelog weeks?\./);
});

test('a provider that states limits without official sources fails validation', () => {
  const result = runValidate([
    '--providers',
    'test/fixtures/provider-missing-sources.json',
  ]);

  assert.equal(result.status, 1, 'missing sources must fail the gate');
  assert.match(result.stderr, /official_sources/);
  assert.match(result.stderr, /limits states quota facts/);
  assert.equal(result.stdout, '');
});

test('validate reports unreadable data instead of passing silently', () => {
  const result = runValidate(['--providers', 'data/does-not-exist.json']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Validation failed/);
});

test('validate rejects unknown options', () => {
  const result = runValidate(['--fast']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown validate option: --fast/);
});
