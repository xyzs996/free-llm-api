// What this block is for is that it carries numbers. The version it replaced
// described a table of figures and contained no figure at all, and nothing in
// this suite noticed, because "the paragraph is present" was the only thing
// ever asserted about it. So the first test here counts digits.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  FIELD_NOTES_ROWS,
  renderFieldNotes,
  renderFieldNotesZh,
} from '../src/field-notes.js';

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
      assert.ok(readme.includes(row.url), `${name} is missing the link for that row`);
    }
  }
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

test('the table link goes to the rendered page, not a GitHub blob', async () => {
  // A blob URL renders the markdown inside GitHub's own chrome, so a reader
  // lands in a file viewer and a crawler attributes the numbers to github.com.
  // The rendered page carries its own title, description and sitemap entry.
  const { FIELD_NOTES_TABLE } = await import('../src/field-notes.js');
  assert.match(FIELD_NOTES_TABLE, /^https:\/\/xyzs996\.github\.io\//);
  assert.ok(!FIELD_NOTES_TABLE.includes('/blob/'), FIELD_NOTES_TABLE);

  // And it has to actually reach both rendered READMEs — the previous version
  // of this link was correct in the source and stale in the file for a day.
  for (const [name, readme] of [['README.md', readmeEn], ['README_zh.md', readmeZh]]) {
    assert.ok(readme.includes(FIELD_NOTES_TABLE), `${name} is missing the table link`);
    assert.ok(!readme.includes('ai-coding-field-notes/blob/main/figures.md'), `${name} still links the blob`);
  }
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
      assert.ok(html.includes(row.url), `${path} quotes ${row.value} without linking the write-up`);
      // No `rel="noreferrer"` on this one: it is the link whose clicks have to
      // be countable on the other end.
      assert.ok(
        html.includes(`<a href="${row.url}">`),
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

test('a digit may follow the name in a quoted sentence, a letter may not', () => {
  // The published sentences write "GLM5.2", where a trailing word boundary
  // fails on the digit and the GLM family would silently stop matching. The
  // other half of the rule is that "Meta" must not match "metadata".
  const glm = MODEL_FAMILIES.find(({ id }) => id === 'glm');
  assert.ok(figuresForFamilies([glm]).length > 0, 'GLM5.2 no longer matches the GLM family');

  assert.equal(figuresForFamilies([{ name: 'Met', vendor: null }]).length, 0);
  assert.equal(figuresForFamilies([{ name: 'Anthropi', vendor: null }]).length, 0);
});
