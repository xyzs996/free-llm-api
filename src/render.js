import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTED_CTA_URL, renderClientPages } from './client-pages.js';
import { embedJson, escapeHtml, externalLink, joinInline } from './html.js';
import { dataSentence, localized, translator } from './i18n.js';
import { escapeMarkdown } from './markdown.js';
import { relativePrefix, renderLanguageSwitch } from './page-layout.js';
import {
  CLIENT_PAGE_TITLES as clientLabels,
  MODEL_FAMILIES,
  categoryTitle as titleForCategory,
  clientPageIds,
  renderMatrixPages,
} from './pages.js';
import { renderReadmeZh } from './readme-zh.js';
import { PROBE_CLASSIFICATIONS } from './probe-contract.js';
import { catalogDatasetNode, renderHead, renderSiteFiles, webSiteNode } from './seo.js';
import { DEFAULT_LOCALE, LOCALES, SITE_URL, localeDepth, localePath } from './site.js';
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

function renderReadme(providers, changelog) {
  const latestSourceCheck = providers
    .map(({ source_checked_at: checkedAt }) => checkedAt)
    .sort()
    .at(-1);
  const browserCheckable = providers.filter(({ browser_check: check }) => check === 'supported').length;
  const rows = providers.map((provider) => {
    const primarySource = provider.official_sources[0];
    const access = provider.signup_url ? `[Open](${provider.signup_url})` : 'Closed to new users';
    const limits = provider.limits.requests_per_day === null
      ? 'Dynamic / model-dependent'
      : `${provider.limits.requests_per_minute} RPM, ${provider.limits.requests_per_day} requests/day`;
    const lifecycle = provider.availability.retires_at
      ? `Retires ${provider.availability.retires_at}`
      : provider.availability.status;

    return `| [${escapeMarkdown(provider.name)}](${primarySource.url}) | ${escapeMarkdown(titleForCategory(provider.category))} | ${provider.credit_card_required ? 'Yes' : 'No'} | ${provider.openai_compatible ? 'Yes' : 'No'} | ${escapeMarkdown(limits)} | ${escapeMarkdown(lifecycle)} | ${access} |`;
  }).join('\n');

  return `# Free LLM API

English · [简体中文](README_zh.md)

A source-backed directory of free LLM API tiers: where to get your own API key from each provider, what the published limits actually are, and how to point a coding agent at one.

> Sources last reviewed: ${latestSourceCheck}. No keys are distributed here — every entry links to the provider's own signup. A probe describes one sampled request, not provider-wide uptime.

**[Status page](${SITE_URL}) · [Browser key checker](${SITE_URL}verify.html) · [Provider catalog](#provider-catalog) · [How this is checked](${SITE_URL}methodology.html)**

[![Filterable LLM free-tier status page](docs/assets/status-page.png)](${SITE_URL})

Star this repository to bookmark the dataset and follow releases. A star changes nothing about any provider's keys, credits, or limits, and this project gives nothing in return for one.

## Check a key you already have

Open the [browser key checker](${SITE_URL}verify.html). Nothing is installed and nothing is stored: the request goes from your browser straight to the provider, because the page's Content Security Policy allows connections to the ${connectSrcOrigins(providers).length} provider origins in this catalog and to nothing else — not to an analytics host, and not to this site.

${browserCheckable} of ${providers.length} providers answer a cross-origin browser request. The other ${providers.length - browserCheckable} refuse one, so the page prints the equivalent \`curl\` command instead of guessing.

## Point a coding agent at one

Point a coding agent at any endpoint you already have access to:

\`\`\`bash
npx free-llm-api setup claude-code
\`\`\`

Client guides: [Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [all clients](docs/clients.md).

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model. [Create a PekPik API account](${hostedCta}).

## Run locally

\`\`\`bash
npm run render && npm run serve
\`\`\`

Open \`http://127.0.0.1:4173\`. Node.js 20+ is required; there are no runtime dependencies and no API keys are needed.

${renderChangelogSection(providers, changelog)}## Provider catalog

| Provider | Free access type | Credit card | OpenAI compatible | Published limits | Lifecycle | Signup |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

Limits marked dynamic or model-dependent are intentionally not replaced with guessed numbers. Follow each provider link for the current official quota.

## Probe semantics

- \`200\`: the sampled request succeeded.
- \`401/403\`: only the sample credential was rejected.
- \`429\`: only the sample was rate-limited; the cause and remaining quota are unknown.
- \`5xx\` or a network error: the sampled endpoint had a reachability problem; this is not proof of a provider-wide outage.

Run probes explicitly outside CI. Keys are read only from the provider environment variable:

\`\`\`bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
\`\`\`

The default and only supported output is the ignored \`data/probe-output.json\`. It contains the classification, status, latency, and timestamp, never the key, response body, or raw exception. CI validates static data and never runs authenticated probes.

## Data

- \`data/providers.json\` is the reviewed source dataset.
- \`data/changelog.json\` records what changed each week; the newest week is rendered above.
- \`docs/providers.json\`, \`docs/index.html\`, and this README are generated deterministically by \`npm run render\`.
- Every provider entry includes official sources and a \`source_checked_at\` date. \`npm run validate\` fails when a quota is stated without one.

## Security

This repository contains no working credentials. Keep probe keys in environment variables and redact Authorization headers from reports. See [SECURITY.md](SECURITY.md).

## Related projects

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) combines your own provider keys behind one local endpoint with controlled failover.
`;
}

function renderPage(providers, families, locale = DEFAULT_LOCALE) {
  const t = translator(locale);
  const categories = [...new Set(providers.map(({ category }) => category))];
  const categoryOptions = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(t(`category.${category}`))}</option>`)
    .join('');
  const probeOptions = Object.values(PROBE_CLASSIFICATIONS)
    .map((classification) => `<option value="${classification}">${escapeHtml(t(`probe.${classification}`))}</option>`)
    .join('');
  const rows = providers.map((provider) => renderProviderRow(provider, t, locale)).join('\n');
  const embeddedData = embedJson(providers);
  const sourceDate = providers
    .map(({ source_checked_at: checkedAt }) => checkedAt)
    .sort()
    .at(-1);
  const title = t('home.title');
  const description = t('home.description');
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
    <div class="shell masthead__inner">
      <div>
        <p class="eyebrow">${escapeHtml(t('home.eyebrow', { date: sourceDate }))}</p>
        <h1>${escapeHtml(t('home.h1'))}</h1>
        <p class="lede">${escapeHtml(t('home.lede'))}</p>
        <p class="masthead__actions"><a href="./verify.html">${escapeHtml(t('home.verifyCta'))}</a></p>
      </div>
      <div class="masthead__stats" aria-label="${escapeHtml(t('home.statsLabel'))}">
        <div><strong>${providers.length}</strong><span>${escapeHtml(t('home.statProviders'))}</span></div>
        <div><strong>${providers.filter(({ openai_compatible: compatible }) => compatible).length}</strong><span>${escapeHtml(t('home.statCompatible'))}</span></div>
        <div><strong>${providers.filter(({ availability }) => availability.status === 'retiring').length}</strong><span>${escapeHtml(t('home.statRetiring'))}</span></div>
      </div>
    </div>
  </header>

  <main>
    <section class="filter-band" aria-labelledby="filter-heading">
      <div class="shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${escapeHtml(t('home.filterEyebrow'))}</p>
            <h2 id="filter-heading">${escapeHtml(t('home.filterHeading'))}</h2>
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

    <section class="browse-band" aria-labelledby="browse-heading">
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
        </div>
      </div>
    </section>

    <section class="method-band">
      <div class="shell method-grid">
        <div>
          <p class="eyebrow">${escapeHtml(t('home.methodEyebrow'))}</p>
          <h2>${escapeHtml(t('home.methodHeading'))}</h2>
        </div>
        <p>${t('home.methodBody')} <a href="./methodology.html">${escapeHtml(t('home.methodLink'))}</a>.</p>
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
    ...renderClientPages(providers),
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
