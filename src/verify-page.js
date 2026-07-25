import { keyEnvForProvider, renderSnippet } from './snippets.js';
import { verifyUrl } from '../docs/verify-contract.js';

// Kept in step with data/site.json by a test; the SEO task threads the whole
// site config through the renderer and this constant goes away then.
export const SITE_URL = 'https://xyzs996.github.io/free-llm-api/';

const PAGE_TITLE = 'Check a free LLM API key in your browser';
const PAGE_DESCRIPTION = 'Paste a key you already own and see whether the provider accepts it. '
  + 'The request goes straight from your browser to that provider; this site has no server to send it to.';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function connectSrcOrigins(providers) {
  return [...new Set(providers.map(({ base_url: baseUrl }) => new URL(baseUrl).origin))].sort();
}

// default-src 'none' means the only network destinations this document can
// reach are the ones listed here, and every one of them is a provider from the
// catalog. Neither this site's own origin nor any analytics host appears, so
// the browser itself enforces that a pasted key cannot come back to us.
export function contentSecurityPolicy(providers) {
  return [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    `connect-src ${connectSrcOrigins(providers).join(' ')}`,
    "form-action 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function verifyTargets(providers) {
  return providers.map((provider) => {
    const keyEnv = keyEnvForProvider(provider);
    return {
      id: provider.id,
      name: provider.name,
      origin: new URL(provider.base_url).origin,
      url: verifyUrl(provider.base_url),
      keyEnv,
      browserCheck: provider.browser_check,
      browserCheckNote: provider.browser_check_note,
      browserCheckedAt: provider.browser_checked_at,
      signupUrl: provider.signup_url,
      sources: provider.official_sources,
      // The fallback command names the environment variable and the endpoint
      // and nothing else, so a provider's display name never has to survive a
      // trip through shell syntax.
      curl: renderSnippet('curl', { baseUrl: provider.base_url, keyEnv }).content,
    };
  });
}

function renderOptions(targets, browserCheck) {
  return targets
    .filter((target) => (browserCheck === 'supported'
      ? target.browserCheck === 'supported'
      : target.browserCheck !== 'supported'))
    .map((target) => `<option value="${escapeHtml(target.id)}">${escapeHtml(target.name)}</option>`)
    .join('');
}

export function renderVerifyPage(providers) {
  const targets = verifyTargets(providers);
  const origins = connectSrcOrigins(providers);
  const checkable = targets.filter(({ browserCheck }) => browserCheck === 'supported');
  const embedded = JSON.stringify(targets).replaceAll('<', '\\u003c');
  const checkedAt = targets.map(({ browserCheckedAt }) => browserCheckedAt).sort().at(-1);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentSecurityPolicy(providers))}">
  <meta name="description" content="${escapeHtml(PAGE_DESCRIPTION)}">
  <title>${escapeHtml(PAGE_TITLE)} · Free LLM API</title>
  <link rel="canonical" href="${SITE_URL}verify.html">
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <header class="masthead">
    <div class="shell masthead__inner">
      <div>
        <p class="eyebrow">Browser key checker · Reachability measured ${escapeHtml(checkedAt)}</p>
        <h1>${escapeHtml(PAGE_TITLE)}</h1>
        <p class="lede">Bring a key you created yourself. Nothing is installed, nothing is stored, and the request never passes through this site.</p>
      </div>
      <div class="masthead__stats" aria-label="Checker summary">
        <div><strong>${checkable.length}</strong><span>reachable from a browser</span></div>
        <div><strong>${targets.length - checkable.length}</strong><span>need the terminal</span></div>
        <div><strong>0</strong><span>keys reach this site</span></div>
      </div>
    </div>
  </header>

  <main>
    <section class="verify-band" aria-labelledby="check-heading">
      <div class="shell verify-grid">
        <form class="verify-form" id="verify-form" autocomplete="off" novalidate>
          <h2 id="check-heading">Check a key</h2>
          <label>
            <span>Provider</span>
            <select id="provider-select" name="provider">
              <optgroup label="Checkable in a browser">${renderOptions(targets, 'supported')}</optgroup>
              <optgroup label="Terminal only">${renderOptions(targets, 'blocked')}</optgroup>
            </select>
          </label>
          <label>
            <span>Your API key</span>
            <input id="key-input" name="key" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Paste the key you created at the provider">
          </label>
          <button id="verify-submit" type="submit">Check this key</button>
          <p class="verify-endpoint">Request: <code>GET</code> <code id="verify-endpoint">${escapeHtml(checkable[0]?.url ?? '')}</code></p>
          <p class="verify-result" id="verify-result" data-tone="unknown" hidden>
            <strong id="result-label"></strong>
            <span id="result-detail"></span>
          </p>
          <noscript><p class="verify-note">This check runs entirely in your browser, so it needs JavaScript. The terminal command below does the same thing without it.</p></noscript>
        </form>

        <aside class="verify-side">
          <h2>Where your key goes</h2>
          <p>Exactly one place: the provider you picked. This page declares a Content Security Policy whose <code>connect-src</code> lists the ${origins.length} provider origins below and nothing else — no analytics host, and not this site's own domain. Your browser blocks any other destination before a request leaves it.</p>
          <ul class="origin-list">
${origins.map((origin) => `            <li><code>${escapeHtml(origin)}</code></li>`).join('\n')}
          </ul>
          <p>The key stays in one JavaScript variable for the length of one request. It is never written to <code>localStorage</code>, a cookie, or the address bar, and a key handed to this page in a query string is discarded and stripped from your history.</p>
          <p><a href="https://github.com/xyzs996/free-llm-api/blob/main/docs/verify.js" rel="noreferrer">Read the script that does it</a>.</p>
        </aside>
      </div>
    </section>

    <section class="method-band" aria-labelledby="provider-heading">
      <div class="shell">
        <h2 id="provider-heading">About this provider</h2>
        <p id="browser-note" class="browser-note"></p>
        <p>Set your key as <code id="verify-env"></code> and run this instead if the browser cannot reach the provider, or if you would rather not paste a key into a web page at all:</p>
        <pre class="verify-fallback"><code id="verify-fallback"></code></pre>
        <p class="provider-links">Official sources: <span id="provider-sources"></span></p>
        <p><a class="row-action" id="provider-signup" href="#" rel="noreferrer" hidden>Get a key from this provider</a></p>
      </div>
    </section>
  </main>

  <footer><div class="shell"><span>No key you type here is transmitted to, logged by, or stored on this site.</span><a href="./index.html">Back to the provider catalog</a></div></footer>
  <script id="verify-data" type="application/json">${embedded}</script>
  <script type="module" src="./verify.js"></script>
</body>
</html>
`;
}
