import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findStaleArtifacts, renderArtifacts, writeArtifacts } from '../src/render.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const renderScript = path.join(repoRoot, 'src', 'render.js');

const providers = JSON.parse(
  await readFile(path.join(repoRoot, 'data', 'providers.json'), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(path.join(repoRoot, 'data', 'changelog.json'), 'utf8'),
);

function runRender(args) {
  return spawnSync(process.execPath, [renderScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('render --check accepts the committed artifacts without rewriting them', () => {
  const result = runRender(['--check']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Checked \d+ artifacts; every one matches data\/\.$/m);
  assert.doesNotMatch(result.stdout, /^Rendered/m);
});

test('render rejects an unknown option instead of writing files', () => {
  const result = runRender(['--force']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown render option: --force/);
  assert.match(result.stderr, /Usage: node src\/render\.js \[--check\]/);
  assert.equal(result.stdout, '');
});

test('findStaleArtifacts names every generated file that drifted from the data', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'free-llm-render-'));
  const artifacts = renderArtifacts(providers, changelog);

  const allMissing = await findStaleArtifacts(artifacts, root);
  assert.deepEqual(allMissing.sort(), Object.keys(artifacts).sort());

  await writeArtifacts(providers, changelog, root);
  assert.deepEqual(await findStaleArtifacts(artifacts, root), []);

  await writeFile(path.join(root, 'README.md'), 'hand edited\n', 'utf8');
  assert.deepEqual(await findStaleArtifacts(artifacts, root), ['README.md']);
});
