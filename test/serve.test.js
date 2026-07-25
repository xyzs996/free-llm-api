import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function loadServer() {
  try {
    return await import('../src/serve.js');
  } catch {
    return null;
  }
}

test('static server serves index assets and returns 404 for missing files', async (t) => {
  const serve = await loadServer();
  assert.ok(serve, 'src/serve.js should export startStaticServer');

  const root = await mkdtemp(join(tmpdir(), 'llm-status-'));
  await writeFile(join(root, 'index.html'), '<h1>Status</h1>', 'utf8');
  await writeFile(join(root, 'app.js'), 'export default true;', 'utf8');

  const server = await serve.startStaticServer({ root, host: '127.0.0.1', port: 0 });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });

  const { port } = server.address();
  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.equal(await page.text(), '<h1>Status</h1>');

  const missing = await fetch(`http://127.0.0.1:${port}/missing.txt`);
  assert.equal(missing.status, 404);
});
