// What this block is for is that it carries numbers. The version it replaced
// described a table of figures and contained no figure at all, and nothing in
// this suite noticed, because "the paragraph is present" was the only thing
// ever asserted about it. So the first test here counts digits.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  FIELD_NOTES_ROWS,
  readerUrl,
  renderFieldNotes,
  renderFieldNotesZh,
} from '../src/field-notes.js';

const loadProviders = async () =>
  JSON.parse(await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'));
const loadChangelog = async () =>
  JSON.parse(await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'));

const readmeEn = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const readmeZh = await readFile(new URL('../README_zh.md', import.meta.url), 'utf8');

test('the block carries prices, not a description of prices', () => {
  for (const [name, block] of [['en', renderFieldNotes()], ['zh', renderFieldNotesZh()]]) {
    // The old paragraph's only digit was the `$1.43` in its own example of an
    // ambiguous figure, so "contains a digit" is not enough: require a price
    // per row, from the data.
    const prices = block.match(/\$\d[\d.,]*/g) ?? [];
    assert.ok(
      prices.length >= FIELD_NOTES_ROWS.length,
      `${name}: ${prices.length} prices for ${FIELD_NOTES_ROWS.length} rows`,
    );
  }
});

test('every row reaches both rendered READMEs with its sentence intact', () => {
  assert.ok(FIELD_NOTES_ROWS.length > 0);

  for (const row of FIELD_NOTES_ROWS) {
    // Verbatim, not "contains the price". A truncated sentence still reads as
    // a sentence, which is exactly how a mangled quote survives review.
    for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
      assert.ok(readme.includes(row.context), `${name} is missing: ${row.context.slice(0, 40)}…`);
      assert.ok(readme.includes(readerUrl(row)), `${name} is missing the link for that row`);
    }
  }
});

// Two of the sibling's thirty-two write-ups were published on Medium first.
// Those two pages are the only ones in this whole family carrying a clap
// button and a reply box; the copy on the sibling's Pages site has neither,
// and the sibling already tells crawlers as much with a `rel=canonical`
// pointing at Medium. Until this test existed, every human link in both
// READMEs went to the copy anyway.
test('a write-up published on Medium first is linked at the original, not the copy', () => {
  const originals = FIELD_NOTES_ROWS.filter((row) => row.medium);
  // Non-vacuous guard. With no such row the loop below would pass by being
  // empty, which is exactly the state this test is here to notice.
  assert.ok(originals.length > 0, 'no exported row carries a Medium original');

  for (const row of originals) {
    assert.equal(readerUrl(row), row.medium, `${row.value} is sent to the copy`);
    for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
      assert.ok(readme.includes(row.medium), `${name} does not link the original for ${row.value}`);
      // And the copy is not what that row's arrow opens. Asserting only that
      // the original appears somewhere would pass with both links present.
      assert.ok(
        !readme.includes(`[\u2192](${row.url})`),
        `${name} still sends ${row.value} to the copy`,
      );
    }
  }

  // The other rows are unaffected: an empty cell means "never on Medium", and
  // those write-ups have no address other than the one on the sibling's site.
  const copies = FIELD_NOTES_ROWS.filter((row) => !row.medium);
  assert.ok(copies.length > 0, 'every row has a Medium original — check the fixture');
  for (const row of copies) assert.equal(readerUrl(row), row.url);
});

test('the quoted sentences are not translated in the Chinese README', () => {
  // They are quotations of someone else's published sentence. A translated
  // quote is our paraphrase wearing quotation marks.
  const row = FIELD_NOTES_ROWS[0];
  assert.ok(readmeZh.includes(row.context));
});

test('a pipe inside a sentence cannot split the table row', () => {
  const rendered = renderFieldNotes();
  const header = rendered.split('\n').find((line) => line.startsWith('| Price |'));
  assert.ok(header);

  const bodyLines = rendered
    .split('\n')
    .filter((line) => line.startsWith('| `'));
  assert.equal(bodyLines.length, FIELD_NOTES_ROWS.length);
  for (const line of bodyLines) {
    // Three columns means four pipes; an unescaped one in a quoted sentence
    // would silently add a column and shift every cell after it.
    const unescaped = (line.match(/(?<!\\)\|/g) ?? []).length;
    assert.equal(unescaped, 4, `wrong column count: ${line.slice(0, 60)}…`);
  }
});

test('each row states a unit, so a bare number cannot be misread', () => {
  for (const row of FIELD_NOTES_ROWS) {
    assert.ok(row.unit.startsWith('per million'), `unexpected unit: ${row.unit}`);
    assert.ok(row.value.includes('$'), `unexpected value: ${row.value}`);
  }
});

/* ------------------------------------------- the daily catalog, added today */

// The block above answers "what did somebody's bill come to". The reader of
// this catalog is asking "my free tier ran out, what do I move to", and until
// 2026-08-22 the only answer here was the four models the sibling's write-ups
// happened to name. These pin the table that answers it without waiting for
// anybody to write anything: the sibling's daily re-read of the whole catalog.

const { FIELD_NOTES_PRICES, validatePrices } = await import('../src/field-notes.js');

const priceLines = (block) => block
  .split('\n')
  .filter((line) => line.startsWith('| ') && / \| \$/.test(line));

test('the catalog table prints every exported row, one column set', () => {
  for (const [name, block] of [['en', renderFieldNotes()], ['zh', renderFieldNotesZh()]]) {
    const lines = priceLines(block);
    assert.equal(lines.length, FIELD_NOTES_PRICES.rows.length, `${name}: wrong row count`);
    for (const line of lines) {
      // Four columns means five pipes. A model name carrying one would shift
      // every cell after it, exactly as in the figures table.
      const unescaped = (line.match(/(?<!\\)\|/g) ?? []).length;
      assert.equal(unescaped, 5, `${name}: wrong column count: ${line.slice(0, 60)}…`);
    }
  }
});

test('a price is never rounded away and never printed short', () => {
  const block = renderFieldNotes();
  // `$0.1875` and `$0.19` differ by 1.4% of a bill, and this table's only job
  // is to be the number somebody budgets against.
  assert.ok(block.includes('$0.1875'), 'the exact sub-cent price was rounded');
  // …while `$0.3` next to it reads as a typo rather than a price.
  assert.ok(block.includes('$0.30'), '$0.30 was printed short');
  // ⚠ The catalog rows only. The figures table below prints `$0.06 / $0.2`,
  // and that one-decimal price is *inside a quotation* — it is how the author
  // wrote it, and this repo's rule is that a quoted sentence travels unedited.
  // Widening this to the whole block would demand we tidy someone's sentence.
  for (const line of priceLines(block)) {
    assert.ok(!/\$\d+\.\d(?!\d)/.test(line), `a price printed with one decimal: ${line}`);
  }
});

test('the table says which day it was read, and both READMEs carry that day', () => {
  const { checked, total } = FIELD_NOTES_PRICES;
  // "Re-read daily" is a claim. The date is what makes it checkable, and a
  // date nobody prints is a date nobody can catch going stale.
  assert.match(checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(`${checked}T00:00:00Z`) <= new Date(), `${checked} is in the future`);
  for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
    assert.ok(readme.includes(checked), `${name} does not say when the catalog was read`);
    assert.ok(readme.includes(String(total)), `${name} does not say how many models were read`);
  }
});

test('a queued price is labelled as one', () => {
  const batch = FIELD_NOTES_PRICES.rows.filter((row) => row.batch);
  // Non-vacuous guard: with no batch row this test would pass by being empty,
  // and an unlabelled batch price is the one way this table lies — an agent
  // waiting on a reply cannot pay it.
  assert.ok(batch.length > 0, 'no exported row is a batch price');
  for (const [name, block] of [['en', renderFieldNotes()], ['zh', renderFieldNotesZh()]]) {
    const lines = priceLines(block).filter((line) => line.includes('*(batch)*'));
    assert.equal(lines.length, batch.length, `${name}: a batch price is unlabelled`);
    assert.ok(block.includes('(batch)'), `${name}: nothing explains what batch means`);
  }
});

test('one model occupies one row', () => {
  // `MiniMax M3` and `MiniMax M3 batch` cost the same; five rows of two models
  // would answer "what do I move to" with one option.
  const names = FIELD_NOTES_PRICES.rows.map((row) => row.model);
  assert.equal(new Set(names).size, names.length, `duplicated model: ${names.join(', ')}`);
});

test('every model in the catalog table reaches both rendered READMEs', () => {
  for (const row of FIELD_NOTES_PRICES.rows) {
    for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
      assert.ok(readme.includes(row.model), `${name} is missing ${row.model}`);
    }
  }
});

test("today's prices come before the quoted sentences, in both editions", () => {
  // Order is the whole change. The reader arrived because a free tier ran
  // out; the first table they meet has to be the one that answers that, not
  // the four models somebody happened to write about.
  for (const [name, block] of [['en', renderFieldNotes()], ['zh', renderFieldNotesZh()]]) {
    const catalog = block.indexOf(FIELD_NOTES_PRICES.rows[0].model);
    const quoted = block.indexOf(FIELD_NOTES_ROWS[0].context);
    assert.ok(catalog > -1 && quoted > -1, `${name}: a table is missing`);
    assert.ok(catalog < quoted, `${name}: the quoted figures come first`);
  }
});

test('a catalog that lost its rows, its date or its count refuses to render', () => {
  const good = { source_name: 'OpenRouter', checked: '2026-08-22', total: 60, rows: [{ model: 'x' }] };
  assert.deepEqual(validatePrices(good, 'fixture'), good);
  // An empty table is not "today's fetch failed" — the exporter leaves
  // yesterday's file alone when the fetch fails. It means the file was lost,
  // and a README missing one table looks exactly like one that never had it.
  assert.throws(() => validatePrices({ ...good, rows: [] }, 'fixture'), /has no rows/);
  assert.throws(() => validatePrices({ ...good, checked: '' }, 'fixture'), /missing checked/);
  assert.throws(() => validatePrices({ ...good, source_name: '' }, 'fixture'), /missing checked/);
  // "60 models" printed above five rows is fine; "2 models" above five is the
  // table contradicting its own first line.
  assert.throws(() => validatePrices({ ...good, total: 0 }, 'fixture'), /claims 0 models/);
});

/* ------------------------------------------------- the block on the pages */

// Two of the 86 generated pages linked the write-ups at all, and both were
// home pages. These check the block that changed that: that it reaches the
// pages whose own subject a figure names, that it reaches no other page, and
// that the sentence survives the trip.

const { figuresForFamilies } = await import('../src/field-notes.js');
const { MODEL_FAMILIES, clientVendors } = await import('../src/pages.js');
const { renderArtifacts } = await import('../src/render.js');
const { LOCALES } = await import('../src/site.js');

const pageProviders = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const pageChangelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const pages = renderArtifacts(pageProviders, pageChangelog);

test('the machine index still points at the rendered page', async () => {
  // Unchanged and deliberately so: `llms.txt` is read by crawlers, and there
  // the rendered page wins — own title, own description, a sitemap entry, and
  // the numbers attributed to the site rather than to github.com.
  const { FIELD_NOTES_TABLE } = await import('../src/field-notes.js');
  assert.match(FIELD_NOTES_TABLE, /^https:\/\/xyzs996\.github\.io\//);
  assert.ok(!FIELD_NOTES_TABLE.includes('/blob/'), FIELD_NOTES_TABLE);
  // `pages` is built at the bottom of this file; test bodies run after the
  // module finishes evaluating, so it is populated by the time this reads it.
  assert.ok(pages['docs/llms.txt'].includes(FIELD_NOTES_TABLE), 'llms.txt lost the table link');
});

test('a reader is sent to the repository, in the language they are reading', async () => {
  // ⚠ The opposite of the test above, and on purpose. Measured 2026-08-21:
  // the field-notes repository has 5 views, 3 uniques, 0 stars, and its
  // `traffic/popular/referrers` is an **empty list** — while every reader-
  // facing link here pointed at Pages, which cannot produce a referral to a
  // repository. The same API shows `xyzs996.github.io` referring 7 uniques to
  // the proxy repository, which does link back. A star and an issue thread
  // live on the repository and nowhere else.
  const { fieldNotesUrl, FIELD_NOTES_REPO } = await import('../src/field-notes.js');
  assert.equal(fieldNotesUrl('en'), FIELD_NOTES_REPO);
  assert.equal(fieldNotesUrl('zh'), `${FIELD_NOTES_REPO}/blob/main/README_CN.md`);
  // An unknown locale falls back to the repository, never to Pages.
  assert.equal(fieldNotesUrl('pt'), FIELD_NOTES_REPO);

  // ⚠ Assert on the **block**, not on the README. Reverting this one link to
  // the Pages table reddened nothing when the assertion was `readme.includes`:
  // both READMEs name the repository elsewhere — a badge, the related-projects
  // list — so the whole-file check passed while the lede pointed at Pages.
  const { FIELD_NOTES_TABLE } = await import('../src/field-notes.js');
  for (const [name, block, code] of [['en', renderFieldNotes(), 'en'], ['zh', renderFieldNotesZh(), 'zh']]) {
    assert.ok(block.includes(`](${fieldNotesUrl(code)})`), `${name} block is missing the repository link`);
    assert.ok(!block.includes(FIELD_NOTES_TABLE), `${name} block still links the Pages table`);
  }

  // And it has to actually reach both rendered READMEs — the previous version
  // of this link was correct in the source and stale in the file for a day.
  for (const [name, readme, code] of [['README.md', readmeEn, 'en'], ['README_zh.md', readmeZh, 'zh']]) {
    assert.ok(readme.includes(fieldNotesUrl(code)), `${name} is missing the repository link`);
    assert.ok(!readme.includes('llm-api-pricing/blob/main/figures.md'), `${name} still links the blob`);
  }
  // The Chinese README must not hand its reader the English root: that is the
  // exact defect this replaced, and `includes` alone would pass either way,
  // because the root URL is a prefix of the Chinese one.
  assert.ok(
    !readmeZh.includes(`(${FIELD_NOTES_REPO})`),
    'README_zh.md still opens the English README',
  );
});

test('the pages send a reader to the repository too, per locale', async () => {
  // The home page of this site is where 72 of 73 unique visitors land, so the
  // one link on it that leaves for the field notes is the whole channel.
  const { fieldNotesUrl } = await import('../src/field-notes.js');
  const artifacts = pages;
  for (const [path, code] of [['docs/index.html', 'en'], ['docs/zh/index.html', 'zh']]) {
    const html = artifacts[path];
    assert.ok(html, `${path} was not rendered`);
    assert.ok(html.includes(fieldNotesUrl(code)), `${path} is missing the repository link`);
    assert.ok(
      !html.includes('href="https://xyzs996.github.io/llm-api-pricing/"'),
      `${path} still sends its reader to Pages`,
    );
  }
});

// The subject of each page that is allowed to carry a block, by path.
function subjectsByPath() {
  const out = new Map();
  for (const { path_prefix: prefix } of LOCALES) {
    for (const family of MODEL_FAMILIES) {
      out.set(`docs/${prefix}model/${family.id}.html`, [family]);
    }
    for (const [id, vendor] of Object.entries(clientVendors)) {
      out.set(`docs/${prefix}client/${id}.html`, [{ name: null, vendor }]);
    }
  }
  return out;
}

test('a figure reaches every page whose own subject its sentence names', () => {
  const subjects = subjectsByPath();
  let carried = 0;

  for (const [path, expected] of subjects) {
    const rows = figuresForFamilies(expected);
    if (rows.length === 0) continue;
    const html = pages[path];
    assert.ok(html, `${path} is not generated`);

    for (const row of rows) {
      // Verbatim. A quoted sentence that arrives truncated still reads as a
      // sentence, which is how a mangled quote gets past a reader.
      assert.ok(
        html.includes(row.context.replaceAll("'", '&#39;')),
        `${path} is missing the sentence for ${row.value}`,
      );
      assert.ok(html.includes(readerUrl(row)), `${path} quotes ${row.value} without linking the write-up`);
      // No `rel="noreferrer"` on this one: it is the link whose clicks have to
      // be countable on the other end.
      assert.ok(
        html.includes(`<a href="${readerUrl(row)}">`),
        `${path} strips the referrer from the write-up link`,
      );
    }
    carried += 1;
  }

  // A guard against the whole thing silently matching nothing: the map above
  // could go empty and every assertion in the loop would pass by vacancy.
  assert.ok(carried >= 12, `only ${carried} pages carry a figure`);
});

test('no page carries a figure whose sentence does not name it', () => {
  const subjects = subjectsByPath();

  for (const [path, html] of Object.entries(pages)) {
    if (!path.endsWith('.html')) continue;
    // The two home pages carry the whole table by design; they are the surface
    // this block was modelled on, not a page it decorates.
    if (/^docs\/([a-z-]+\/)?index\.html$/.test(path)) continue;

    const allowed = new Set(figuresForFamilies(subjects.get(path) ?? []).map((row) => row.context));
    for (const row of FIELD_NOTES_ROWS) {
      if (allowed.has(row.context)) continue;
      assert.ok(
        !html.includes(row.context.replaceAll("'", '&#39;')),
        `${path} quotes a figure about something else: ${row.value}`,
      );
    }
  }
});

test('the 25 provider pages are left alone, because they measured as having no room', () => {
  // Not an oversight and not a to-do. Every version of the block put the
  // closest pair of Chinese provider pages between 0.594 and 0.612 against the
  // suite's 0.60 near-duplicate limit, from a baseline of 0.553. If someone
  // adds it there, `pages-uniqueness.test.js` is the test that should stop
  // them; this one says out loud that the absence is a decision.
  for (const { path_prefix: prefix } of LOCALES) {
    for (const provider of pageProviders) {
      const html = pages[`docs/${prefix}provider/${provider.id}.html`];
      if (!html) continue;
      for (const row of FIELD_NOTES_ROWS) {
        assert.ok(
          !html.includes(row.context.replaceAll("'", '&#39;')),
          `provider/${provider.id} grew a figures block`,
        );
      }
    }
  }
});

/* -------------------------------------------- the one thing a reader can do */

// Every earlier version of this block ended on a link to an article. The table
// prints only the prices whose published sentence names this page's own
// subject, so the commonest thought it leaves a reader with is "the one I am
// moving to is not in here" — and an article cannot answer that. These check
// the line that can: one field, on the repository, labelled with where the
// click came from.

test('the form link opens the form, not the chooser, and says where it came from', async () => {
  const { figureAskUrl, FIELD_NOTES_REPO } = await import('../src/field-notes.js');
  const url = figureAskUrl('free-llm-api/model/glm');

  assert.ok(url.startsWith(`${FIELD_NOTES_REPO}/issues/new?`), url);
  // `/choose` returns 200 and opens the form with every field blank, which is
  // why this asserts the template parameter rather than that the link works.
  assert.ok(!url.includes('/choose'), url);
  assert.match(url, /[?&]template=figure\.yml(&|$)/);
  assert.match(url, /[?&]came_from=free-llm-api%2Fmodel%2Fglm(&|$)/);
  // No origin means no `came_from` at all rather than an invented one.
  assert.ok(!figureAskUrl('').includes('came_from'), figureAskUrl(''));
});

test('both READMEs end the block on something a reader can do', async () => {
  const { figureAskUrl } = await import('../src/field-notes.js');
  for (const [name, block, readme] of [
    ['en', renderFieldNotes(), readmeEn],
    ['zh', renderFieldNotesZh(), readmeZh],
  ]) {
    const asks = [...block.matchAll(/\]\((https:\/\/github\.com\/[^)]*issues\/new[^)]*)\)/g)];
    assert.equal(asks.length, 1, `${name} block has ${asks.length} form links`);
    const url = asks[0][1];
    assert.match(url, /[?&]template=figure\.yml(&|$)/);
    // The two READMEs must not report the same origin, or the answers arrive
    // unable to say which of them produced them.
    assert.match(url, /came_from=free-llm-api%2FREADME/);
    // And it has to survive the trip into the rendered file. The previous link
    // in this block was right in the source and a day stale in README.md.
    assert.ok(readme.includes(url), `${name} README never got the form link`);
  }
  assert.notEqual(
    renderFieldNotes().includes(figureAskUrl('free-llm-api/README.md')),
    renderFieldNotesZh().includes(figureAskUrl('free-llm-api/README.md')),
    'both READMEs report the same origin',
  );
});

test('every page that prints the table also prints the ask, labelled with itself', () => {
  const subjects = subjectsByPath();
  let carried = 0;

  for (const [path, expected] of subjects) {
    if (figuresForFamilies(expected).length === 0) continue;
    const html = pages[path];
    // `docs/zh/model/glm.html` → `free-llm-api/zh/model/glm`, so an answer
    // arrives naming the page and the language that produced it.
    const origin = `free-llm-api/${path.replace(/^docs\//, '').replace(/\.html$/, '')}`;
    const wanted = `template=figure.yml&amp;came_from=${encodeURIComponent(origin).replaceAll('%2F', '%2F')}`;
    assert.ok(html.includes(wanted), `${path} is missing its own form link`);
    // Countable on the other end: `externalLink` would add `rel="noreferrer"`
    // and the click would be invisible to the repository it lands on.
    assert.ok(!/noreferrer[^<]*issues\/new/.test(html), `${path} strips the referrer from the ask`);
    carried += 1;
  }

  assert.ok(carried >= 12, `only ${carried} pages carry the ask`);
});

test('the closing line names its own page, because an identical one is boilerplate', () => {
  // These pages are measured against each other at a 0.60 near-duplicate limit
  // and already sit around 0.55 before this block. A line repeated verbatim on
  // all twelve is exactly the shared framing that measurement exists to catch.
  const lines = [];
  for (const [path, expected] of subjectsByPath()) {
    if (figuresForFamilies(expected).length === 0) continue;
    const html = pages[path];
    const line = html.split('\n').find((row) => row.includes('issues/new'));
    assert.ok(line, `${path} has no closing line`);
    lines.push(line.replace(/came_from=[^"&]*/, ''));
  }
  assert.ok(lines.length >= 12);
  // Distinct once the URL's own page-specific part is removed: what is left is
  // the sentence, and the sentence has to differ too.
  assert.ok(new Set(lines).size >= 6, `${new Set(lines).size} distinct closing lines across ${lines.length} pages`);
});

test('a digit may follow the name in a quoted sentence, a letter may not', () => {
  // The published sentences write "GLM5.2", where a trailing word boundary
  // fails on the digit and the GLM family would silently stop matching. The
  // other half of the rule is that "Meta" must not match "metadata".
  const glm = MODEL_FAMILIES.find(({ id }) => id === 'glm');
  assert.ok(figuresForFamilies([glm]).length > 0, 'GLM5.2 no longer matches the GLM family');

  assert.equal(figuresForFamilies([{ name: 'Met', vendor: null }]).length, 0);
  assert.equal(figuresForFamilies([{ name: 'Anthropi', vendor: null }]).length, 0);
});

// ⚠ **The exit existed and reached 14 of 86 pages.** Measured 2026-08-22 by
// fetching every URL in the live sitemap: 72 of them contained the string
// `llm-api-pricing` zero times — every per-client, per-model,
// per-provider and comparison page, which is exactly where the long-tail
// queries land. The pages that did carry it were the ones whose *body* quotes
// a cost figure, so every criterion that asked "does a page link the write-ups"
// picked one of those and passed.
//
// This one counts instead of sampling: every rendered HTML artifact, and the
// link has to be in the footer, which is the one element they all share.
test('every rendered page, not a lucky sample, carries the way out to the write-ups', async () => {
  const renderer = await import('../src/render.js');
  const { fieldNotesUrl } = await import('../src/field-notes.js');
  const artifacts = renderer.renderArtifacts(await loadProviders(), await loadChangelog());

  const pages = Object.entries(artifacts).filter(([path]) => path.endsWith('.html'));
  assert.ok(pages.length > 40, `only ${pages.length} pages to check`);

  for (const [path, html] of pages) {
    const footer = html.split('<footer>')[1] ?? '';
    const want = fieldNotesUrl(path.startsWith('docs/zh/') ? 'zh' : 'en');
    assert.ok(
      footer.includes(`href="${want}"`),
      `${path} ends without an exit to the write-ups`,
    );
  }
});

// A Chinese page handing its reader the English root is the same defect the
// header link had until 2026-08-21, and `includes` alone passes either way:
// the English URL is a prefix of the Chinese one.
test('the Chinese pages send their readers to the Chinese README', async () => {
  const renderer = await import('../src/render.js');
  const { FIELD_NOTES_REPO } = await import('../src/field-notes.js');
  const artifacts = renderer.renderArtifacts(await loadProviders(), await loadChangelog());

  const zh = Object.entries(artifacts).filter(([path]) => path.startsWith('docs/zh/') && path.endsWith('.html'));
  assert.ok(zh.length > 20, `only ${zh.length} Chinese pages to check`);

  for (const [path, html] of zh) {
    const footer = html.split('<footer>')[1] ?? '';
    assert.ok(!footer.includes(`href="${FIELD_NOTES_REPO}"`), `${path} hands a Chinese reader the English root`);
  }
});
