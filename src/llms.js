// `llms.txt` — the plain-text map of this site, for the readers that are
// programs.
//
// ## Why this file and not just the sitemap
//
// The sitemap says which addresses exist. It does not say what any of them
// answers, so a program that wants one fact has to fetch and parse pages until
// it finds it. `llms.txt` is the file that answers in one request: every
// provider on one line with its limit, its base URL and the date the limit was
// read.
//
// The reason to spend the effort here rather than on another page is measured.
// Over fourteen days this repository received 109 views from 73 visitors, and
// the second-largest referrer was `chatgpt.com` — 19 views from 15 people who
// arrived because an answer engine had read the catalog and cited it. That is
// the one channel bringing strangers, and it is a channel of programs reading
// on somebody's behalf. This file is written for that reader.
//
// ## Everything in it is derived
//
// Nothing here is a second copy of a number. The provider lines come from
// `data/providers.json`, the family lines from `data/model-families.json`, the
// page list from the artifacts that were actually generated, and the prices
// from the sibling project's export. A file that restated any of them would be
// wrong within a week, and wrong in the one place nobody looks.
import { FIELD_NOTES_ROWS, FIELD_NOTES_TABLE } from './field-notes.js';
import { CLIENT_PAGE_TITLES, MODEL_FAMILIES, clientPageIds } from './pages.js';
import { DEFAULT_LOCALE, LOCALES, SITE_URL, THREAD_URL, pageUrl } from './site.js';
import { providersInFamily } from './validate.js';

// The units the catalog itself publishes. `limits.status` carries the shape of
// what a provider documents when it documents no number, and the strings are
// written for a human reading a table cell; spelled out here so a line stays
// readable on its own, out of the page that would have explained it.
const NO_NUMBER = Object.freeze({
  'tier-based': 'limits depend on the account tier',
  'documented-per-model': 'limits documented per model',
  'documented-per-endpoint': 'limits documented per endpoint',
  'documented-in-compute-units': 'limits documented in compute units',
  'documented-in-credits': 'limits documented as a credit balance',
  'documented-per-tier': 'limits documented per tier',
  'documented-account-wide': 'limits documented account-wide',
  'documented-in-plans': 'limits documented per plan',
  'documented-baseline': 'a documented baseline, raised on request',
  'documented-with-conditions': 'limits documented with conditions',
  'free-models-listed': 'free models listed rather than rate-limited',
  'dynamic-no-fixed-numbers': 'no fixed numbers published',
  'not_published': 'no limits published',
  // Not "free tier retiring" a second time: the category already says that,
  // and a line that says the same thing twice reads as two facts.
  retiring: 'limits vary by model and plan',
});

const CATEGORY = Object.freeze({
  'provider-free-tier': 'free tier',
  'free-model-aggregator': 'free model aggregator',
  'trial-credit': 'trial credit',
  'metered-access': 'metered access',
  'retiring-free-tier': 'free tier retiring',
});

function limitPhrase({ limits }) {
  const parts = [
    limits.requests_per_minute === null ? null : `${limits.requests_per_minute} requests/minute`,
    limits.requests_per_day === null ? null : `${limits.requests_per_day} requests/day`,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  // An unknown status is reported as itself rather than dropped. A line that
  // silently loses its limit reads as a provider with no limit at all.
  return NO_NUMBER[limits.status] ?? limits.status;
}

// Every provider in the catalog gets a line, including the ones the renderer
// gives no page of its own. A provider is held back from having a page when it
// has too few sourced facts to be worth reading — but the facts it does have
// are exactly what this file is for, and dropping it here would report a
// smaller catalog than the home page and the JSON both show.
function providerLine(provider, hasPage) {
  const facts = [
    CATEGORY[provider.category] ?? provider.category,
    limitPhrase(provider),
    provider.credit_card_required ? 'credit card required' : 'no credit card',
    provider.openai_compatible ? `OpenAI-compatible at ${provider.base_url}` : 'not OpenAI-compatible',
    `sources read ${provider.source_checked_at}`,
  ];
  if (provider.availability.retires_at) facts.push(`retires ${provider.availability.retires_at}`);
  if (!hasPage) facts.push('in the catalog table, no page of its own');
  const url = hasPage ? pageUrl(`provider/${provider.id}.html`) : SITE_URL;
  return `- [${provider.name}](${url}): ${facts.join(' · ')}.`;
}

function familyLine(family, providers) {
  const hosts = providersInFamily(family, providers).length;
  const vendor = family.vendor ? `${family.vendor}. ` : '';
  return `- [${family.name}](${pageUrl(`model/${family.id}.html`)}): ${vendor}Offered by ${hosts} of the ${providers.length} providers here.`;
}

// One line per figure, and the sentence it was published in on the same line.
// The point of the sibling table is that a bare `$1` is ambiguous between per
// million tokens, per month and per seat; splitting the number from its
// sentence to fit a list would reintroduce exactly that.
function figureLine(row) {
  return `- \`${row.value}\` ${row.unit} — "${row.context}" ([${row.article}](${row.url}))`;
}

/**
 * The site as one text file.
 *
 * `artifacts` is passed rather than a list of addresses so that this file
 * cannot name a page that was not generated — the same rule the sitemap is
 * built under, and for the same reason: an address in a machine-read index
 * that answers 404 is worse than an address that was never offered.
 */
export function renderLlms(providers, artifacts, families = MODEL_FAMILIES) {
  const generated = new Set(Object.keys(artifacts));
  const has = (path) => generated.has(`docs/${path}`);

  const checkedAt = providers.map(({ source_checked_at: date }) => date).sort().at(-1);
  const cardFree = providers.filter(({ credit_card_required: card }) => !card).length;
  const clients = clientPageIds.filter((id) => has(`client/${id}.html`));
  const listedFamilies = families.filter(({ id }) => has(`model/${id}.html`));
  const otherLocales = LOCALES.filter(({ code }) => code !== DEFAULT_LOCALE.code);

  const sections = [
    `# Free LLM API

> ${providers.length} API providers that publish a free tier for large language models, ${cardFree} of them without a credit card, plus setup instructions for ${clients.length} coding agents. ${SITE_URL}

Every limit below is the number the provider prints on its own page, with the date that page was read — not a benchmark and not an estimate. A provider that publishes no number is recorded as publishing none; the field is never filled in with a guess. Newest source read: ${checkedAt}.`,

    `## Providers

${providers.map((provider) => providerLine(provider, has(`provider/${provider.id}.html`))).join('\n')}`,

    `## Model families

Which providers in the catalog serve a given family, and what each one limits it to.

${listedFamilies.map((family) => familyLine(family, providers)).join('\n')}`,

    `## Coding agents

Which of these providers a given tool can be pointed at, and the exact configuration.

${clients.map((id) => `- [${CLIENT_PAGE_TITLES[id]}](${pageUrl(`client/${id}.html`)})`).join('\n')}`,

    `## Machine-readable

- [providers.json](${SITE_URL}providers.json): every field above, including the model lists and the official source URLs each limit was read from.
- [sitemap.xml](${SITE_URL}sitemap.xml): every page, with the date its own sources were last read.
- [Key checker](${pageUrl('verify.html')}): checks a key against a provider from the browser; the key goes to that provider and nowhere else.`,

    `## What it costs once a free tier ends

Out of scope for this catalog, which stops where the free tier does. These prices come from a sibling project that keeps every figure it has cited with the sentence it appeared in, and the model and coding-agent pages here quote the ones that name their own subject:

${FIELD_NOTES_ROWS.map(figureLine).join('\n')}
- [The whole table](${FIELD_NOTES_TABLE}): all figures, not only prices.`,

    `## Corrections

A limit here is only as good as the day it was read. If one has moved, or a provider is missing, [the open thread](${THREAD_URL}) takes a plain sentence and no evidence; the issue forms ask for the provider's page and the date you read it.${otherLocales.length === 0 ? '' : `\n\nThis catalog is also published in ${otherLocales.map(({ label, path_prefix: prefix }) => `[${label}](${SITE_URL}${prefix})`).join(', ')}, page for page.`}`,
  ];

  return `${sections.join('\n\n')}\n`;
}
