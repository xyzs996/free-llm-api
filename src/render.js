import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTED_CTA_URL, renderClientPages } from './client-pages.js';
import { escapeMarkdown } from './markdown.js';
import { renderReadmeZh } from './readme-zh.js';
import {
  PROBE_CLASSIFICATIONS,
  PROBE_CLASSIFICATION_LABELS,
} from './probe-contract.js';
import { CHANGELOG_CHANGE_LABELS } from './validate.js';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostedCta = HOSTED_CTA_URL;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleForCategory(category) {
  return {
    'provider-free-tier': 'Provider free tier',
    'free-model-aggregator': 'Free model aggregator',
    'trial-credit': 'Free trial credit',
    'metered-access': 'Metered access',
    'retiring-free-tier': 'Retiring free tier',
  }[category] ?? category;
}

function renderSources(sources) {
  return sources
    .map(({ title, url }) => `<a href="${escapeHtml(url)}" rel="noreferrer">${escapeHtml(title)}</a>`)
    .join('<span aria-hidden="true"> · </span>');
}

function renderProviderRow(provider) {
  const retirement = provider.availability.retires_at
    ? `\n              <span class="retirement">Retires ${escapeHtml(provider.availability.retires_at)}</span>`
    : '';
  const signup = provider.signup_url
    ? `<a class="row-action" href="${escapeHtml(provider.signup_url)}" rel="noreferrer">Get API access</a>`
    : '<span class="closed-label">New access closed</span>';
  const quota = [
    provider.limits.requests_per_minute === null
      ? null
      : `${provider.limits.requests_per_minute} RPM`,
    provider.limits.requests_per_day === null
      ? null
      : `${provider.limits.requests_per_day} requests/day`,
  ].filter(Boolean).join(' · ');

  return `          <tr data-provider-id="${escapeHtml(provider.id)}">
            <td data-label="Provider">
              <strong>${escapeHtml(provider.name)}</strong>
              <span class="provider-meta">${escapeHtml(provider.base_url)}</span>${retirement}
            </td>
            <td data-label="Free access">${escapeHtml(titleForCategory(provider.category))}</td>
            <td data-label="Credit card">${provider.credit_card_required ? 'Required' : 'Not required'}</td>
            <td data-label="OpenAI compatible">${provider.openai_compatible ? 'Yes' : 'No'}</td>
            <td data-label="Limits">
              ${quota ? `<strong class="quota">${escapeHtml(quota)}</strong>` : '<strong class="quota">Dynamic / unknown</strong>'}
              <span class="cell-detail">${escapeHtml(provider.limits.summary)}</span>
            </td>
            <td data-label="Probe">
              <span class="probe probe--${escapeHtml(provider.probe.classification)}">${escapeHtml(provider.probe.classification)}</span>
              <span class="cell-detail">${escapeHtml(provider.probe.explanation)}</span>
            </td>
            <td data-label="Sources checked">
              <time datetime="${escapeHtml(provider.source_checked_at)}">${escapeHtml(provider.source_checked_at)}</time>
              <span class="source-links">${renderSources(provider.official_sources)}</span>
            </td>
            <td data-label="Access">${signup}</td>
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

A source-backed list of free LLM API keys and free tiers, with explainable sample probes, a filterable status page, and one-command setup for coding agents.

> Sources last reviewed: ${latestSourceCheck}. A probe describes one sampled request, not provider-wide uptime.

${renderChangelogSection(providers, changelog)}## Run locally

\`\`\`bash
npm run render && npm run serve
\`\`\`

Open \`http://127.0.0.1:4173\`. Node.js 20+ is required; there are no runtime dependencies and no API keys are needed.

Point a coding agent at any endpoint you already have access to:

\`\`\`bash
npx free-llm-api setup claude-code
\`\`\`

Client guides: [Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [all clients](docs/clients.md).

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model. [Create a PekPik API account](${hostedCta}).

Star this repository to bookmark the dataset and follow releases. A star changes nothing about any provider's keys, credits, or limits, and this project gives nothing in return for one.

![Filterable LLM free-tier status page](docs/assets/status-page.png)

## Provider catalog

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

function renderPage(providers) {
  const categories = [...new Set(providers.map(({ category }) => category))];
  const categoryOptions = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(titleForCategory(category))}</option>`)
    .join('');
  const probeOptions = Object.values(PROBE_CLASSIFICATIONS)
    .map((classification) => `<option value="${classification}">${PROBE_CLASSIFICATION_LABELS[classification]}</option>`)
    .join('');
  const rows = providers.map(renderProviderRow).join('\n');
  const embeddedData = JSON.stringify(providers).replaceAll('<', '\\u003c');
  const sourceDate = providers
    .map(({ source_checked_at: checkedAt }) => checkedAt)
    .sort()
    .at(-1);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Source-backed free LLM API limits, compatibility, lifecycle, and explainable sample probe status.">
  <title>Free LLM API</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <header class="masthead">
    <div class="shell masthead__inner">
      <div>
        <p class="eyebrow">Verified provider facts · Reviewed ${escapeHtml(sourceDate)}</p>
        <h1>Free LLM API</h1>
        <p class="lede">Compare official free-access terms without treating one sample key as an uptime monitor.</p>
      </div>
      <div class="masthead__stats" aria-label="Catalog summary">
        <div><strong>${providers.length}</strong><span>providers tracked</span></div>
        <div><strong>${providers.filter(({ openai_compatible: compatible }) => compatible).length}</strong><span>OpenAI compatible</span></div>
        <div><strong>${providers.filter(({ availability }) => availability.status === 'retiring').length}</strong><span>retiring service</span></div>
      </div>
    </div>
  </header>

  <main>
    <section class="filter-band" aria-labelledby="filter-heading">
      <div class="shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Catalog</p>
            <h2 id="filter-heading">Find a usable free tier</h2>
          </div>
          <p><strong id="provider-count">${providers.length}</strong> matches</p>
        </div>
        <form class="filters" id="provider-filters">
          <label class="search-control">
            <span>Search</span>
            <input id="search-filter" name="query" type="search" placeholder="Provider, model, or limit" autocomplete="off">
          </label>
          <label>
            <span>Free access type</span>
            <select id="category-filter" name="category"><option value="all">All types</option>${categoryOptions}</select>
          </label>
          <label>
            <span>Credit card</span>
            <select id="card-filter" name="creditCard"><option value="all">Any</option><option value="not-required">Not required</option><option value="required">Required</option></select>
          </label>
          <label>
            <span>OpenAI compatible</span>
            <select id="compatibility-filter" name="openaiCompatible"><option value="all">Any</option><option value="yes">Yes</option><option value="no">No</option></select>
          </label>
          <label>
            <span>Sample probe</span>
            <select id="probe-filter" name="probe"><option value="all">Any state</option>${probeOptions}</select>
          </label>
        </form>
      </div>
    </section>

    <section class="table-band" aria-label="Free LLM API providers">
      <div class="shell shell--wide">
        <div class="table-wrap">
          <table id="provider-table">
            <thead><tr><th>Provider</th><th>Free access</th><th>Card</th><th>OpenAI</th><th>Limits</th><th>Sample probe</th><th>Sources checked</th><th>Access</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
          <p id="empty-state" class="empty-state" hidden>No providers match these filters.</p>
        </div>
      </div>
    </section>

    <section class="method-band">
      <div class="shell method-grid">
        <div>
          <p class="eyebrow">Interpretation</p>
          <h2>Sample facts, not status theater</h2>
        </div>
        <p><strong>401/403</strong> means the sample credential failed. <strong>429</strong> means that sample was limited. Only network and 5xx responses indicate a sampled endpoint reachability problem, never a provider-wide outage.</p>
        <a class="hosted-cta" href="${escapeHtml(hostedCta)}">Need stable hosted access?</a>
      </div>
    </section>
  </main>

  <footer><div class="shell"><span>Data is reviewed against official sources.</span><a href="https://github.com/xyzs996/free-llm-api/blob/main/README.md#data">Methodology and data contract</a></div></footer>
  <script id="provider-data" type="application/json">${embeddedData}</script>
  <script type="module" src="./app.js"></script>
</body>
</html>
`;
}

export function renderArtifacts(providers, changelog = null) {
  return {
    'README.md': renderReadme(providers, changelog),
    'README_zh.md': renderReadmeZh(providers, changelog),
    'docs/providers.json': `${JSON.stringify(providers, null, 2)}\n`,
    'docs/index.html': renderPage(providers),
    ...renderClientPages(providers),
  };
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
