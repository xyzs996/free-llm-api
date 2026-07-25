import {
  VERIFY_STATES,
  classifyVerifyResponse,
  readPageQuery,
  scrubbedSearch,
  selectProvider,
  trimmedKey,
  verdictFor,
} from './verify-contract.js';

const REQUEST_TIMEOUT_MS = 12_000;

// The key exists in one variable and one request header. It is never written to
// storage, never put in the URL, and never sent anywhere but the provider — the
// page's connect-src allowlist contains only provider origins, so a bug here
// cannot turn into an exfiltration path.
export async function checkKey(target, key, fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(target.url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      // A redirect could carry the Authorization header to another host, so an
      // unexpected one is reported rather than followed.
      redirect: 'error',
      signal: controller.signal,
    });
    return verdictFor(classifyVerifyResponse(response.status), response.status);
  } catch {
    return verdictFor(VERIFY_STATES.UNREACHABLE);
  } finally {
    clearTimeout(timer);
  }
}

// Built as nodes rather than an HTML string so a source title can never become
// markup, whatever lands in the dataset later.
function fillSources(container, provider) {
  container.replaceChildren();
  provider.sources.forEach(({ title, url }, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.setAttribute('aria-hidden', 'true');
      separator.textContent = ' · ';
      container.append(separator);
    }
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noreferrer nofollow';
    link.textContent = title;
    container.append(link);
  });
}

function initialize() {
  const dataElement = document.querySelector('#verify-data');
  const form = document.querySelector('#verify-form');
  const select = document.querySelector('#provider-select');
  if (!dataElement || !form || !select) return;

  const targets = JSON.parse(dataElement.textContent);
  const keyInput = form.querySelector('#key-input');
  const submit = form.querySelector('#verify-submit');
  const result = document.querySelector('#verify-result');
  const resultLabel = document.querySelector('#result-label');
  const resultDetail = document.querySelector('#result-detail');
  const endpoint = document.querySelector('#verify-endpoint');
  const envName = document.querySelector('#verify-env');
  const fallback = document.querySelector('#verify-fallback');
  const browserNote = document.querySelector('#browser-note');
  const providerSources = document.querySelector('#provider-sources');
  const signup = document.querySelector('#provider-signup');

  const query = readPageQuery(window.location.search);
  if (query.carriedSecret) {
    // Refuse the value and take it out of the address bar, history entry and
    // any referrer this page would otherwise emit.
    window.history.replaceState(null, '', `${window.location.pathname}${scrubbedSearch(window.location.search)}`);
  }

  let current = selectProvider(targets, query.providerId);
  if (!current) return;
  select.value = current.id;

  const showTarget = () => {
    current = targets.find(({ id }) => id === select.value) ?? current;
    const blocked = current.browserCheck !== 'supported';

    endpoint.textContent = current.url;
    envName.textContent = current.keyEnv;
    fallback.textContent = current.curl;
    browserNote.textContent = current.browserCheckNote;
    browserNote.dataset.state = current.browserCheck;
    fillSources(providerSources, current);
    signup.hidden = !current.signupUrl;
    if (current.signupUrl) signup.href = current.signupUrl;

    submit.disabled = blocked;
    submit.textContent = blocked ? 'Not checkable in a browser' : 'Check this key';
    result.hidden = true;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const key = trimmedKey(keyInput.value);
    if (key === '') {
      keyInput.focus();
      return;
    }

    const target = current;
    submit.disabled = true;
    submit.textContent = 'Checking…';
    result.hidden = false;
    result.dataset.tone = 'pending';
    resultLabel.textContent = 'Checking…';
    resultDetail.textContent = `Asking ${target.name} to list its models.`;

    const verdict = await checkKey(target, key);
    // Switching provider mid-request already redrew the panel; showing this
    // verdict now would label it with the wrong provider.
    if (current !== target) return;

    result.dataset.tone = verdict.tone;
    resultLabel.textContent = verdict.status === null
      ? verdict.label
      : `${verdict.label} · HTTP ${verdict.status}`;
    resultDetail.textContent = verdict.explanation;
    submit.disabled = false;
    submit.textContent = 'Check this key';
  });

  select.addEventListener('change', showTarget);
  showTarget();
}

if (typeof document !== 'undefined') initialize();
