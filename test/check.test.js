import assert from 'node:assert/strict';
import test from 'node:test';

async function loadChecker() {
  try {
    return await import('../src/check.js');
  } catch {
    return null;
  }
}

test('credential scanner rejects key-shaped values but accepts documented placeholders', async () => {
  const checker = await loadChecker();
  assert.ok(checker, 'src/check.js should export findCredentialLeaks');

  const shapedValue = `sk-${'a'.repeat(40)}`;
  assert.ok(checker.findCredentialLeaks('fixture.txt', shapedValue).length > 0);
  assert.deepEqual(checker.findCredentialLeaks('example.env', 'API_KEY=YOUR_API_KEY'), []);
});

test('credential scanner detects fine-grained GitHub tokens, private keys, and URL userinfo', async () => {
  const checker = await loadChecker();
  assert.ok(checker, 'src/check.js should export findCredentialLeaks');

  const fixtures = [
    `github${'_pat_'}${'a'.repeat(40)}`,
    `-----BEGIN ${'PRIVATE KEY-----'}`,
    ['https://', 'probe-user', ':', 'url-secret', '@', 'example.com/models'].join(''),
  ];

  for (const fixture of fixtures) {
    const errors = checker.findCredentialLeaks('fixture.txt', fixture);
    assert.ok(errors.length > 0, `expected scanner to reject fixture type: ${fixture.slice(0, 8)}`);
    assert.doesNotMatch(errors.join('\n'), new RegExp(fixture.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('repository check validates data, generated artifacts, and credential safety', async () => {
  const checker = await loadChecker();
  assert.ok(checker, 'src/check.js should export checkRepository');

  assert.deepEqual(await checker.checkRepository(), []);
});
