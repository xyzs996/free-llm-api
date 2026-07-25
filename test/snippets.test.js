import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findCredentialLeaks } from '../src/check.js';
import { clients, setupClient } from '../src/setup.js';
import {
  DEFAULT_KEY_ENV,
  SNIPPET_CLIENTS,
  keyEnvForProvider,
  renderSnippet,
  snippetModelFor,
} from '../src/snippets.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const providers = JSON.parse(
  await readFile(path.join(repoRoot, 'data', 'providers.json'), 'utf8'),
);

function tempDirectory() {
  return mkdtemp(path.join(tmpdir(), 'free-llm-snippets-'));
}

test('what the CLI writes to disk is byte-for-byte what renderSnippet returns', async () => {
  const options = { baseUrl: 'https://gateway.example/v1', model: 'example-model' };

  for (const { id } of clients) {
    const output = path.join(await tempDirectory(), id);
    const written = await setupClient(id, { ...options, output });
    const onDisk = await readFile(written.artifactPath, 'utf8');

    assert.equal(
      onDisk,
      renderSnippet(id, options).content,
      `${id} on disk has drifted from the shared snippet module`,
    );
  }
});

test('the CLI binary itself renders through the shared module', () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, 'src', 'cli.js'),
      'setup',
      'codex',
      '--dry-run',
      '--output',
      path.join(repoRoot, '.free-llm', 'dry-run-never-written'),
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  for (const line of renderSnippet('codex').content.trimEnd().split('\n')) {
    assert.ok(result.stdout.includes(line), `the dry run omitted: ${line}`);
  }
});

test('every snippet in the catalog reads its key from an environment variable', () => {
  let rendered = 0;

  for (const provider of providers) {
    const keyEnv = keyEnvForProvider(provider);
    const model = snippetModelFor(provider);

    for (const client of SNIPPET_CLIENTS) {
      // The catalog endpoints speak the OpenAI protocol; the Claude Code
      // wrapper targets an Anthropic-shaped base URL and is offered separately.
      if (client.wire === 'anthropic') continue;
      if (client.needsModel && model === null) continue;

      const { content } = renderSnippet(client.id, {
        baseUrl: provider.base_url,
        model: model ?? undefined,
        keyEnv,
        providerId: provider.id,
        providerName: provider.name,
      });
      rendered += 1;

      assert.ok(
        content.includes(keyEnv),
        `${provider.id}/${client.id} never names ${keyEnv}, so the reader has nowhere to put a key`,
      );
      assert.deepEqual(
        findCredentialLeaks(`${provider.id}/${client.filename}`, content),
        [],
        `${provider.id}/${client.id} looks like it carries a credential`,
      );
      assert.doesNotMatch(
        content,
        /Bearer\s+[A-Za-z0-9_-]{16,}/,
        `${provider.id}/${client.id} inlines a literal bearer token`,
      );
    }
  }

  assert.ok(rendered > 100, `expected the whole catalog to render, got ${rendered} snippets`);
});

test('each provider gets its own environment variable name', () => {
  const names = providers.map((provider) => keyEnvForProvider(provider));

  assert.equal(new Set(names).size, names.length, 'two providers would share one variable');
  for (const name of names) assert.match(name, /^[A-Z][A-Z0-9_]*_API_KEY$/);

  assert.equal(keyEnvForProvider({ id: 'github-models' }), 'GITHUB_MODELS_API_KEY');
  assert.equal(keyEnvForProvider({ id: 'zai' }), 'ZAI_API_KEY');
  assert.throws(() => keyEnvForProvider({ id: '' }), /Cannot derive an environment variable name/);
});

test('a prose catalog description is never offered as a model name', () => {
  assert.equal(snippetModelFor({ models: ['200+ models routed across partner providers'] }), null);
  assert.equal(
    snippetModelFor({ models: ['Free-tier eligibility varies by model', 'gemini-2.5-flash'] }),
    'gemini-2.5-flash',
  );
  assert.equal(snippetModelFor({ models: [] }), null);

  const closed = providers.find(({ id }) => id === 'github-models');
  assert.equal(snippetModelFor(closed), null, 'this catalog lists no pasteable model id');

  // A provider with no usable model name still gets the credential-free check,
  // because listing models needs no model name.
  const { content } = renderSnippet('curl', {
    baseUrl: closed.base_url,
    keyEnv: keyEnvForProvider(closed),
  });
  assert.match(content, /\/models'$/m);
  assert.match(content, /GITHUB_MODELS_API_KEY/);
});

test('a snippet field cannot smuggle syntax into a generated config', () => {
  assert.throws(() => renderSnippet('codex', { keyEnv: 'KEY"\nevil = "yes' }), /UPPER_SNAKE_CASE/);
  assert.throws(() => renderSnippet('codex', { keyEnv: 'lower_case' }), /UPPER_SNAKE_CASE/);
  assert.throws(
    () => renderSnippet('codex', { providerId: 'a]\n[model_providers.evil' }),
    /providerId must be a lowercase slug/,
  );
  assert.throws(
    () => renderSnippet('continue', { providerName: 'Evil"\napiKey: leaked' }),
    /must not contain quotes, colons, or line breaks/,
  );
  assert.throws(
    () => renderSnippet('continue', { model: 'safe-model\napiKey: exposed' }),
    /--model contains unsupported characters/,
  );
  // Assembled at runtime so this file never contains a literal that the
  // repository credential scanner would have to treat as a real leak.
  const unsafeBaseUrl = `${['https://user', 'password'].join(':')}@gateway.example/v1`;
  assert.throws(
    () => renderSnippet('curl', { baseUrl: unsafeBaseUrl }),
    /must not contain credentials/,
  );
  assert.throws(() => renderSnippet('nope'), /Unsupported client: nope/);
});

test('a Cloudflare model id stays a valid YAML scalar', () => {
  // YAML reserves a leading `@`, so this one has to be quoted while ordinary
  // model ids stay plain and every previously generated file is unchanged.
  const cloudflare = renderSnippet('continue', { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' });
  assert.match(cloudflare.content, /^ {4}model: "@cf\/meta\/llama-3\.3-70b-instruct-fp8-fast"$/m);

  const ordinary = renderSnippet('continue', { model: 'gpt-4o-mini' });
  assert.match(ordinary.content, /^ {4}model: gpt-4o-mini$/m);
});

test('the Claude Code wrapper defaults to the Anthropic-shaped base URL', () => {
  const wrapper = renderSnippet('claude-code');

  assert.equal(wrapper.wire, 'anthropic');
  assert.match(wrapper.content, /ANTHROPIC_BASE_URL='https:\/\/aiapiv2\.pekpik\.com'/);
  assert.match(wrapper.content, new RegExp(`ANTHROPIC_AUTH_TOKEN="\\$${DEFAULT_KEY_ENV}"`));
  assert.equal(renderSnippet('codex').baseUrl, 'https://aiapiv2.pekpik.com/v1');
});

test('the CLI configures clients while the examples stay reading material', () => {
  assert.deepEqual(
    clients.map(({ id }) => id),
    ['codex', 'claude-code', 'continue', 'cursor', 'cline'],
  );
  assert.deepEqual(
    SNIPPET_CLIENTS.filter(({ kind }) => kind === 'example').map(({ id }) => id),
    ['curl', 'python', 'node'],
  );
  for (const client of SNIPPET_CLIENTS) {
    assert.equal(typeof client.needsModel, 'boolean', `${client.id} must declare needsModel`);
    assert.ok(client.filename.length > 0);
  }
});
