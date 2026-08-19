import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBadgeEndpoints, renderBadges, starHistory } from './badges.js';
import { HOSTED_CTA_URL, renderClientPages } from './client-pages.js';
import { renderExamples } from './examples.js';
import { accessGroups, catalogSummary, quickPicks } from './growth.js';
import { embedJson, escapeHtml, externalLink, joinInline } from './html.js';
import { dataSentence, localized, translator } from './i18n.js';
import { escapeMarkdown } from './markdown.js';
import { relativePrefix, renderLanguageSwitch } from './page-layout.js';
import {
  CLIENT_PAGE_TITLES as clientLabels,
  MODEL_FAMILIES,
  categoryTitle as titleForCategory,
  clientPageIds,
  comparisonPageIds,
  renderMatrixPages,
} from './pages.js';
import { renderReadmeZh } from './readme-zh.js';
import { PROBE_CLASSIFICATIONS } from './probe-contract.js';
import { catalogDatasetNode, renderHead, renderSiteFiles, webSiteNode } from './seo.js';
import { DEFAULT_LOCALE, LOCALES, REPO_URL, SITE_URL, localeDepth, localePath } from './site.js';
import { CHANGELOG_CHANGE_LABELS, isLandingPageEligible } from './validate.js';
import { connectSrcOrigins, renderVerifyPage } from './verify-page.js';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostedCta = HOSTED_CTA_URL;

function renderSources(sources) {
  return joinInline(sources.map(({ title, url }) => externalLink(url, title)));
}

function renderProviderRow(provider, t, locale) {
  const retirement = provider.availability.retires_at
    ? `\n              <span class="retirement">${t('home.rowRetires', { date: escapeHtml(provider.availability.retires_at) })}</span>`
    : '';
  const signup = provider.signup_url
    ? `<a class="row-action" href="${escapeHtml(provider.signup_url)}" rel="noreferrer">${escapeHtml(t('home.rowSignup'))}</a>`
    : `<span class="closed-label">${escapeHtml(t('home.rowClosed'))}</span>`;
  const quota = [
    provider.limits.requests_per_minute === null
      ? null
      : t('home.rowRpm', { count: provider.limits.requests_per_minute }),
    provider.limits.requests_per_day === null
      ? null
      : t('home.rowRpd', { count: provider.limits.requests_per_day }),
  ].filter(Boolean).join(' · ');

  // A provider without a detail page keeps the plain name rather than a link
  // to a page that was deliberately not generated.
  const heading = isLandingPageEligible(provider)
    ? `<a href="./provider/${escapeHtml(provider.id)}.html">${escapeHtml(provider.name)}</a>`
    : escapeHtml(provider.name);

  return `          <tr data-provider-id="${escapeHtml(provider.id)}">
            <td data-label="${escapeHtml(t('home.colProvider'))}">
              <strong>${heading}</strong>
              <span class="provider-meta">${escapeHtml(provider.base_url)}</span>${retirement}
            </td>
            <td data-label="${escapeHtml(t('home.colAccess'))}">${escapeHtml(t(`category.${provider.category}`))}</td>
            <td data-label="${escapeHtml(t('home.cellCard'))}">${escapeHtml(t(provider.credit_card_required ? 'word.required' : 'word.notRequired'))}</td>
            <td data-label="${escapeHtml(t('home.cellOpenAi'))}">${escapeHtml(t(provider.openai_compatible ? 'word.yes' : 'word.no'))}</td>
            <td data-label="${escapeHtml(t('home.colLimits'))}">
              ${quota ? `<strong class="quota">${escapeHtml(quota)}</strong>` : `<strong class="quota">${escapeHtml(t('home.rowUnknown'))}</strong>`}
              <span class="cell-detail">${escapeHtml(localized(provider.limits, 'summary', locale))}</span>
            </td>
            <td data-label="${escapeHtml(t('home.cellProbe'))}">
              <span class="probe probe--${escapeHtml(provider.probe.classification)}">${escapeHtml(t(`probe.${provider.probe.classification}`))}</span>
              <span class="cell-detail">${escapeHtml(dataSentence(provider.probe.explanation, locale))}</span>
            </td>
            <td data-label="${escapeHtml(t('home.colChecked'))}">
              <time datetime="${escapeHtml(provider.source_checked_at)}">${escapeHtml(provider.source_checked_at)}</time>
              <span class="source-links">${renderSources(provider.official_sources)}</span>
            </td>
            <td data-label="${escapeHtml(t('home.colSignup'))}">${signup}</td>
          </tr>`;
}

const GROUPED_CHANGE_THRESHOLD = 3;

function renderChangelogSection(providers, changelog) {
  const week = changelog?.weeks?.[0];
  if (!week) return '';

  const nameFor = (id) => providers.find((provider) => provider.id === id)?.name ?? id;
  const groups = new Map();
  for (const change of week.changes) {
    if (!groups.has(change.type)) groups.set(change.type, []);
    groups.get(change.type).push(change);
  }

  const bullets = [...groups].flatMap(([type, changes]) => {
    const label = CHANGELOG_CHANGE_LABELS[type] ?? type;
    if (changes.length > GROUPED_CHANGE_THRESHOLD) {
      const names = changes.map(({ provider_id: id }) => escapeMarkdown(nameFor(id))).join(', ');
      return [`- **${label} (${changes.length}):** ${names}`];
    }
    return changes.map(({ provider_id: id, detail }) => (
      `- **${label} — ${escapeMarkdown(nameFor(id))}:** ${escapeMarkdown(detail)}`
    ));
  });

  return `## Changed this week

Week of ${week.week_of}. ${escapeMarkdown(week.summary)}

${bullets.join('\n')}

Every entry above is dated and sourced in the catalog below. Full history: [\`data/changelog.json\`](data/changelog.json).

`;
}

function readmeLimits(provider, separator = ', ') {
  const values = [
    provider.limits.requests_per_minute === null
      ? null
      : `${provider.limits.requests_per_minute.toLocaleString('en-US')} RPM`,
    provider.limits.requests_per_day === null
      ? null
      : `${provider.limits.requests_per_day.toLocaleString('en-US')} requests/day`,
  ].filter(Boolean);

  return values.join(separator) || 'Dynamic / model-dependent';
}

function readmeModels(provider) {
  return provider.models
    .slice(0, 3)
    .map((model) => escapeMarkdown(model))
    .join('<br>');
}

function renderReadmeRows(providers, { includeType = false } = {}) {
  return providers.map((provider) => {
    const source = provider.official_sources[0];
    const detail = isLandingPageEligible(provider)
      ? `${SITE_URL}provider/${provider.id}.html`
      : source.url;
    const access = provider.signup_url ? `[Open](${provider.signup_url})` : 'Closed to new users';
    const type = provider.availability.retires_at
      ? `${titleForCategory(provider.category)}<br>Retires ${provider.availability.retires_at}`
      : titleForCategory(provider.category);
    const cells = [
      `[${escapeMarkdown(provider.name)}](${detail})`,
      readmeModels(provider),
      `[${escapeMarkdown(readmeLimits(provider))}](${source.url})`,
      provider.credit_card_required ? 'Required' : 'Not required',
      provider.openai_compatible ? 'Yes' : 'No',
      access,
    ];
    if (includeType) cells.splice(1, 0, type);
    return `| ${cells.join(' | ')} |`;
  }).join('\n');
}

const QUICK_PICK_LABELS = Object.freeze({
  'highest-daily-limit': 'Highest published daily request limit',
  'highest-rpm': 'Highest published requests per minute',
  'browser-ready': 'Works with the browser key checker',
  'coding-agents': 'Fast path for coding agents',
});

function renderReadmeQuickPicks(providers) {
  return quickPicks(providers).map(({ id, provider, reason }) => {
    const detail = `${SITE_URL}provider/${provider.id}.html`;
    const signup = provider.signup_url ? `[Get API key](${provider.signup_url})` : 'Closed';
    return `| ${QUICK_PICK_LABELS[id]} | [${escapeMarkdown(provider.name)}](${detail}) | ${escapeMarkdown(reason)} | ${signup} |`;
  }).join('\n');
}

function renderReadme(providers, changelog) {
  const summary = catalogSummary(providers);
  const groups = accessGroups(providers);
  const browserCheckable = providers.filter(({ browser_check: check }) => check === 'supported').length;
  const badges = renderBadges(
    {
      ci: 'CI',
      license: 'License: MIT',
      providers: 'providers',
      checked: 'sources checked',
    },
    { home: SITE_URL, methodology: `${SITE_URL}methodology.html` },
  );
  const stars = starHistory();

  return `# Free LLM APIs

English · [简体中文](README_zh.md)

${badges}

Permanent free tiers, no-card options, direct API key links, models, and verified limits — every claim points to an official source.

> ${summary.permanentFree} permanent provider free tiers · ${summary.noCardPermanentFree} require no credit card · ${summary.openAiCompatiblePermanentFree} are OpenAI compatible · sources reviewed ${summary.latestReview}. No keys are distributed here. A probe describes one sampled request, not provider-wide uptime.

**[Browse the live directory](${SITE_URL}) · [Pick by model](${SITE_URL}#browse) · [Set up a coding agent](docs/clients.md) · [Check your own key](${SITE_URL}verify.html)**

[![Filterable LLM free-tier status page](docs/assets/status-page.png)](${SITE_URL})

Star this repository to bookmark the dataset and follow releases. A star changes nothing about any provider's keys, credits, or limits, and this project gives nothing in return for one.

## Pick a free API by goal

| Goal | Pick | Why it appears here | Start |
| --- | --- | --- | --- |
${renderReadmeQuickPicks(providers)}

These are rule-based shortcuts, not paid placements. Open the [filterable directory](${SITE_URL}) for all ${providers.length} providers.

## Permanent free tiers

These Provider Free Tiers are the main list: they do not expire like trial credits, and none currently require a credit card.

| Provider | Models | Published limits | Card | OpenAI compatible | Get API key |
| --- | --- | --- | --- | --- | --- |
${renderReadmeRows(groups.permanent)}

## Other access options

These entries can still be useful, but they are aggregators, trial credits, retiring tiers, or metered services — not permanent Provider Free Tiers.

| Provider | Access type | Models | Published limits | Card | OpenAI compatible | Get API key |
| --- | --- | --- | --- | --- | --- | --- |
${renderReadmeRows(groups.other, { includeType: true })}

Limits marked dynamic or model-dependent are intentionally not replaced with guessed numbers. Follow the linked official source for the current quota.

## Quick start

After creating your own Groq API key, the OpenAI SDK needs only a different Base URL and model id:

\`\`\`python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Say hello in one sentence."}],
)
print(response.choices[0].message.content)
\`\`\`

For coding agents, generate a client-specific configuration that reads the key from your environment:

\`\`\`bash
npx free-llm-api setup claude-code
\`\`\`

Client guides: [Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [all clients](docs/clients.md).

## Check a key you already have

Open the [browser key checker](${SITE_URL}verify.html). Nothing is installed or stored: the request goes from your browser straight to the chosen provider. Its Content Security Policy allows the ${connectSrcOrigins(providers).length} catalog origins and no analytics or project server. ${browserCheckable} providers answer cross-origin browser requests; blocked providers get an equivalent \`curl\` command.

## Why trust this list

- Every limit and lifecycle claim links to an official source and carries a review date.
- Trial credit, metered access, aggregators, and retiring tiers are separated from permanent free tiers.
- No working API keys are stored or distributed. Use environment variables for your own credentials.
- A probe describes one sampled request, not provider-wide uptime. A \`429\` does not reveal the key's remaining quota.

Run probes explicitly outside CI. Keys are read only from the provider environment variable:

\`\`\`bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
\`\`\`

The ignored \`data/probe-output.json\` contains only a bounded classification, status, latency, and timestamp — never the key, response body, or raw exception. Read the full [methodology](${SITE_URL}methodology.html).

${renderChangelogSection(providers, changelog)}## Contributing

Corrections are the contribution this project runs on: a limit that moved, a provider that closed signups, or a link that died. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [issue templates](${REPO_URL}/issues/new/choose).

## Data and local development

- \`data/providers.json\` is the reviewed source dataset.
- \`data/changelog.json\` records weekly changes.
- \`README.md\`, \`docs/providers.json\`, and the static pages are generated deterministically.
- \`npm run validate\` rejects stated quotas without an official source.

Run the generated site locally:

\`\`\`bash
npm run render && npm run serve
\`\`\`

Open \`http://127.0.0.1:4173\`. Node.js 20+ is required; there are no runtime dependencies and no API keys are needed.

## Security

This repository contains no working credentials. Keep probe keys in environment variables and redact Authorization headers from reports. See [SECURITY.md](SECURITY.md).

## Star history

[![Star History Chart](${stars.image})](${stars.link})

## Related projects

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) combines your own provider keys behind one local endpoint with controlled failover.
- [AI Coding Field Notes](https://github.com/xyzs996/ai-coding-field-notes) is a write-up collection on what coding agents actually cost, where they break, and what shipped.

## Need one stable endpoint?

If rotating free-tier keys and handling different limits becomes the work, [create a PekPik API account](${hostedCta}) for one OpenAI-compatible hosted endpoint. The free directory above remains usable without it.
`;
}

function renderHomePickCards(providers, t) {
  return quickPicks(providers).map(({ id, provider }) => {
    const count = id === 'highest-daily-limit'
      ? provider.limits.requests_per_day.toLocaleString('en-US')
      : id === 'highest-rpm'
        ? provider.limits.requests_per_minute.toLocaleString('en-US')
        : '';
    const signup = provider.signup_url
      ? `<a class="pick-card__signup" href="${escapeHtml(provider.signup_url)}" rel="noreferrer">${escapeHtml(t('home.pickSignup'))}</a>`
      : '';

    return `          <article class="pick-card">
            <p class="pick-card__label">${escapeHtml(t(`home.pick.${id}.label`))}</p>
            <h3>${escapeHtml(provider.name)}</h3>
            <p>${escapeHtml(t(`home.pick.${id}.reason`, { count }))}</p>
            <div class="pick-card__actions">
              <a href="./provider/${escapeHtml(provider.id)}.html">${escapeHtml(t('home.pickDetails'))}</a>
              ${signup}
            </div>
          </article>`;
  }).join('\n');
}

function renderPage(providers, families, locale = DEFAULT_LOCALE) {
  const t = translator(locale);
  const summary = catalogSummary(providers);
  const categories = [...new Set(providers.map(({ category }) => category))];
  const categoryOptions = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(t(`category.${category}`))}</option>`)
    .join('');
  const probeOptions = Object.values(PROBE_CLASSIFICATIONS)
    .map((classification) => `<option value="${classification}">${escapeHtml(t(`probe.${classification}`))}</option>`)
    .join('');
  const rows = providers.map((provider) => renderProviderRow(provider, t, locale)).join('\n');
  const embeddedData = embedJson(providers);
  const sourceDate = summary.latestReview;
  const title = t('home.title');
  const description = t('home.description');
  const quickStartCode = `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)`;
  // The catalog is the one page that lives at a directory root rather than in a
  // section, so its own links stay flat while the shared assets it loads move up
  // by however deep the locale sits.
  const rootPrefix = relativePrefix(localeDepth(locale));

  return `<!doctype html>
<html lang="${escapeHtml(locale.hreflang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${rootPrefix}styles.css">${renderHead({
    path: localePath('', locale),
    title,
    description,
    locale,
    jsonLd: [
      webSiteNode(description),
      catalogDatasetNode({
        description: t('home.datasetDescription', { count: providers.length }),
        checkedAt: sourceDate,
        providerCount: providers.length,
        locale,
      }),
    ],
  })}
</head>
<body>
  <header class="masthead">
    <nav class="site-nav" aria-label="${escapeHtml(t('home.brand'))}">
      <a class="site-nav__brand" href="./index.html">${escapeHtml(t('home.brand'))}</a>
      <div class="site-nav__links">
        <a href="#directory">${escapeHtml(t('home.navDirectory'))}</a>
        <a href="#browse">${escapeHtml(t('home.navModels'))}</a>
        <a href="./client/claude-code.html">${escapeHtml(t('home.navClients'))}</a>
        <a href="./verify.html">${escapeHtml(t('home.navVerify'))}</a>
        <a href="${escapeHtml(REPO_URL)}">${escapeHtml(t('home.navGithub'))}</a>
      </div>
    </nav>
    <div class="shell masthead__inner">
      <div>
        <p class="eyebrow">${escapeHtml(t('home.eyebrow', { date: sourceDate }))}</p>
        <h1>${escapeHtml(t('home.h1'))}</h1>
        <p class="lede">${escapeHtml(t('home.lede'))}</p>
        <div class="hero-actions">
          <a class="button button--primary" href="#directory">${escapeHtml(t('home.primaryCta'))}</a>
          <a class="button button--secondary" href="#pick-by-goal">${escapeHtml(t('home.secondaryCta'))}</a>
          <a class="hero-actions__link" href="./verify.html">${escapeHtml(t('home.verifyCta'))}</a>
        </div>
      </div>
      <div class="masthead__stats" aria-label="${escapeHtml(t('home.statsLabel'))}">
        <div><strong>${summary.permanentFree}</strong><span>${escapeHtml(t('home.statPermanent'))}</span></div>
        <div><strong>${summary.noCardPermanentFree}</strong><span>${escapeHtml(t('home.statNoCard'))}</span></div>
        <div><strong>${summary.openAiCompatiblePermanentFree}</strong><span>${escapeHtml(t('home.statCompatible'))}</span></div>
        <div><strong>${summary.latestReview}</strong><span>${escapeHtml(t('home.statReviewed'))}</span></div>
      </div>
    </div>
  </header>

  <main>
    <section class="goal-band" id="pick-by-goal" aria-labelledby="goal-heading">
      <div class="shell">
        <div class="section-heading section-heading--stacked">
          <p class="eyebrow">${escapeHtml(t('home.goalEyebrow'))}</p>
          <h2 id="goal-heading">${escapeHtml(t('home.goalHeading'))}</h2>
          <p>${escapeHtml(t('home.goalLede'))}</p>
        </div>
        <div class="goal-grid">
          <a class="goal-card" href="./index.html?creditCard=not-required#directory"><strong>${escapeHtml(t('home.goalNoCard'))}</strong><span>${escapeHtml(t('home.goalNoCardBody'))}</span></a>
          <a class="goal-card" href="./index.html?openaiCompatible=yes#directory"><strong>${escapeHtml(t('home.goalOpenAi'))}</strong><span>${escapeHtml(t('home.goalOpenAiBody'))}</span></a>
          <a class="goal-card" href="#best-free-picks"><strong>${escapeHtml(t('home.goalLimits'))}</strong><span>${escapeHtml(t('home.goalLimitsBody'))}</span></a>
          <a class="goal-card" href="./client/claude-code.html"><strong>${escapeHtml(t('home.goalCoding'))}</strong><span>${escapeHtml(t('home.goalCodingBody'))}</span></a>
          <a class="goal-card" href="#browse"><strong>${escapeHtml(t('home.goalModels'))}</strong><span>${escapeHtml(t('home.goalModelsBody'))}</span></a>
          <a class="goal-card" href="./verify.html"><strong>${escapeHtml(t('home.goalBrowser'))}</strong><span>${escapeHtml(t('home.goalBrowserBody'))}</span></a>
        </div>
      </div>
    </section>

    <section class="pick-band" id="best-free-picks" aria-labelledby="pick-heading">
      <div class="shell">
        <div class="section-heading section-heading--stacked">
          <p class="eyebrow">${escapeHtml(t('home.pickEyebrow'))}</p>
          <h2 id="pick-heading">${escapeHtml(t('home.pickHeading'))}</h2>
          <p>${escapeHtml(t('home.pickLede'))}</p>
        </div>
        <div class="pick-grid">
${renderHomePickCards(providers, t)}
        </div>
      </div>
    </section>

    <section class="filter-band" id="directory" aria-labelledby="filter-heading">
      <div class="shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(t('home.filterEyebrow'))}</p>
            <h2 id="filter-heading">${escapeHtml(t('home.filterHeading'))}</h2>
            <p class="section-lede">${escapeHtml(t('home.filterLede'))}</p>
          </div>
          <p><strong id="provider-count">${providers.length}</strong> ${escapeHtml(t('home.matches'))}</p>
        </div>
        <form class="filters" id="provider-filters">
          <label class="search-control">
            <span>${escapeHtml(t('home.searchLabel'))}</span>
            <input id="search-filter" name="query" type="search" placeholder="${escapeHtml(t('home.searchPlaceholder'))}" autocomplete="off">
          </label>
          <label>
            <span>${escapeHtml(t('home.categoryLabel'))}</span>
            <select id="category-filter" name="category"><option value="all">${escapeHtml(t('home.allTypes'))}</option>${categoryOptions}</select>
          </label>
          <label>
            <span>${escapeHtml(t('home.cardLabel'))}</span>
            <select id="card-filter" name="creditCard"><option value="all">${escapeHtml(t('word.any'))}</option><option value="not-required">${escapeHtml(t('word.notRequired'))}</option><option value="required">${escapeHtml(t('word.required'))}</option></select>
          </label>
          <label>
            <span>${escapeHtml(t('home.compatibilityLabel'))}</span>
            <select id="compatibility-filter" name="openaiCompatible"><option value="all">${escapeHtml(t('word.any'))}</option><option value="yes">${escapeHtml(t('word.yes'))}</option><option value="no">${escapeHtml(t('word.no'))}</option></select>
          </label>
          <label>
            <span>${escapeHtml(t('home.probeLabel'))}</span>
            <select id="probe-filter" name="probe"><option value="all">${escapeHtml(t('home.anyState'))}</option>${probeOptions}</select>
          </label>
        </form>
      </div>
    </section>

    <section class="table-band" aria-label="${escapeHtml(t('home.tableLabel'))}">
      <div class="shell shell--wide">
        <div class="table-wrap">
          <table id="provider-table">
            <thead><tr><th>${escapeHtml(t('home.colProvider'))}</th><th>${escapeHtml(t('home.colAccess'))}</th><th>${escapeHtml(t('home.colCard'))}</th><th>${escapeHtml(t('home.colOpenAi'))}</th><th>${escapeHtml(t('home.colLimits'))}</th><th>${escapeHtml(t('home.colProbe'))}</th><th>${escapeHtml(t('home.colChecked'))}</th><th>${escapeHtml(t('home.colSignup'))}</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
          <p id="empty-state" class="empty-state" hidden>${escapeHtml(t('home.emptyState'))}</p>
        </div>
      </div>
    </section>

    <section class="browse-band" id="browse" aria-labelledby="browse-heading">
      <div class="shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(t('home.browseEyebrow'))}</p>
            <h2 id="browse-heading">${escapeHtml(t('home.browseHeading'))}</h2>
          </div>
        </div>
        <div class="browse-grid">
          <div>
            <h3>${escapeHtml(t('home.browseFamilies'))}</h3>
            <ul>
${families.map((family) => `              <li><a href="./model/${escapeHtml(family.id)}.html">${escapeHtml(t('layout.familyLink', { name: localized(family, 'name', locale) }))}</a></li>`).join('\n')}
            </ul>
          </div>
          <div>
            <h3>${escapeHtml(t('home.browseClients'))}</h3>
            <ul>
${clientPageIds.map((id) => `              <li><a href="./client/${escapeHtml(id)}.html">${escapeHtml(clientLabels[id])}</a></li>`).join('\n')}
            </ul>
          </div>
          <div>
            <h3>${escapeHtml(t('home.browseData'))}</h3>
            <ul>
              <li><a href="./methodology.html">${escapeHtml(t('layout.methodologyLink'))}</a></li>
              <li><a href="./verify.html">${escapeHtml(t('home.checkInBrowser'))}</a></li>
              <li><a href="${rootPrefix}providers.json">${escapeHtml(t('home.rawJson'))}</a></li>
            </ul>
          </div>
          <div>
            <h3>${escapeHtml(t('home.browseComparisons'))}</h3>
            <ul>
${comparisonPageIds.map((id) => `              <li><a href="./compare/${escapeHtml(id)}.html">${escapeHtml(t(`comparison.${id}.link`))}</a></li>`).join('\n')}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="quick-start-band" id="quick-start" aria-labelledby="quick-start-heading">
      <div class="shell quick-start-grid">
        <div>
          <p class="eyebrow">${escapeHtml(t('home.quickEyebrow'))}</p>
          <h2 id="quick-start-heading">${escapeHtml(t('home.quickHeading'))}</h2>
          <p>${escapeHtml(t('home.quickBody'))}</p>
          <a class="button button--secondary-dark" href="./client/claude-code.html">${escapeHtml(t('home.quickClient'))}</a>
        </div>
        <pre class="quick-start-code"><code>${escapeHtml(quickStartCode)}</code></pre>
      </div>
    </section>

    <section class="trust-band" id="trust" aria-labelledby="trust-heading">
      <div class="shell">
        <div class="section-heading section-heading--stacked">
          <p class="eyebrow">${escapeHtml(t('home.trustEyebrow'))}</p>
          <h2 id="trust-heading">${escapeHtml(t('home.trustHeading'))}</h2>
        </div>
        <div class="trust-grid">
          <article><h3>${escapeHtml(t('home.trustSources'))}</h3><p>${escapeHtml(t('home.trustSourcesBody'))}</p></article>
          <article><h3>${escapeHtml(t('home.trustDates'))}</h3><p>${escapeHtml(t('home.trustDatesBody'))}</p></article>
          <article><h3>${escapeHtml(t('home.trustBoundaries'))}</h3><p>${escapeHtml(t('home.trustBoundariesBody'))}</p></article>
        </div>
      </div>
    </section>

    <section class="method-band">
      <div class="shell method-grid">
        <div>
          <p class="eyebrow">${escapeHtml(t('home.methodEyebrow'))}</p>
          <h2>${escapeHtml(t('home.methodHeading'))}</h2>
        </div>
        <p>${escapeHtml(t('home.methodBody'))} <a href="${escapeHtml(REPO_URL)}/blob/main/CONTRIBUTING.md">${escapeHtml(t('home.methodLink'))}</a>.</p>
        <p>${escapeHtml(t('home.relatedLead'))} <a href="https://github.com/xyzs996/ai-coding-field-notes">${escapeHtml(t('home.relatedLink'))}</a>.</p>
        <a class="hosted-cta" href="${escapeHtml(hostedCta)}">${escapeHtml(t('home.hostedCta'))}</a>
      </div>
    </section>
  </main>

  <footer><div class="shell"><span>${escapeHtml(t('home.footerNote'))}</span><a href="${escapeHtml(t('home.footerHref'))}">${escapeHtml(t('home.footerLink'))}</a>${renderLanguageSwitch('index.html', locale, rootPrefix)}</div></footer>
  <script id="provider-data" type="application/json">${embeddedData}</script>
  <script type="module" src="${rootPrefix}app.js"></script>
</body>
</html>
`;
}

export function renderArtifacts(providers, changelog = null, families = MODEL_FAMILIES) {
  const artifacts = {
    'README.md': renderReadme(providers, changelog),
    'README_zh.md': renderReadmeZh(providers, changelog),
    'docs/providers.json': `${JSON.stringify(providers, null, 2)}\n`,
    ...renderBadgeEndpoints(providers),
    ...renderClientPages(providers),
    // Generated for the same reason the README is: an example that drifts from
    // the endpoint it names is worse than no example.
    ...renderExamples(providers),
  };

  // Every locale gets the same page set, because the hreflang links promise a
  // translation of each page rather than a smaller site in another language.
  // Missing a page here would advertise an address that returns a 404.
  for (const locale of LOCALES) {
    const directory = `docs/${locale.path_prefix}`;
    artifacts[`${directory}index.html`] = renderPage(providers, families, locale);
    artifacts[`${directory}verify.html`] = renderVerifyPage(providers, locale);
    Object.assign(artifacts, renderMatrixPages(providers, families, locale));
  }

  // Derived last and from the artifacts themselves, so the sitemap lists every
  // page that exists and no page that does not.
  return { ...artifacts, ...renderSiteFiles(providers, artifacts) };
}

export async function writeArtifacts(providers, changelog = null, destination = rootDirectory) {
  const artifacts = renderArtifacts(providers, changelog);

  for (const [relativePath, content] of Object.entries(artifacts)) {
    const outputPath = resolve(destination, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, 'utf8');
  }
}

export async function findStaleArtifacts(artifacts, root = rootDirectory) {
  const stale = [];

  for (const [relativePath, expected] of Object.entries(artifacts)) {
    const actual = await readFile(resolve(root, relativePath), 'utf8').catch(() => null);
    if (actual !== expected) stale.push(relativePath);
  }

  return stale;
}

export async function loadRenderInput(root = rootDirectory) {
  const [providers, changelog] = await Promise.all([
    readFile(resolve(root, 'data/providers.json'), 'utf8').then(JSON.parse),
    readFile(resolve(root, 'data/changelog.json'), 'utf8').then(JSON.parse),
  ]);
  return { providers, changelog };
}

async function main(argv) {
  const checkOnly = argv.includes('--check');
  const unknown = argv.filter((argument) => argument !== '--check');
  if (unknown.length > 0) {
    process.stderr.write(`Unknown render option: ${unknown[0]}\nUsage: node src/render.js [--check]\n`);
    process.exitCode = 1;
    return;
  }

  const { providers, changelog } = await loadRenderInput();
  const artifacts = renderArtifacts(providers, changelog);
  const artifactCount = Object.keys(artifacts).length;

  if (checkOnly) {
    const stale = await findStaleArtifacts(artifacts);
    if (stale.length > 0) {
      const lines = stale.map((relativePath) => `- ${relativePath}`).join('\n');
      process.stderr.write(`Generated files no longer match data/. Run npm run render.\n${lines}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`Checked ${artifactCount} artifacts; every one matches data/.\n`);
    return;
  }

  await writeArtifacts(providers, changelog);
  process.stdout.write(`Rendered ${artifactCount} artifacts.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
