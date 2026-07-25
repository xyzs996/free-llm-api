import { PROBE_CLASSIFICATIONS } from './probe-contract.js';

function resultFor({
  endpointReachable,
  credentialValid,
  sampleQuotaExhausted,
  modelAvailable,
  httpStatus,
  latencyMs,
  checkedAt,
  classification,
  explanation,
}) {
  return {
    endpoint_reachable: endpointReachable,
    credential_valid: credentialValid,
    sample_quota_exhausted: sampleQuotaExhausted,
    model_available: modelAvailable,
    http_status: httpStatus,
    latency_ms: latencyMs,
    checked_at: checkedAt,
    classification,
    explanation,
  };
}

export function classifyProbe({
  httpStatus = null,
  latencyMs,
  checkedAt,
  modelAvailable = null,
  networkError = null,
}) {
  if (networkError) {
    return resultFor({
      endpointReachable: false,
      credentialValid: null,
      sampleQuotaExhausted: null,
      modelAvailable: null,
      httpStatus: null,
      latencyMs,
      checkedAt,
      classification: PROBE_CLASSIFICATIONS.NETWORK_ERROR,
      explanation: 'The sampled endpoint could not be reached.',
    });
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return resultFor({
      endpointReachable: true,
      credentialValid: true,
      sampleQuotaExhausted: false,
      modelAvailable,
      httpStatus,
      latencyMs,
      checkedAt,
      classification: PROBE_CLASSIFICATIONS.AVAILABLE,
      explanation: 'The sampled request succeeded.',
    });
  }

  if (httpStatus === 401 || httpStatus === 403) {
    return resultFor({
      endpointReachable: true,
      credentialValid: false,
      sampleQuotaExhausted: null,
      modelAvailable: null,
      httpStatus,
      latencyMs,
      checkedAt,
      classification: PROBE_CLASSIFICATIONS.CREDENTIAL_REJECTED,
      explanation: 'The endpoint responded, but the sample credential was rejected.',
    });
  }

  if (httpStatus === 429) {
    return resultFor({
      endpointReachable: true,
      credentialValid: null,
      sampleQuotaExhausted: null,
      modelAvailable: null,
      httpStatus,
      latencyMs,
      checkedAt,
      classification: PROBE_CLASSIFICATIONS.SAMPLE_RATE_LIMITED,
      explanation: 'The sample was rate-limited; the cause and remaining quota are unknown.',
    });
  }

  if (httpStatus >= 500 && httpStatus < 600) {
    return resultFor({
      endpointReachable: false,
      credentialValid: null,
      sampleQuotaExhausted: null,
      modelAvailable: null,
      httpStatus,
      latencyMs,
      checkedAt,
      classification: PROBE_CLASSIFICATIONS.ENDPOINT_ERROR,
      explanation: 'The sampled endpoint returned a server error; this is not evidence about the whole provider.',
    });
  }

  return resultFor({
    endpointReachable: true,
    credentialValid: null,
    sampleQuotaExhausted: null,
    modelAvailable: null,
    httpStatus,
    latencyMs,
    checkedAt,
    classification: PROBE_CLASSIFICATIONS.REQUEST_REJECTED,
    explanation: 'The sampled request was rejected for an unclassified reason.',
  });
}
