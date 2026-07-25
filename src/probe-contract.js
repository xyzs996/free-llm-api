export const PROBE_CLASSIFICATIONS = Object.freeze({
  NOT_CHECKED: 'not-checked',
  AVAILABLE: 'available',
  CREDENTIAL_REJECTED: 'credential-rejected',
  SAMPLE_RATE_LIMITED: 'sample-rate-limited',
  ENDPOINT_ERROR: 'endpoint-error',
  NETWORK_ERROR: 'network-error',
  REQUEST_REJECTED: 'request-rejected',
});

export const PROBE_CLASSIFICATION_LABELS = Object.freeze({
  [PROBE_CLASSIFICATIONS.NOT_CHECKED]: 'Not checked',
  [PROBE_CLASSIFICATIONS.AVAILABLE]: 'Available',
  [PROBE_CLASSIFICATIONS.CREDENTIAL_REJECTED]: 'Credential rejected',
  [PROBE_CLASSIFICATIONS.SAMPLE_RATE_LIMITED]: 'Sample limited',
  [PROBE_CLASSIFICATIONS.ENDPOINT_ERROR]: 'Endpoint error',
  [PROBE_CLASSIFICATIONS.NETWORK_ERROR]: 'Network error',
  [PROBE_CLASSIFICATIONS.REQUEST_REJECTED]: 'Request rejected',
});

function requireField(errors, probe, field, predicate, expectation) {
  if (!predicate(probe[field])) errors.push({ field, expectation });
}

function executedProbe(errors, probe) {
  requireField(errors, probe, 'latency_ms', Number.isFinite, 'be a measured number');
  requireField(errors, probe, 'checked_at', (value) => value !== null, 'be an ISO timestamp');
}

export function validateProbeInvariants(probe) {
  const errors = [];
  const classification = probe?.classification;
  const values = Object.values(PROBE_CLASSIFICATIONS);
  if (!values.includes(classification)) {
    return [{ field: 'classification', expectation: `be one of ${values.join(', ')}` }];
  }

  const isNull = (value) => value === null;
  const isTrue = (value) => value === true;
  const isFalse = (value) => value === false;

  if (classification === PROBE_CLASSIFICATIONS.NOT_CHECKED) {
    for (const field of [
      'endpoint_reachable',
      'credential_valid',
      'sample_quota_exhausted',
      'model_available',
      'http_status',
      'latency_ms',
      'checked_at',
    ]) {
      requireField(errors, probe, field, isNull, 'be null when no probe was run');
    }
    return errors;
  }

  executedProbe(errors, probe);

  if (classification === PROBE_CLASSIFICATIONS.AVAILABLE) {
    requireField(errors, probe, 'endpoint_reachable', isTrue, 'be true');
    requireField(errors, probe, 'credential_valid', isTrue, 'be true');
    requireField(errors, probe, 'sample_quota_exhausted', isFalse, 'be false');
    requireField(errors, probe, 'http_status', (value) => value >= 200 && value < 300, 'be 2xx');
  } else if (classification === PROBE_CLASSIFICATIONS.CREDENTIAL_REJECTED) {
    requireField(errors, probe, 'endpoint_reachable', isTrue, 'be true');
    requireField(errors, probe, 'credential_valid', isFalse, 'be false');
    requireField(errors, probe, 'sample_quota_exhausted', isNull, 'remain unknown');
    requireField(errors, probe, 'model_available', isNull, 'remain unknown');
    requireField(errors, probe, 'http_status', (value) => value === 401 || value === 403, 'be 401 or 403');
  } else if (classification === PROBE_CLASSIFICATIONS.SAMPLE_RATE_LIMITED) {
    requireField(errors, probe, 'endpoint_reachable', isTrue, 'be true');
    requireField(errors, probe, 'credential_valid', isNull, 'remain unknown');
    requireField(errors, probe, 'sample_quota_exhausted', isNull, 'remain unknown');
    requireField(errors, probe, 'model_available', isNull, 'remain unknown');
    requireField(errors, probe, 'http_status', (value) => value === 429, 'be 429');
  } else if (classification === PROBE_CLASSIFICATIONS.ENDPOINT_ERROR) {
    requireField(errors, probe, 'endpoint_reachable', isFalse, 'be false');
    for (const field of ['credential_valid', 'sample_quota_exhausted', 'model_available']) {
      requireField(errors, probe, field, isNull, 'remain unknown');
    }
    requireField(errors, probe, 'http_status', (value) => value >= 500 && value < 600, 'be 5xx');
  } else if (classification === PROBE_CLASSIFICATIONS.NETWORK_ERROR) {
    requireField(errors, probe, 'endpoint_reachable', isFalse, 'be false');
    for (const field of [
      'credential_valid',
      'sample_quota_exhausted',
      'model_available',
      'http_status',
    ]) {
      requireField(errors, probe, field, isNull, 'remain unknown');
    }
  } else if (classification === PROBE_CLASSIFICATIONS.REQUEST_REJECTED) {
    requireField(errors, probe, 'endpoint_reachable', isTrue, 'be true');
    for (const field of ['credential_valid', 'sample_quota_exhausted', 'model_available']) {
      requireField(errors, probe, field, isNull, 'remain unknown');
    }
    requireField(
      errors,
      probe,
      'http_status',
      (value) => Number.isInteger(value) && value >= 300 && value < 500
        && ![401, 403, 429].includes(value),
      'be an unclassified 3xx or 4xx status',
    );
  }

  return errors;
}
