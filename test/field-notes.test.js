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
