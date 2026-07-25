import assert from 'node:assert/strict';
import test from 'node:test';

async function loadContract() {
  try {
    return await import('../src/probe-contract.js');
  } catch {
    return null;
  }
}

test('probe classifications are defined by one shared enum', async () => {
  const contract = await loadContract();
  assert.ok(contract, 'src/probe-contract.js should export the shared probe enum');

  assert.deepEqual(Object.values(contract.PROBE_CLASSIFICATIONS), [
    'not-checked',
    'available',
    'credential-rejected',
    'sample-rate-limited',
    'endpoint-error',
    'network-error',
    'request-rejected',
  ]);
});

test('every classifier exit satisfies the shared field invariants', async () => {
  const contract = await loadContract();
  assert.ok(contract, 'src/probe-contract.js should export probe invariant validation');
  const { classifyProbe } = await import('../src/probe.js');
  const checkedAt = '2026-07-15T12:00:00.000Z';
  const samples = [
    classifyProbe({ httpStatus: 200, latencyMs: 1, checkedAt, modelAvailable: true }),
    classifyProbe({ httpStatus: 401, latencyMs: 1, checkedAt }),
    classifyProbe({ httpStatus: 429, latencyMs: 1, checkedAt }),
    classifyProbe({ httpStatus: 503, latencyMs: 1, checkedAt }),
    classifyProbe({ httpStatus: 400, latencyMs: 1, checkedAt }),
    classifyProbe({ networkError: new Error('redacted'), latencyMs: 1, checkedAt }),
  ];

  for (const sample of samples) {
    assert.deepEqual(contract.validateProbeInvariants(sample), []);
  }
});
