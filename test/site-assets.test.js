import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadApp() {
  try {
    return await import('../docs/app.js');
  } catch {
    return null;
  }
}

async function readStyles() {
  try {
    return await readFile(new URL('../docs/styles.css', import.meta.url), 'utf8');
  } catch {
    return null;
  }
}

test('browser app normalizes the filter form state', async () => {
  const app = await loadApp();
  assert.ok(app, 'docs/app.js should export buildFilterState');

  assert.deepEqual(
    app.buildFilterState({
      query: '  Groq  ',
      category: '',
      creditCard: 'not-required',
      openaiCompatible: 'yes',
      probe: 'not-checked',
    }),
    {
      query: 'Groq',
      category: 'all',
      creditCard: 'not-required',
      openaiCompatible: 'yes',
      probe: 'not-checked',
    },
  );
});

test('browser app listens for both search input and select changes', async () => {
  const source = await readFile(new URL('../docs/app.js', import.meta.url), 'utf8').catch(() => '');

  assert.match(source, /addEventListener\('input'/);
  assert.match(source, /addEventListener\('change'/);
  assert.match(source, /filterProviders/);
  assert.match(source, /row\.hidden/);
});

test('styles provide a mobile table layout and honor the hidden attribute', async () => {
  const styles = await readStyles();
  assert.ok(styles, 'docs/styles.css should exist');

  assert.match(styles, /\[hidden\]\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/);
  assert.match(styles, /td::before/);
  assert.doesNotMatch(styles, /letter-spacing:\s*-/);
});
