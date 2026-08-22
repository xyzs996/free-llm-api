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
import {
  FIELD_NOTES_PRICES,
  FIELD_NOTES_PRICES_CSV,
  FIELD_NOTES_PRICES_JSON,
  FIELD_NOTES_REPO,
  FIELD_NOTES_ROWS,
  FIELD_NOTES_TABLE,
  SIBLING_INDEXES,
  readerUrl,
} from './field-notes.js';
import { CLIENT_PAGE_TITLES, MODEL_FAMILIES, clientPageIds } from './pages.js';
import { DEFAULT_LOCALE, LOCALES, REPO_URL, SITE_URL, THREAD_QA, heardUrl, pageUrl } from './site.js';
import { hasRetired } from './lifecycle.js';
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
  // 已经关停的那一家没有「限额」可言。这一句是给抓这份 llms.txt 的模型看的
  // ——写成「限额随模型而不同」它就会照着推荐,而那个端点已经不在了。
  retired: 'shut down, no endpoint left to call',
});

const CATEGORY = Object.freeze({
  'provider-free-tier': 'free tier',
  'free-model-aggregator': 'free model aggregator',
  'trial-credit': 'trial credit',
  'metered-access': 'metered access',
  'retiring-free-tier': 'free tier retiring',
  'retired-free-tier': 'free tier retired',
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
  if (provider.availability.retires_at) {
    facts.push(`${hasRetired(provider) ? 'retired' : 'retires'} ${provider.availability.retires_at}`);
  }
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
  return `- \`${row.value}\` ${row.unit} — "${row.context}" ([${row.article}](${readerUrl(row)}))`;
}

// The dated list price, for the reader that arrives here as a machine.
//
// This file is not a courtesy copy. `chatgpt.com` is this catalog's second
// largest referrer — 15 unique visitors in a fortnight, against 42 from
// github.com — so an answer engine is already reading this address and
// citing what it finds. Until now the only prices in it were quotations:
// true, sourced, and as old as the write-up they came from.
//
// "What is the cheapest LLM API for coding right now" is answerable from a
// quotation only by accident. It is answerable from today's catalog exactly,
// which is why every line below carries the date it was read: a price with
// no date is one an engine cannot safely repeat, and one it repeats anyway
// is our error in someone else's mouth.
function priceLine(row) {
  const money = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '?';
    const exact = amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    return `$${amount.toFixed(Math.max(2, (exact.split('.')[1] ?? '').length))}`;
  };
  const rank = row.agent_rank
    ? `, ranked #${row.agent_rank} in the Design Arena \`${row.agent_category}\` agent category`
    : '';
  // The queued price is labelled in the same clause as the number, not in a
  // note underneath it. A line lifted out of this file takes its own caveat
  // with it or it takes none at all.
  const batch = row.batch ? ' (batch/queued price, not the interactive one)' : '';
  return `- **${row.model}** — ${money(row.input_per_million)} per million input tokens, `
    + `${money(row.output_per_million)} per million output${batch}${rank}.`;
}

// Questions this catalog is asked, deliberately does not answer, and can point
// at an answer for.
//
// The section these join is the one shape in this file an answer engine quotes
// whole: a question, and one address that answers it. Every entry in it named a
// discussion in this repository, so every citation it has ever earned came back
// here — while the sibling that supplies the prices above has, over the same
// fourteen days, three unique visitors and an empty referrer list.
//
// ⚠ **The address is taken from the row, never written here.** An entry names
// the figure that answers it, by value; the sentence and the write-up URL are
// read off `FIELD_NOTES_ROWS`. So a question can only ever link where the
// corpus already supports, and an entry whose figure the export drops prints
// nothing rather than a link to a page that no longer argues it.
const SIBLING_QA = Object.freeze([
  {
    value: '$0.19 / $5',
    question: 'Are Chinese models actually cheaper than OpenAI per million tokens, and by how much?',
  },
  {
    value: '$1',
    question: 'What gross margin sits behind a $1-per-million-token price?',
  },
  {
    value: '$3',
    question: 'Is a premium coding model worth $3 per million input tokens?',
  },
]);

function siblingQaLines() {
  return SIBLING_QA.map(({ value, question }) => {
    const row = FIELD_NOTES_ROWS.find((candidate) => candidate.value === value);
    if (!row) return null;
    return `- **${question}** — "${row.context}" ([${row.article}](${readerUrl(row)}))`;
  }).filter(Boolean);
}

// 抓这份文件的程序拿走的是一行行事实,而它没法从事实本身看出哪一条**刚刚变过**。
// 一个模型引用「Groq 免费表里有 Llama」,和引用「Groq 免费表里曾经有 Llama,
// 2026-08-22 那次核对时已经没了」,对提问的人价值差一个量级 —— 后者能解释他昨天
// 为什么调不通。这一段是这份文件里唯一带时间方向的内容。
//
// 只放最新一周。整段历史在 changelog.json,链接在末尾;把二十周堆进来,这份文件
// 就从「一次请求拿到全部现状」变成了一份日志。
function changedSection(week, providers) {
  const nameFor = (id) => providers.find((provider) => provider.id === id)?.name ?? id;
  const lines = week.changes
    .map((change) => `- **${nameFor(change.provider_id)}** (${change.type}): ${change.detail}`)
    .join('\n');

  return `## What changed, as of ${week.week_of}

Every source above was read again on this date. What moved since the previous read:

${lines}

${week.summary}

- [changelog.json](${REPO_URL}/blob/main/data/changelog.json): every week on record, same fields.`;
}

/**
 * The site as one text file.
 *
 * `artifacts` is passed rather than a list of addresses so that this file
 * cannot name a page that was not generated — the same rule the sitemap is
 * built under, and for the same reason: an address in a machine-read index
 * that answers 404 is worse than an address that was never offered.
 */
export function renderLlms(providers, artifacts, families = MODEL_FAMILIES, changelog = null) {
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

    changelog?.weeks?.[0] ? changedSection(changelog.weeks[0], providers) : null,

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

Out of scope for this catalog, which stops where the free tier does. A sibling project re-reads ${FIELD_NOTES_PRICES.source_name}'s whole catalog every day. On **${FIELD_NOTES_PRICES.checked}** it held ${FIELD_NOTES_PRICES.total} models with a list price; these were the cheapest by input price:

${FIELD_NOTES_PRICES.rows.map(priceLine).join('\n')}
- Read on ${FIELD_NOTES_PRICES.checked} from ${FIELD_NOTES_PRICES.source_name}'s public catalog. All ${FIELD_NOTES_PRICES.total} rows: [JSON](${FIELD_NOTES_PRICES_JSON}) · [CSV](${FIELD_NOTES_PRICES_CSV}) · [repository](${FIELD_NOTES_REPO}).

A list price is what a vendor publishes. What a month of it came to is a different number, and the same project keeps those separately — every figure it has cited, with the sentence it appeared in. The model and coding-agent pages here quote the ones that name their own subject:

${FIELD_NOTES_ROWS.map(figureLine).join('\n')}
- [The whole table](${FIELD_NOTES_TABLE}): all figures, not only prices.`,

    `## Questions answered in full, with the figures behind them

${THREAD_QA.map(({ number, question, note }) => `- **${question}** — ${note}. ${REPO_URL}/discussions/${number}`).join('\n')}

Three more this catalog is asked and does not answer, because they start where its free tiers end. Each is answered by a figure quoted above, in the sentence it was published in:

${siblingQaLines().join('\n')}`,

    `## Elsewhere

Three sibling sites publish their own \`llms.txt\` in this same shape — one request, every address, each one dated:

${SIBLING_INDEXES.map(({ url, note }) => `- [${url}](${url}): ${note}`).join('\n')}`,

    `## Corrections

A limit here is only as good as the day it was read. If one has moved, or a provider is missing, [one line in this form](${heardUrl('llms.txt')}) takes a plain sentence and no evidence — a single field; the correction form asks for the provider's page and the date you read it.${otherLocales.length === 0 ? '' : `\n\nThis catalog is also published in ${otherLocales.map(({ label, path_prefix: prefix }) => `[${label}](${SITE_URL}${prefix})`).join(', ')}, page for page.`}`,
  ];

  return `${sections.filter(Boolean).join('\n\n')}\n`;
}
