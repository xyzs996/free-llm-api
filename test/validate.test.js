import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);

async function loadValidator() {
  try {
    return await import('../src/validate.js');
  } catch {
    return null;
  }
}

test('validator accepts the launch catalog', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  assert.deepEqual(validator.validateProviders(providers), []);
});

test('validator explains duplicate ids and malformed source or probe fields', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  const malformed = structuredClone(providers);
  malformed[1].id = malformed[0].id;
  malformed[1].official_sources = [{ title: '', url: 'http://example.com' }];
  malformed[1].probe.endpoint_reachable = 'yes';

  const errors = validator.validateProviders(malformed);
  assert.ok(errors.some((error) => error.includes('duplicate id')));
  assert.ok(errors.some((error) => error.includes('official_sources[0].title')));
  assert.ok(errors.some((error) => error.includes('official_sources[0].url')));
  assert.ok(errors.some((error) => error.includes('probe.endpoint_reachable')));
});

test('validator permits unknown numeric limits but rejects invented negative values', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  const unknown = structuredClone(providers);
  unknown[0].limits.requests_per_minute = null;
  assert.deepEqual(validator.validateProviders(unknown), []);

  unknown[0].limits.requests_per_minute = -1;
  assert.ok(
    validator
      .validateProviders(unknown)
      .some((error) => error.includes('limits.requests_per_minute')),
  );
});

test('validator rejects unknown and internally contradictory probe classifications', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  const unknown = structuredClone(providers);
  unknown[0].probe.classification = 'green';
  assert.ok(
    validator.validateProviders(unknown).some((error) => error.includes('probe.classification')),
  );

  const contradictory = structuredClone(providers);
  contradictory[0].probe.classification = 'available';
  contradictory[0].probe.explanation = 'Claimed available without a request.';
  const errors = validator.validateProviders(contradictory);
  assert.ok(errors.some((error) => error.includes('probe.endpoint_reachable')));
  assert.ok(errors.some((error) => error.includes('probe.http_status')));
  assert.ok(errors.some((error) => error.includes('probe.checked_at')));
});

test('validator requires sample-rate-limited quota exhaustion to remain unknown', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  const rateLimited = structuredClone(providers);
  rateLimited[0].probe = {
    endpoint_reachable: true,
    credential_valid: null,
    sample_quota_exhausted: true,
    model_available: null,
    http_status: 429,
    latency_ms: 12,
    checked_at: '2026-07-15T12:00:00.000Z',
    classification: 'sample-rate-limited',
    explanation: 'The sample was rate-limited.',
  };

  assert.ok(
    validator
      .validateProviders(rateLimited)
      .some((error) => error.includes('probe.sample_quota_exhausted')),
  );
});

test('validator accepts real calendar dates and rejects normalized impossible dates', async () => {
  const validator = await loadValidator();
  assert.ok(validator, 'src/validate.js should export validateProviders');

  const validLeapDay = structuredClone(providers);
  validLeapDay[0].source_checked_at = '2024-02-29';
  assert.deepEqual(validator.validateProviders(validLeapDay), []);

  const impossible = structuredClone(providers);
  impossible[0].source_checked_at = '2026-02-31';
  assert.ok(
    validator
      .validateProviders(impossible)
      .some((error) => error.includes('source_checked_at')),
  );
});
