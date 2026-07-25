import assert from 'node:assert/strict';
import test from 'node:test';

const checkedAt = '2026-07-15T12:00:00.000Z';

async function loadProbeClassifier() {
  try {
    return await import('../src/probe.js');
  } catch {
    return null;
  }
}

test('200 records a reachable endpoint and valid sample credential', async () => {
  const probe = await loadProbeClassifier();
  assert.ok(probe, 'src/probe.js should export classifyProbe');

  assert.deepEqual(
    probe.classifyProbe({ httpStatus: 200, latencyMs: 42, checkedAt, modelAvailable: true }),
    {
      endpoint_reachable: true,
      credential_valid: true,
      sample_quota_exhausted: false,
      model_available: true,
      http_status: 200,
      latency_ms: 42,
      checked_at: checkedAt,
      classification: 'available',
      explanation: 'The sampled request succeeded.',
    },
  );
});

test('401 and 403 describe only the sampled credential failure', async () => {
  const probe = await loadProbeClassifier();
  assert.ok(probe, 'src/probe.js should export classifyProbe');

  for (const httpStatus of [401, 403]) {
    const result = probe.classifyProbe({ httpStatus, latencyMs: 15, checkedAt });
    assert.equal(result.endpoint_reachable, true);
    assert.equal(result.credential_valid, false);
    assert.equal(result.sample_quota_exhausted, null);
    assert.equal(result.classification, 'credential-rejected');
    assert.match(result.explanation, /sample credential/i);
    assert.doesNotMatch(result.explanation, /provider is down/i);
  }
});

test('429 reports sample rate limiting without declaring credential validity', async () => {
  const probe = await loadProbeClassifier();
  assert.ok(probe, 'src/probe.js should export classifyProbe');

  const result = probe.classifyProbe({ httpStatus: 429, latencyMs: 28, checkedAt });
  assert.equal(result.endpoint_reachable, true);
  assert.equal(result.credential_valid, null);
  assert.equal(result.sample_quota_exhausted, null);
  assert.equal(result.model_available, null);
  assert.equal(result.classification, 'sample-rate-limited');
  assert.match(result.explanation, /sample/i);
});

test('5xx reports an endpoint error without claiming a provider-wide outage', async () => {
  const probe = await loadProbeClassifier();
  assert.ok(probe, 'src/probe.js should export classifyProbe');

  const result = probe.classifyProbe({ httpStatus: 503, latencyMs: 61, checkedAt });
  assert.equal(result.endpoint_reachable, false);
  assert.equal(result.credential_valid, null);
  assert.equal(result.sample_quota_exhausted, null);
  assert.equal(result.classification, 'endpoint-error');
  assert.match(result.explanation, /sampled endpoint/i);
  assert.doesNotMatch(result.explanation, /provider-wide outage/i);
});

test('network errors contain no raw error or credential material', async () => {
  const probe = await loadProbeClassifier();
  assert.ok(probe, 'src/probe.js should export classifyProbe');

  const result = probe.classifyProbe({
    networkError: new Error('request failed with Authorization: Bearer sensitive-value'),
    latencyMs: 75,
    checkedAt,
  });
  assert.equal(result.endpoint_reachable, false);
  assert.equal(result.http_status, null);
  assert.equal(result.sample_quota_exhausted, null);
  assert.equal(result.classification, 'network-error');
  assert.equal(result.explanation, 'The sampled endpoint could not be reached.');
  assert.doesNotMatch(JSON.stringify(result), /sensitive-value/);
});
