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

export const FIELD_NOTES_REPO = 'https://github.com/xyzs996/ai-coding-field-notes';
// Point at the rendered page, not the repo's figures.md blob. Same 348 rows,
// but the blob is GitHub chrome around a markdown file: a reader lands in a
// diff-flavoured viewer, and anything quoting it quotes github.com rather than
// the source. The rendered page has its own title and description and is in
// the site's sitemap, so it is the one URL that serves a reader and a crawler
// equally well.
export const FIELD_NOTES_TABLE =
  'https://xyzs996.github.io/ai-coding-field-notes/figures.html';

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
// So `medium` wins where it exists. `url` is the fallback and stays the only
// address for the other thirty, which were never on Medium — an empty cell
// means "not published there", not "unknown".
export function readerUrl(row) {
  return row.medium || row.url;
}

export const FIELD_NOTES_JSON =
  'https://cdn.jsdelivr.net/gh/xyzs996/ai-coding-field-notes@main/data/figures.json';
export const FIELD_NOTES_ARTICLE =
  'https://xyzs996.github.io/ai-coding-field-notes/articles/token-optimization-for-indie-developers-ai-api-bills.html';

// The sibling sites' own machine indexes. This catalog is the only property in
// the family that an assistant already arrives at on its own — chatgpt.com is
// its second-largest referrer — and until this list existed its `llms.txt`
// named no other address in the family at all. A reader crawling this file for
// free-tier limits had no way to learn that the prices after the free tier,
// and the two datasets next door, are published in the same shape.
export const SIBLING_INDEXES = Object.freeze([
  {
    url: 'https://xyzs996.github.io/ai-coding-field-notes/llms.txt',
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

export function renderFieldNotes() {
  return `Free is not the same as cheap enough to keep running, and the number you need is what replaces the free tier once it runs out. Same maintainer, [one table of every figure they have cited](${fieldNotesUrl('en')}) — anything carrying a unit — with **the full sentence it came from** on every row. The per-million-token prices out of it:

| Price | Unit | The sentence it was published in |
| --- | --- | --- |
${tableRows()}

A \`$1.43\` is never left ambiguous between per million tokens, per month and per seat, because the sentence travels with it. Readable in code as [JSON or CSV](${FIELD_NOTES_JSON}), or as prose: [where the token bill actually goes](${FIELD_NOTES_ARTICLE}).

Moving to a model that is not in those rows? [Name it in one line](${figureAskUrl('free-llm-api/README.md')}) — one field, and it decides which price gets chased next.`;
}

export function renderFieldNotesZh() {
  return `免费不等于跑得起。真正要看的数是免费额度用完之后、替代它的那一档要多少钱。同一维护者整理了[一张表](${fieldNotesUrl('zh')})：引用过的每一个带单位的数字都在里面，**每一行都带着它出处的整句话**。其中每百万 token 的价钱是这几条：

| 价格 | 单位 | 它出自的那句原话 |
| --- | --- | --- |
${tableRows()}

原话原样引用、不翻译——翻过来就成了我们的转述，而不是他们写的那句。所以一个 \`$1.43\` 不会在「每百万 token」「每月」「每席位」之间含混过去。机器读的话是 [JSON 和 CSV](${FIELD_NOTES_JSON})，读文章的话看这篇：[token 账单到底花在哪](${FIELD_NOTES_ARTICLE})。

要换的那个模型不在上面几行里？[一句话说出它的名字](${figureAskUrl('free-llm-api/README_zh.md')})——只有一格要填，下一个去查的价钱按这个排。`;
}
