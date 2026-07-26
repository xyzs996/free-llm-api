import { embedJson, escapeHtml } from './html.js';
import { dataSentence, rawString, translator } from './i18n.js';
import { relativePrefix, renderLanguageSwitch } from './page-layout.js';
import { renderHead, webApplicationNode } from './seo.js';
import { DEFAULT_LOCALE, SITE_URL, localeDepth, localePath, pageUrl } from './site.js';
import { keyEnvForProvider, renderSnippet } from './snippets.js';
import { VERIFY_STATES, verifyUrl } from '../docs/verify-contract.js';

export { SITE_URL };

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

export function verifyTargets(providers, locale = DEFAULT_LOCALE) {
  return providers.map((provider) => {
    const keyEnv = keyEnvForProvider(provider);
    return {
      id: provider.id,
      name: provider.name,
      origin: new URL(provider.base_url).origin,
      url: verifyUrl(provider.base_url),
      keyEnv,
      browserCheck: provider.browser_check,
      browserCheckNote: dataSentence(provider.browser_check_note, locale),
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

// The strings the script writes into the page after it runs. They travel as
// data rather than as a second copy of the script, so both editions load the
// same `verify.js` and the verdict logic cannot drift between languages.
export function verifyStrings(locale = DEFAULT_LOCALE) {
  const t = translator(locale);
  const byState = (prefix) => Object.fromEntries(
    Object.values(VERIFY_STATES).map((state) => [state, t(`${prefix}.${state}`)]),
  );

  return {
    submit: t('verify.submit'),
    submitBlocked: t('verify.submitBlocked'),
    checking: t('verify.checking'),
    // The provider name is only known in the browser, so this one crosses as a
    // template rather than a finished sentence.
    asking: rawString('verify.asking', locale),
    labels: byState('verify.state'),
    explanations: byState('verify.explain'),
  };
}

function renderOptions(targets, browserCheck) {
  return targets
    .filter((target) => (browserCheck === 'supported'
      ? target.browserCheck === 'supported'
      : target.browserCheck !== 'supported'))
    .map((target) => `<option value="${escapeHtml(target.id)}">${escapeHtml(target.name)}</option>`)
    .join('');
}

export function renderVerifyPage(providers, locale = DEFAULT_LOCALE) {
  const t = translator(locale);
  const targets = verifyTargets(providers, locale);
  const origins = connectSrcOrigins(providers);
  const checkable = targets.filter(({ browserCheck }) => browserCheck === 'supported');
  const embedded = embedJson(targets);
  const checkedAt = targets.map(({ browserCheckedAt }) => browserCheckedAt).sort().at(-1);
  const title = `${t('verify.title')} · ${t('layout.brand')}`;
  const description = t('verify.description');
  const rootPrefix = relativePrefix(localeDepth(locale));

  return `<!doctype html>
<html lang="${escapeHtml(locale.hreflang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escapeHtml(contentSecurityPolicy(providers))}">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${rootPrefix}styles.css">${renderHead({
    path: localePath('verify.html', locale),
    title,
    description,
    locale,
    // The one page that must load nothing it does not control. The policy
    // above would block a beacon anyway; not emitting it is the honest half of
    // the same promise.
    analytics: false,
    jsonLd: [webApplicationNode({
      name: t('verify.appName'),
      description,
      url: pageUrl('verify.html', locale),
      features: [
        t('verify.feature1', { count: checkable.length }),
        t('verify.feature2'),
        t('verify.feature3'),
        t('verify.feature4'),
      ],
      locale,
    })],
  })}
</head>
<body>
  <header class="masthead">
    <div class="shell masthead__inner">
      <div>
        <p class="eyebrow">${escapeHtml(t('verify.eyebrow', { date: checkedAt }))}</p>
        <h1>${escapeHtml(t('verify.title'))}</h1>
        <p class="lede">${escapeHtml(t('verify.lede'))}</p>
      </div>
      <div class="masthead__stats" aria-label="${escapeHtml(t('verify.statsLabel'))}">
        <div><strong>${checkable.length}</strong><span>${escapeHtml(t('verify.statBrowser'))}</span></div>
        <div><strong>${targets.length - checkable.length}</strong><span>${escapeHtml(t('verify.statTerminal'))}</span></div>
        <div><strong>0</strong><span>${escapeHtml(t('verify.statZero'))}</span></div>
      </div>
    </div>
  </header>

  <main>
    <section class="verify-band" aria-labelledby="check-heading">
      <div class="shell verify-grid">
        <form class="verify-form" id="verify-form" autocomplete="off" novalidate>
          <h2 id="check-heading">${escapeHtml(t('verify.formHeading'))}</h2>
          <label>
            <span>${escapeHtml(t('verify.providerLabel'))}</span>
            <select id="provider-select" name="provider">
              <optgroup label="${escapeHtml(t('verify.groupBrowser'))}">${renderOptions(targets, 'supported')}</optgroup>
              <optgroup label="${escapeHtml(t('verify.groupTerminal'))}">${renderOptions(targets, 'blocked')}</optgroup>
            </select>
          </label>
          <label>
            <span>${escapeHtml(t('verify.keyLabel'))}</span>
            <input id="key-input" name="key" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${escapeHtml(t('verify.keyPlaceholder'))}">
          </label>
          <button id="verify-submit" type="submit">${escapeHtml(t('verify.submit'))}</button>
          <p class="verify-endpoint">${escapeHtml(t('verify.requestLabel'))} <code>GET</code> <code id="verify-endpoint">${escapeHtml(checkable[0]?.url ?? '')}</code></p>
          <p class="verify-result" id="verify-result" data-tone="unknown" hidden>
            <strong id="result-label"></strong>
            <span id="result-detail"></span>
          </p>
          <noscript><p class="verify-note">${escapeHtml(t('verify.noscript'))}</p></noscript>
        </form>

        <aside class="verify-side">
          <h2>${escapeHtml(t('verify.whereHeading'))}</h2>
          <p>${t('verify.whereBody', { count: origins.length })}</p>
          <ul class="origin-list">
${origins.map((origin) => `            <li><code>${escapeHtml(origin)}</code></li>`).join('\n')}
          </ul>
          <p>${t('verify.whereStorage')}</p>
          <p>${t('verify.whereThirdParty')}</p>
          <p><a href="https://github.com/xyzs996/free-llm-api/blob/main/docs/verify.js" rel="noreferrer">${escapeHtml(t('verify.readScript'))}</a>.</p>
        </aside>
      </div>
    </section>

    <section class="method-band" aria-labelledby="provider-heading">
      <div class="shell">
        <h2 id="provider-heading">${escapeHtml(t('verify.aboutHeading'))}</h2>
        <p id="browser-note" class="browser-note"></p>
        <p>${t('verify.fallbackIntro')}</p>
        <pre class="verify-fallback"><code id="verify-fallback"></code></pre>
        <p class="provider-links">${escapeHtml(t('verify.sourcesLabel'))} <span id="provider-sources"></span></p>
        <p><a class="row-action" id="provider-signup" href="#" rel="noreferrer" hidden>${escapeHtml(t('verify.signup'))}</a></p>
        <p class="provider-links">${escapeHtml(t('verify.readOn'))} <a href="./index.html">${escapeHtml(t('verify.readCatalog'))}</a><span aria-hidden="true"> · </span><a href="./methodology.html">${escapeHtml(t('verify.readMethodology'))}</a><span aria-hidden="true"> · </span><a href="./client/codex.html">${escapeHtml(t('verify.readClient'))}</a></p>
      </div>
    </section>
  </main>

  <footer><div class="shell"><span>${escapeHtml(t('verify.footerNote'))}</span><a href="./index.html">${escapeHtml(t('verify.footerLink'))}</a>${renderLanguageSwitch('verify.html', locale, rootPrefix)}</div></footer>
  <script id="verify-data" type="application/json">${embedded}</script>
  <script id="verify-strings" type="application/json">${embedJson(verifyStrings(locale))}</script>
  <script type="module" src="${rootPrefix}verify.js"></script>
</body>
</html>
`;
}
