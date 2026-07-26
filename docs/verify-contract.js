// Verdict logic for the browser key check, kept pure so it can be asserted in
// Node without a DOM, a network, or a real key. docs/verify.js supplies the
// browser wiring; this file decides what a response means.

export const VERIFY_STATES = Object.freeze({
  KEY_ACCEPTED: 'key-accepted',
  KEY_REJECTED: 'key-rejected',
  RATE_LIMITED: 'rate-limited',
  REQUEST_REJECTED: 'request-rejected',
  ENDPOINT_ERROR: 'endpoint-error',
  UNREACHABLE: 'unreachable',
});

export const VERIFY_LABELS = Object.freeze({
  [VERIFY_STATES.KEY_ACCEPTED]: 'Key accepted',
  [VERIFY_STATES.KEY_REJECTED]: 'Key rejected',
  [VERIFY_STATES.RATE_LIMITED]: 'Rate limited',
  [VERIFY_STATES.REQUEST_REJECTED]: 'Request rejected',
  [VERIFY_STATES.ENDPOINT_ERROR]: 'Provider error',
  [VERIFY_STATES.UNREACHABLE]: 'No answer',
});

export const VERIFY_TONES = Object.freeze({
  [VERIFY_STATES.KEY_ACCEPTED]: 'good',
  [VERIFY_STATES.KEY_REJECTED]: 'bad',
  [VERIFY_STATES.RATE_LIMITED]: 'warn',
  [VERIFY_STATES.REQUEST_REJECTED]: 'warn',
  [VERIFY_STATES.ENDPOINT_ERROR]: 'warn',
  [VERIFY_STATES.UNREACHABLE]: 'unknown',
});

// Each line states what the response proves and, just as important, what it
// does not. A checker that overstates a 200 is worth less than no checker.
export const VERIFY_EXPLANATIONS = Object.freeze({
  [VERIFY_STATES.KEY_ACCEPTED]:
    'The provider listed its models for this key. That proves the key exists and is enabled, not which models your account may call or how much quota is left.',
  [VERIFY_STATES.KEY_REJECTED]:
    'The provider read the key and refused it. A truncated paste and a revoked key look identical here, so re-copy it once before assuming it is dead.',
  [VERIFY_STATES.RATE_LIMITED]:
    'The provider recognised the key and then throttled the request. This is a quota answer, not an invalid key.',
  [VERIFY_STATES.REQUEST_REJECTED]:
    'The provider refused the request itself. A region restriction, an unaccepted terms page, and a project without the API enabled all surface this way.',
  [VERIFY_STATES.ENDPOINT_ERROR]:
    'The provider failed on its own side. This says nothing about the key; try again later.',
  [VERIFY_STATES.UNREACHABLE]:
    'The browser could not complete the request. A CORS refusal, an offline network, a proxy, and a blocking extension are indistinguishable from this side, so this is not a verdict about your key. Run the command below to get one.',
});

// Same rule as scripts/cors-check.js. A static page cannot import from src/,
// so the two are kept in step by a test that compares them across the catalog.
export function verifyUrl(baseUrl) {
  return new URL('models', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export function classifyVerifyResponse(status) {
  if (!Number.isInteger(status)) {
    throw new TypeError('classifyVerifyResponse needs an HTTP status code');
  }
  if (status >= 200 && status < 300) return VERIFY_STATES.KEY_ACCEPTED;
  if (status === 401 || status === 403) return VERIFY_STATES.KEY_REJECTED;
  if (status === 429) return VERIFY_STATES.RATE_LIMITED;
  if (status >= 500) return VERIFY_STATES.ENDPOINT_ERROR;
  return VERIFY_STATES.REQUEST_REJECTED;
}

export function verdictFor(state, status = null) {
  if (!Object.values(VERIFY_STATES).includes(state)) {
    throw new Error(`Unknown verify state: ${state}`);
  }
  return {
    state,
    status,
    label: VERIFY_LABELS[state],
    tone: VERIFY_TONES[state],
    explanation: VERIFY_EXPLANATIONS[state],
  };
}

// The page ships its own wording as data, so the Chinese edition loads exactly
// this script and this verdict logic rather than a translated copy of it. A
// state the table does not cover keeps its English text instead of printing an
// empty result panel.
export function localizedVerdict(verdict, strings = null) {
  return {
    ...verdict,
    label: strings?.labels?.[verdict.state] ?? verdict.label,
    explanation: strings?.explanations?.[verdict.state] ?? verdict.explanation,
  };
}

// A key pasted into a query string ends up in browser history, in bookmark
// sync, and in any referrer the page emits. The page therefore refuses to read
// one and rewrites the address bar without it.
const SECRET_PARAMETER = /key|token|secret|auth|password/i;

export function readPageQuery(search) {
  const params = new URLSearchParams(search);
  return {
    providerId: params.get('provider'),
    carriedSecret: [...params.keys()].some((name) => SECRET_PARAMETER.test(name)),
  };
}

export function scrubbedSearch(search) {
  const params = new URLSearchParams(search);
  for (const name of [...params.keys()]) {
    if (SECRET_PARAMETER.test(name)) params.delete(name);
  }
  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export function selectProvider(providers, providerId) {
  const requested = providers.find(({ id }) => id === providerId);
  if (requested) return requested;
  return providers.find(({ browserCheck }) => browserCheck === 'supported') ?? providers[0] ?? null;
}

export function trimmedKey(value) {
  return typeof value === 'string' ? value.trim() : '';
}
