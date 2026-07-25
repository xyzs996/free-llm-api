import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function loadProbeRunner() {
  try {
    return await import('../src/run-probe.js');
  } catch {
    return null;
  }
}

test('probe reads its key from env and emits only bounded redacted fields', async () => {
  const runner = await loadProbeRunner();
  assert.ok(runner, 'src/run-probe.js should export runProviderProbe');

  const key = `gsk_${'s'.repeat(32)}`;
  const rawMarker = 'raw-response-must-not-appear';
  let request;
  let bodyCancelled = false;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      status: 429,
      body: {
        async cancel() {
          bodyCancelled = true;
        },
      },
      async text() {
        throw new Error(rawMarker);
      },
    };
  };

  const output = await runner.runProviderProbe({
    providerId: 'groq',
    env: { GROQ_API_KEY: key },
    fetchImpl,
    now: () => new Date('2026-07-15T12:00:00.000Z'),
    clock: (() => {
      const values = [10, 22];
      return () => values.shift();
    })(),
  });

  assert.equal(request.options.headers.authorization, `Bearer ${key}`);
  assert.equal(request.options.method, 'GET');
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.equal(bodyCancelled, true);
  assert.deepEqual(Object.keys(output), ['schema_version', 'provider_id', 'probe']);
  assert.equal(output.probe.classification, 'sample-rate-limited');
  assert.equal(output.probe.sample_quota_exhausted, null);
  const serialized = JSON.stringify(output);
  assert.doesNotMatch(serialized, new RegExp(key));
  assert.doesNotMatch(serialized, new RegExp(rawMarker));
  assert.ok(Buffer.byteLength(serialized) <= runner.MAX_OUTPUT_BYTES);
});

test('probe timeout is bounded and redacts the original exception', async () => {
  const runner = await loadProbeRunner();
  assert.ok(runner, 'src/run-probe.js should export runProviderProbe');

  const key = `gsk_${'t'.repeat(32)}`;
  const fetchImpl = async (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => reject(new Error(`timeout while using ${key}`)),
      { once: true },
    );
  });

  const startedAt = Date.now();
  const output = await runner.runProviderProbe({
    providerId: 'groq',
    env: { GROQ_API_KEY: key },
    fetchImpl,
    timeoutMs: 10,
  });

  assert.ok(Date.now() - startedAt < 500);
  assert.equal(output.probe.classification, 'network-error');
  assert.doesNotMatch(JSON.stringify(output), new RegExp(key));
  assert.equal(output.probe.explanation, 'The sampled endpoint could not be reached.');
});

test('CLI default and explicit output stay ignored, redacted, and mode 0600', async (t) => {
  const runner = await loadProbeRunner();
  assert.ok(runner, 'src/run-probe.js should export runProbeCli');

  const rootDirectory = await mkdtemp(join(tmpdir(), 'llm-probe-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  const key = `gsk_${'u'.repeat(32)}`;
  const fetchImpl = async () => ({ status: 401, body: { cancel: async () => {} } });
  const stdoutChunks = [];
  const options = {
    env: { GROQ_API_KEY: key },
    fetchImpl,
    rootDirectory,
    stdout: { write: (chunk) => stdoutChunks.push(chunk) },
  };

  await runner.runProbeCli({ argv: ['--provider', 'groq'], ...options });
  await runner.runProbeCli({
    argv: ['--provider', 'groq', '--output', 'data/probe-output.json'],
    ...options,
  });

  const outputPath = join(rootDirectory, 'data', 'probe-output.json');
  const content = await readFile(outputPath, 'utf8');
  const metadata = await stat(outputPath);
  assert.equal(metadata.mode & 0o777, 0o600);
  assert.equal(JSON.parse(content).provider_id, 'groq');
  assert.doesNotMatch(content, new RegExp(key));
  assert.doesNotMatch(stdoutChunks.join(''), new RegExp(key));
  await assert.rejects(
    runner.runProbeCli({ argv: ['--provider', 'groq', '--output', 'probe.json'], ...options }),
    /data\/probe-output\.json/,
  );
});

test('repository exposes an explicit probe script but CI never invokes it', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

  assert.equal(packageJson.scripts.probe, 'node scripts/probe.js');
  assert.match(gitignore, /^data\/probe-output\.json$/m);
  assert.doesNotMatch(workflow, /npm run probe/);
});
