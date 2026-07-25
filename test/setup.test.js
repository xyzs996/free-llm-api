import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'src', 'cli.js');
const fakeSecret = 'runtime-secret-that-must-never-be-written';

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      PEKPIK_API_KEY: fakeSecret,
      ...options.env,
    },
  });
}

async function tempDirectory() {
  return mkdtemp(path.join(tmpdir(), 'free-llm-agents-'));
}

function assertSecretAbsent(result, content) {
  assert.doesNotMatch(result.stdout, new RegExp(fakeSecret));
  assert.doesNotMatch(result.stderr, new RegExp(fakeSecret));
  assert.doesNotMatch(content, new RegExp(fakeSecret));
}

test('list reports all supported clients and their setup mode', () => {
  const result = runCli(['list']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /codex\s+generated/);
  assert.match(result.stdout, /claude-code\s+generated/);
  assert.match(result.stdout, /continue\s+generated/);
  assert.match(result.stdout, /cursor\s+guided/);
  assert.match(result.stdout, /cline\s+guided/);
});

test('setup codex writes a user-level merge snippet with environment-based auth', async () => {
  const output = path.join(await tempDirectory(), 'codex');
  const result = runCli([
    'setup',
    'codex',
    '--output',
    output,
    '--base-url',
    'https://gateway.example/v1',
    '--model',
    'example-model',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const content = await readFile(path.join(output, 'config.toml'), 'utf8');

  assert.match(content, /^model = "example-model"$/m);
  assert.match(content, /^model_provider = "pekpik"$/m);
  assert.match(content, /^\[model_providers\.pekpik\]$/m);
  assert.match(content, /^base_url = "https:\/\/gateway\.example\/v1"$/m);
  assert.match(content, /^env_key = "PEKPIK_API_KEY"$/m);
  assert.match(content, /^wire_api = "responses"$/m);
  assertSecretAbsent(result, content);
});

test('setup claude-code writes an executable wrapper that reads the key at runtime', async () => {
  const output = path.join(await tempDirectory(), 'claude-code');
  const result = runCli([
    'setup',
    'claude-code',
    '--output',
    output,
    '--base-url',
    'https://gateway.example',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const wrapperPath = path.join(output, 'run-claude-code.sh');
  const [content, metadata] = await Promise.all([
    readFile(wrapperPath, 'utf8'),
    stat(wrapperPath),
  ]);

  assert.match(content, /^#!\/usr\/bin\/env sh$/m);
  assert.match(content, /ANTHROPIC_BASE_URL='https:\/\/gateway\.example'/);
  assert.match(content, /ANTHROPIC_AUTH_TOKEN="\$PEKPIK_API_KEY"/);
  assert.match(content, /exec claude "\$@"/);
  assert.notEqual(metadata.mode & 0o111, 0);
  assertSecretAbsent(result, content);
});

test('setup continue writes config.yaml with a Continue secret reference', async () => {
  const output = path.join(await tempDirectory(), 'continue');
  const result = runCli([
    'setup',
    'continue',
    '--output',
    output,
    '--base-url',
    'https://gateway.example/v1',
    '--model',
    'example-model',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const content = await readFile(path.join(output, 'config.yaml'), 'utf8');

  assert.match(content, /^schema: v1$/m);
  assert.match(content, /^\s+provider: openai$/m);
  assert.match(content, /^\s+model: example-model$/m);
  assert.match(content, /^\s+apiBase: https:\/\/gateway\.example\/v1$/m);
  assert.match(content, /^\s+apiKey: \$\{\{ secrets\.PEKPIK_API_KEY \}\}$/m);
  assertSecretAbsent(result, content);
});

test('setup cursor writes guidance without changing Cursor settings', async () => {
  const output = path.join(await tempDirectory(), 'cursor');
  const result = runCli([
    'setup',
    'cursor',
    '--output',
    output,
    '--base-url',
    'https://gateway.example/v1',
    '--model',
    'example-model',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const content = await readFile(path.join(output, 'SETUP.md'), 'utf8');

  assert.match(content, /Cursor Settings.*Models/i);
  assert.match(content, /https:\/\/gateway\.example\/v1/);
  assert.match(content, /example-model/);
  assert.match(content, /PEKPIK_API_KEY/);
  assert.match(content, /built-in models/i);
  assert.match(content, /does not modify/i);
  assertSecretAbsent(result, content);
});

test('setup cline writes OpenAI Compatible guidance without changing extension storage', async () => {
  const output = path.join(await tempDirectory(), 'cline');
  const result = runCli([
    'setup',
    'cline',
    '--output',
    output,
    '--base-url',
    'https://gateway.example/v1',
    '--model',
    'example-model',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const content = await readFile(path.join(output, 'SETUP.md'), 'utf8');

  assert.match(content, /OpenAI Compatible/);
  assert.match(content, /https:\/\/gateway\.example\/v1/);
  assert.match(content, /example-model/);
  assert.match(content, /PEKPIK_API_KEY/);
  assert.match(content, /does not modify/i);
  assertSecretAbsent(result, content);
});

test('setup refuses to overwrite an existing generated artifact', async () => {
  const output = path.join(await tempDirectory(), 'codex');
  const first = runCli(['setup', 'codex', '--output', output, '--model', 'first-model']);
  assert.equal(first.status, 0, first.stderr);

  const second = runCli(['setup', 'codex', '--output', output, '--model', 'second-model']);
  const content = await readFile(path.join(output, 'config.toml'), 'utf8');

  assert.equal(second.status, 1);
  assert.match(second.stderr, /already exists/i);
  assert.match(content, /^model = "first-model"$/m);
  assert.doesNotMatch(content, /second-model/);
});

test('setup --dry-run prints the artifact it would write and touches no file', async () => {
  const output = path.join(await tempDirectory(), 'claude-code');
  const result = runCli([
    'setup',
    'claude-code',
    '--output',
    output,
    '--base-url',
    'https://gateway.example',
    '--dry-run',
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Dry run: nothing was written\.$/m);
  assert.match(result.stdout, /^Would create config: .*run-claude-code\.sh$/m);
  assert.match(result.stdout, /ANTHROPIC_BASE_URL='https:\/\/gateway\.example'/);
  assert.match(result.stdout, /ANTHROPIC_AUTH_TOKEN="\$PEKPIK_API_KEY"/);
  await assert.rejects(stat(path.join(output, 'run-claude-code.sh')), { code: 'ENOENT' });
  assertSecretAbsent(result, '');
});

test('setup --dry-run reports that a real run would refuse to overwrite', async () => {
  const output = path.join(await tempDirectory(), 'codex');
  const first = runCli(['setup', 'codex', '--output', output, '--model', 'first-model']);
  assert.equal(first.status, 0, first.stderr);

  const dry = runCli(['setup', 'codex', '--output', output, '--model', 'second-model', '--dry-run']);
  const content = await readFile(path.join(output, 'config.toml'), 'utf8');

  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /already exists there, so a real run would refuse to overwrite it/);
  assert.match(content, /^model = "first-model"$/m);
  assert.doesNotMatch(content, /second-model/);
});

test('setup rejects base URLs that contain credentials without echoing them', async () => {
  const output = path.join(await tempDirectory(), 'codex');
  const embeddedSecret = 'url-password-that-must-stay-private';
  const unsafeBaseUrl = ['https://user', embeddedSecret].join(':') + '@gateway.example/v1';
  const result = runCli([
    'setup',
    'codex',
    '--output',
    output,
    '--base-url',
    unsafeBaseUrl,
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /must not contain credentials/i);
  assert.doesNotMatch(result.stdout, new RegExp(embeddedSecret));
  assert.doesNotMatch(result.stderr, new RegExp(embeddedSecret));
});

test('setup rejects model IDs that could inject configuration', async () => {
  const output = path.join(await tempDirectory(), 'continue');
  const result = runCli([
    'setup',
    'continue',
    '--output',
    output,
    '--model',
    'safe-model\napiKey: exposed',
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unsupported characters/i);
});
