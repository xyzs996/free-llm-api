import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'src', 'cli.js');
const fakeSecret = 'doctor-runtime-secret-that-must-not-leak';

async function runCli(args, env = {}) {
  try {
    const result = await execFileAsync(process.execPath, [cliPath, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PEKPIK_API_KEY: fakeSecret,
        ...env,
      },
    });
    return { status: 0, ...result };
  } catch (error) {
    return {
      status: error.code,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

async function listen(handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}

function assertSecretAbsent(result) {
  assert.doesNotMatch(result.stdout, new RegExp(fakeSecret));
  assert.doesNotMatch(result.stderr, new RegExp(fakeSecret));
}

test('doctor reports success, latency, and model count', async () => {
  let observedRequest;
  const server = await listen((request, response) => {
    observedRequest = {
      url: request.url,
      authorization: request.headers.authorization,
    };
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ data: [{ id: 'model-a' }, { id: 'model-b' }] }));
  });

  try {
    const result = await runCli(['doctor', '--base-url', server.baseUrl]);

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(observedRequest, {
      url: '/v1/models',
      authorization: `Bearer ${fakeSecret}`,
    });
    assert.match(result.stdout, /^status: success$/m);
    assert.match(result.stdout, /^http_status: 200$/m);
    assert.match(result.stdout, /^latency_ms: \d+$/m);
    assert.match(result.stdout, /^models: 2$/m);
    assertSecretAbsent(result);
  } finally {
    await server.close();
  }
});

test('doctor classifies authentication failures without printing the response body', async () => {
  const server = await listen((_request, response) => {
    response.writeHead(401, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: `invalid ${fakeSecret}` }));
  });

  try {
    const result = await runCli(['doctor', '--base-url', server.baseUrl]);

    assert.equal(result.status, 2);
    assert.match(result.stdout, /^status: authentication_error$/m);
    assert.match(result.stdout, /^http_status: 401$/m);
    assertSecretAbsent(result);
  } finally {
    await server.close();
  }
});

test('doctor classifies rate limits separately from authentication failures', async () => {
  const server = await listen((_request, response) => {
    response.writeHead(429, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: `quota exhausted for ${fakeSecret}` }));
  });

  try {
    const result = await runCli(['doctor', '--base-url', server.baseUrl]);

    assert.equal(result.status, 3);
    assert.match(result.stdout, /^status: rate_limited$/m);
    assert.match(result.stdout, /^http_status: 429$/m);
    assertSecretAbsent(result);
  } finally {
    await server.close();
  }
});

test('doctor classifies a connection failure as a network error', async () => {
  const server = await listen((_request, response) => response.end());
  const baseUrl = server.baseUrl;
  await server.close();

  const result = await runCli(['doctor', '--base-url', baseUrl, '--timeout-ms', '500']);

  assert.equal(result.status, 4);
  assert.match(result.stdout, /^status: network_error$/m);
  assert.match(result.stdout, /^http_status: unavailable$/m);
  assertSecretAbsent(result);
});

test('doctor fails before making a request when PEKPIK_API_KEY is missing', async () => {
  const result = await runCli(
    ['doctor', '--base-url', 'http://127.0.0.1:1/v1'],
    { PEKPIK_API_KEY: '' },
  );

  assert.equal(result.status, 2);
  assert.match(result.stdout, /^status: authentication_error$/m);
  assert.match(result.stderr, /PEKPIK_API_KEY is not set/);
});

test('doctor --chat sends a minimal chat completion after listing models', async () => {
  const requests = [];
  const server = await listen((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      requests.push({ url: request.url, method: request.method, body });
      response.writeHead(200, { 'content-type': 'application/json' });
      if (request.url.endsWith('/models')) {
        response.end(JSON.stringify({ data: [{ id: 'example-model' }] }));
      } else {
        response.end(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
      }
    });
  });

  try {
    const result = await runCli([
      'doctor',
      '--base-url',
      server.baseUrl,
      '--chat',
      '--model',
      'example-model',
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests.map(({ url, method }) => ({ url, method })), [
      { url: '/v1/models', method: 'GET' },
      { url: '/v1/chat/completions', method: 'POST' },
    ]);
    assert.deepEqual(JSON.parse(requests[1].body), {
      model: 'example-model',
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 8,
      stream: false,
    });
    assert.match(result.stdout, /^chat_status: success$/m);
    assert.match(result.stdout, /^chat_http_status: 200$/m);
    assertSecretAbsent(result);
  } finally {
    await server.close();
  }
});
