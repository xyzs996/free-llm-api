// The per-million-token prices cited by the sibling repo, rendered as a table.
//
// Why a table and not a sentence. The block that used to sit here described a
// table instead of being one: "same maintainer, one table, every row carries
// the sentence it came from" — and not a single digit in it. Readers scan this
// README table by table and skip a paragraph between two of them; an answer
// engine quoting this page quotes rows, and a paragraph offers no row to quote.
//
// The rows come from data/field-notes-figures.json, exported by the sibling
// repo's scripts/export_cost_table.py. Only price figures whose unit starts
// with "per million" are in there — that is the one number a reader of this
// page needs once a free tier runs out.
//
// The sentence in each row is reproduced unedited, in the language it was
// published in. It is a quotation, so the Chinese README quotes it in English
// too: translating it would make it our paraphrase rather than their sentence.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = 'data/field-notes-figures.json';

// The second export, added 2026-08-22, and the reason is a mismatch between
// the question this page's reader has and the answer the block below gave.
//
// This catalog is read by someone whose free tier ran out or is about to. The
// figures table answers with the prices the sibling's write-ups happened to
// quote — four models, whichever four got written about. The comment on
// `figureAskUrl` already concedes the consequence: "the commonest outcome of
// reading it is 'the model I am moving to is not in here'". A form that asks
// them to name the missing model is a fix for next month, not for the reader
// who is here now.
//
// `data/field-notes-prices.json` does not depend on anyone having written
// about a model. It is OpenRouter's whole catalog, re-read every day, cut to
// the cheapest few. For "my free tier ran out, what do I move to", that is
// the answer, and it is one table away instead of one issue thread away.
//
// Both are rendered, in that order. They are different claims: a list price
// is what a vendor publishes today, and a quoted figure is what somebody's
// bill actually came to. Neither substitutes for the other.
const PRICES_PATH = 'data/field-notes-prices.json';

export const FIELD_NOTES_REPO = 'https://github.com/xyzs996/llm-api-pricing';
// Point at the rendered page, not the repo's figures.md blob. Same 348 rows,
// but the blob is GitHub chrome around a markdown file: a reader lands in a
// diff-flavoured viewer, and anything quoting it quotes github.com rather than
// the source. The rendered page has its own title and description and is in
// the site's sitemap, so it is the one URL that serves a reader and a crawler
// equally well.
export const FIELD_NOTES_TABLE =
  'https://xyzs996.github.io/llm-api-pricing/figures.html';

// Where a *reader* is sent, as opposed to where a machine index points.
//
// The comment above is still right about crawlers and about quoting, and
// `llms.txt` still points at the rendered page for exactly those reasons. It
// is wrong about readers, and 2026-08-21 says so out loud: the sibling
// repository has 5 views, 3 unique visitors, 0 stars, and
// `traffic/popular/referrers` comes back an **empty list** — while every
// human-facing link in this catalog points at Pages, which produces no
// referral to a repository at all. The proof that the other direction works
// is in the same API: the proxy repository lists `xyzs996.github.io` as a
// referrer with 7 uniques, because there the site links back to the repo.
//
// A star and an issue thread — the two things this account has never once got
// on the field notes — exist on the repository and nowhere else. The old
// argument that the repo root is "a screen of file names" expired on
// 2026-08-20: that README now opens with the figures table and twelve rows
// quoted whole, so a reader landing there lands on the same numbers.
//
// Language matters because that repository grew nine non-English READMEs the
// same day, and the root file is the English one. The identical defect was
// measured and fixed on the proxy side this week, where 88 of 191 visitors
// were reading a Russian README while the link handed to them opened English.
const FIELD_NOTES_README = Object.freeze({ zh: 'README_CN.md' });

export function fieldNotesUrl(localeCode) {
  const name = FIELD_NOTES_README[localeCode];
  return name ? `${FIELD_NOTES_REPO}/blob/main/${name}` : FIELD_NOTES_REPO;
}

// The one thing a reader can *do* after reading the table, and until now the
// only thing every version of this block was missing.
//
// The block ends where the reader's question starts. It prints the prices whose
// published sentence happens to name the model this page is about — five rows
// on the home page, often one or two on a model page, and on the pages that
// match nothing, no block at all. So the commonest outcome of reading it is
// "the model I am moving to is not in here", and the block's last line has
// always been a link to an article, which cannot answer that.
//
// The sibling repo built the form for exactly this and measured why it beats a
// discussion thread: nine open threads there got 0 replies while the same
// pages were read 169 times, because the first step asked for was "go write a
// paragraph in an empty room". The form has **one** empty field, and it asks
// the one thing this page cannot know — which number they came for.
//
// `?template=figure.yml`, never `/choose`: the chooser page swallows query
// parameters, so the link still returns 200 and the form still opens, with
// every field blank. `came_from` is the part this page *does* know, prefilled
// so the answer arrives labelled with the surface that produced it — which is
// also the only way a click from here is countable on the other end.
export function figureAskUrl(cameFrom) {
  const query = new URLSearchParams({ template: 'figure.yml' });
  if (cameFrom) query.set('came_from', cameFrom);
  return `${FIELD_NOTES_REPO}/issues/new?${query}`;
}

// Where a row's write-up is sent to a *reader*.
//
// Every row carries `url` — the copy on the sibling's GitHub Pages site — and
// some also carry `medium`, the page the piece was published on first. Two of
// the sibling's thirty-two write-ups have one.
//
// Those two are the only pages anywhere in this family where a reader can clap
// or reply. The Pages copy has neither control; it is a copy, and reading it
// ends there. The sibling already says so to machines and not to people: the
// article page it generates for those two carries `rel=canonical` pointing at
// Medium, so a crawler is told "the original is over there" while every human
// link in this README pointed at the reproduction.
//
// So `medium` wins where it exists.
//
// The sentence above used to end "…and `url` is the fallback for the other
// thirty". That was true for one day. On 2026-08-22 the sibling posted all
// thirty-two write-ups as GitHub discussions — one thread each, the thread
// body *is* the whole piece — and now carries the address in a third column,
// `thread`. So the other thirty have a repliable page too, and sending a
// reader to the Pages copy is now a choice to send them somewhere they cannot
// answer, not the only address there is.
//
// Order is medium → thread → url, and the first two are not interchangeable:
// where a piece has a Medium original, that is where its claps and responses
// already live and where the canonical tag points; splitting the same piece's
// readers across two repliable pages splits the counts that measure it.
//
// `url` stays as the last fallback rather than being dropped. An empty
// `thread` means "no thread for this one" — a new write-up published before
// the next discussion is opened lands here, and a link to the copy beats no
// link at all.
export function readerUrl(row) {
  return row.medium || row.thread || row.url;
}

export const FIELD_NOTES_JSON =
  'https://cdn.jsdelivr.net/gh/xyzs996/llm-api-pricing@main/data/figures.json';
// The one write-up named in prose, in both READMEs, as "where the token bill
// actually goes". It pointed at the Pages copy until 2026-08-22; it now points
// at that piece's discussion thread for the same reason `readerUrl` prefers
// one — the thread body is the whole piece and it has a reply box, while the
// copy is a page a reader can only close. This is the single most-linked
// write-up in this repository, so it is the one where that difference costs
// the most.
export const FIELD_NOTES_ARTICLE =
  'https://github.com/xyzs996/llm-api-pricing/discussions/37';

// The sibling sites' own machine indexes. This catalog is the only property in
// the family that an assistant already arrives at on its own — chatgpt.com is
// its second-largest referrer — and until this list existed its `llms.txt`
// named no other address in the family at all. A reader crawling this file for
// free-tier limits had no way to learn that the prices after the free tier,
// and the two datasets next door, are published in the same shape.
export const SIBLING_INDEXES = Object.freeze([
  {
    url: 'https://xyzs996.github.io/llm-api-pricing/llms.txt',
    // Says what is *in* the file, not what the site is about. As of
    // 2026-08-21 that index carries every price figure it has published
    // inline — value, unit, the sentence it was published in, the date — so
    // a reader that fetches it once has numbers rather than a list of
    // titles. A line that promised only "write-ups about cost" would not be
    // worth the request.
    note: 'every price figure it has published, quoted inline with the sentence and the date it was published in, plus the write-ups behind them.',
  },
  {
    url: 'https://xyzs996.github.io/free-proxy-health-list/llms.txt',
    note: 'free HTTP/SOCKS proxies, re-checked and re-published on a schedule, as TXT, JSON and CSV.',
  },
  {
    url: 'https://xyzs996.github.io/iptv-doctor/llms.txt',
    note: 'which public IPTV channels answer right now, per country and per channel. No stream URL is published.',
  },
]);

function loadRows() {
  const raw = readFileSync(resolve(rootDirectory, DATA_PATH), 'utf8');
  const rows = JSON.parse(raw).rows;
  // Refuse to render rather than quietly drop the block. A README missing one
  // table looks exactly like a README that never had it, and render:check
  // would then happily bless the shorter file.
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`${DATA_PATH} has no rows; re-run export_cost_table.py in the sibling repo.`);
  }
  return rows;
}

export const FIELD_NOTES_ROWS = loadRows();

// Same refuse-to-render rule as `loadRows`, for the same reason, plus one
// that is specific to this file: it claims a date.
//
// The sibling's exporter writes this file only when the day's fetch came back
// with rows — a failed read leaves yesterday's file in place rather than
// overwriting it with an empty table. So a missing or empty file here is not
// "the fetch failed today", it is "this file was deleted", and rendering a
// README without the table would look identical to a README that never had
// one. `checked` is required for the same reason the unit travels with a
// price in the other table: "re-read daily" is a claim, and the date is what
// makes it checkable instead of decorative.
// Exported so the suite can reach both refusals. Reading a broken fixture off
// disk would mean shipping one, and a validator nothing can fail is a comment
// with parentheses.
export function validatePrices(doc, path = PRICES_PATH) {
  if (!Array.isArray(doc?.rows) || doc.rows.length === 0) {
    throw new Error(`${path} has no rows; re-run export_cost_table.py in the sibling repo.`);
  }
  if (!doc.checked || !doc.source_name) {
    throw new Error(`${path} is missing checked/source_name; the table would claim a date it does not have.`);
  }
  // The headline says "N models" while the table shows five of them. If the
  // total were ever written by hand it could shrink below what is printed
  // underneath it, and the table would contradict its own first line.
  if (!(Number(doc.total) >= doc.rows.length)) {
    throw new Error(`${path} claims ${doc.total} models but prints ${doc.rows.length}.`);
  }
  return doc;
}

function loadPrices() {
  const raw = readFileSync(resolve(rootDirectory, PRICES_PATH), 'utf8');
  return validatePrices(JSON.parse(raw));
}

export const FIELD_NOTES_PRICES = loadPrices();

export const FIELD_NOTES_PRICES_JSON =
  'https://cdn.jsdelivr.net/gh/xyzs996/llm-api-pricing@main/data/prices.json';
export const FIELD_NOTES_PRICES_CSV =
  'https://cdn.jsdelivr.net/gh/xyzs996/llm-api-pricing@main/data/prices.csv';

// How many rows one generated page prints. Two, not five: the README is a
// document a reader came to read, while a generated page is answering "can I
// use this for free", and a five-row quotation block would answer a question
// nobody on that page asked. Two is enough to carry an order of magnitude and
// a link out.
//
// No subject matches more than one row today, so this caps nothing yet. It is
// here for the next export, and the near-duplicate check in the suite is what
// says whether two rows still fit when one does.
export const FIGURES_PER_PAGE = 2;

function escapeRegExp(text) {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// `\bNAME(?![A-Za-z])` rather than `\bNAME\b`. The published sentences write
// "GLM5.2", where a trailing word boundary fails on the digit and the row
// would silently stop matching the GLM family; and "Meta" must not match
// "metadata". A digit may follow the name, a letter may not.
function namesIt(sentence, label) {
  return new RegExp(`\\b${escapeRegExp(label)}(?![A-Za-z])`, 'i').test(sentence);
}

/**
 * The figures that belong on a page about these subjects.
 *
 * ## Why this is matched rather than pasted
 *
 * These pages are the ones search traffic lands on — 84 of the 86 generated
 * here carried no link to the write-ups at all, while the two that did are the
 * home pages. The fix is not the same block stamped onto 84 pages: this repo
 * measures its own pages for near-duplication precisely because a directory
 * site degrades into doorway pages that way, and a Groq page quoting a MiniMax
 * price is padding whichever test happens to allow it.
 *
 * So a row is printed only where it is about what the page is about: the
 * sentence has to name the page's own subject, or the vendor behind it. A
 * `subject` is any record with a `name` and a `vendor` — a model family from
 * `data/model-families.json` on a family page, the tool and the company that
 * publishes it on a client page — so a family added to that file starts
 * matching without a second edit here.
 *
 * ## Pages that match nothing print nothing
 *
 * Three of the five rows name a family in this catalog, and two name a company
 * behind a coding agent it sets up. The rest — a MiniMax price, a "$3 per
 * million input tokens" that names no model at all, and the Qwen, Mistral and
 * Kimi families, which have no figure yet — belong to no page here. Those
 * pages get no block, which is the same rule the sibling repo applies to its
 * own README: an empty table is worse than no table.
 *
 * Only the English `name` and `vendor` are compared, because the quoted
 * sentences are English in both editions of this site.
 *
 * ## Where this is deliberately not called
 *
 * Not on the 25 provider pages, which is where the reach would have been.
 * Measured: the closest pair of Chinese provider pages already scores 0.553
 * against the suite's 0.60 near-duplicate limit, because two providers serving
 * the same model families differ only in their own limits wording. Every
 * version of this block — two rows, one row, one lede instead of two — put
 * that pair between 0.594 and 0.612. The measurement is right and the block is
 * the wrong thing to put there.
 */
export function figuresForFamilies(subjects, limit = FIGURES_PER_PAGE) {
  const matched = FIELD_NOTES_ROWS.filter((row) => (subjects ?? []).some(
    (subject) => [subject.name, subject.vendor]
      .filter(Boolean)
      .some((label) => namesIt(row.context, label)),
  ));
  // Row order, not match order: two pages sharing a subject must print its
  // figure in the same place, and `renderArtifacts` is asserted to be
  // deterministic across reruns.
  return matched.slice(0, limit);
}

// Cells are pipe-separated, so a pipe inside a quoted sentence would split the
// row. None of the current sentences contain one; escaping is what keeps that
// true after the next export.
function cell(text) {
  return String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

function tableRows() {
  return FIELD_NOTES_ROWS.map(
    (row) => `| \`${cell(row.value)}\` | ${cell(row.unit)} | ${cell(row.context)} [→](${readerUrl(row)}) |`,
  ).join('\n');
}

// `$0.30`, not `$0.3`, and `$0.1875`, not `$0.19`.
//
// Two decimals is what a reader reads a price as, so a bare `$0.3` next to a
// `$0.1875` reads as a typo in one of them. But rounding the other way is
// worse than ugly: at these magnitudes `$0.1875` and `$0.19` are a 1.4%
// difference in a bill, and this table's only job is to be the number someone
// budgets against. So: never fewer than two decimals, never fewer than the
// source has.
function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  const exact = amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  const decimals = (exact.split('.')[1] ?? '').length;
  return `$${amount.toFixed(Math.max(2, decimals))}`;
}

// The rank column is the Design Arena `agents` leaderboard placing that the
// sibling's catalog carries per model. It is here because "cheapest" on its
// own is a trap: the cheapest row in any price list is the model nobody uses,
// and a reader moving off a free tier is choosing what to *work* with. A
// placing next to the price is the difference between "this is cheap" and
// "this is cheap and somebody ships with it".
//
// A row with no placing prints an em dash rather than being dropped. It is
// still one of the cheapest five, and hiding it would make the table's own
// claim — the cheapest five of sixty — false.
function priceRows() {
  return FIELD_NOTES_PRICES.rows.map((row) => {
    const name = row.batch ? `${cell(row.model)} *(batch)*` : cell(row.model);
    const rank = row.agent_rank
      ? `#${row.agent_rank} ${cell(row.agent_category)}`
      : '—';
    return `| ${name} | ${money(row.input_per_million)} | ${money(row.output_per_million)} | ${rank} |`;
  }).join('\n');
}

export function renderFieldNotes() {
  const prices = FIELD_NOTES_PRICES;
  return `Free is not the same as cheap enough to keep running, and the number you need is what replaces the free tier once it runs out. Same maintainer, [re-reading ${prices.source_name}'s whole catalog every day](${fieldNotesUrl('en')}) — **${prices.total} models on ${prices.checked}**, cheapest five first:

| Model | Input / M tokens | Output / M tokens | Design Arena \`agents\` |
| --- | --- | --- | --- |
${priceRows()}

A \`(batch)\` row is the queued price, not the interactive one — an agent waiting on the reply pays the other number. All ${prices.total} rows as [JSON](${FIELD_NOTES_PRICES_JSON}) or [CSV](${FIELD_NOTES_PRICES_CSV}), re-read tomorrow.

A list price is what a vendor publishes; what a month of it came to is a different number, and only somebody who paid it can tell you. The same repository keeps those too — every figure quoted in a write-up, with **the full sentence it came from** on every row:

| Price | Unit | The sentence it was published in |
| --- | --- | --- |
${tableRows()}

A \`$1.43\` is never left ambiguous between per million tokens, per month and per seat, because the sentence travels with it. Readable in code as [JSON or CSV](${FIELD_NOTES_JSON}), or as prose: [where the token bill actually goes](${FIELD_NOTES_ARTICLE}).

Paying for a model whose bill surprised you? [Name it in one line](${figureAskUrl('free-llm-api/README.md')}) — one field, and it decides which price gets chased next.`;
}

export function renderFieldNotesZh() {
  const prices = FIELD_NOTES_PRICES;
  return `免费不等于跑得起。真正要看的数是免费额度用完之后、替代它的那一档要多少钱。同一维护者[每天把 ${prices.source_name} 的整份目录重读一遍](${fieldNotesUrl('zh')})：**${prices.checked} 这天是 ${prices.total} 个模型**，最便宜的五个是——

| 模型 | 输入 / 百万 token | 输出 / 百万 token | Design Arena \`agents\` 榜 |
| --- | --- | --- | --- |
${priceRows()}

标了 \`(batch)\` 的是排队价，不是即时价——写代码的 agent 在那儿等回复，付的是另一个数。整份 ${prices.total} 行读作 [JSON](${FIELD_NOTES_PRICES_JSON}) 或 [CSV](${FIELD_NOTES_PRICES_CSV})，明天再重读一遍。

挂牌价是厂商今天贴出来的数；真跑一个月账单是多少，是另一个数，只有付过的人说得出。同一个仓库里另有一张表记的就是后者：写过的每一个带单位的数字，**每一行都带着它出处的整句话**——

| 价格 | 单位 | 它出自的那句原话 |
| --- | --- | --- |
${tableRows()}

原话原样引用、不翻译——翻过来就成了我们的转述，而不是他们写的那句。所以一个 \`$1.43\` 不会在「每百万 token」「每月」「每席位」之间含混过去。机器读的话是 [JSON 和 CSV](${FIELD_NOTES_JSON})，读文章的话看这篇：[token 账单到底花在哪](${FIELD_NOTES_ARTICLE})。

哪个模型的账单让你吃过一惊？[一句话说出它的名字](${figureAskUrl('free-llm-api/README_zh.md')})——只有一格要填，下一个去查的价钱按这个排。`;
}
