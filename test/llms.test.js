import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { FIELD_NOTES_ROWS, readerUrl } from '../src/field-notes.js';
import { renderLlms } from '../src/llms.js';
import { renderArtifacts } from '../src/render.js';
import { SITE_URL } from '../src/site.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const artifacts = renderArtifacts(providers, changelog);
const llms = artifacts['docs/llms.txt'];

// Every address the site actually publishes, keyed the way a link would write
// it. A generated file is served at its path under the site root, and a
// directory index is served at its directory.
const published = new Set(Object.keys(artifacts)
  .filter((path) => path.startsWith('docs/'))
  .map((path) => `${SITE_URL}${path.slice('docs/'.length).replace(/(^|\/)index\.html$/, '$1')}`));

function ownLinks(text) {
  return [...text.matchAll(/\]\((https:\/\/[^)]+)\)/g)]
    .map(([, url]) => url)
    .filter((url) => url.startsWith(SITE_URL));
}

test('the file exists and is the one a crawler asks for by name', () => {
  assert.ok(llms, 'no docs/llms.txt was generated');
  assert.ok(llms.startsWith('# Free LLM API\n'), 'llms.txt does not open with the site name');
  assert.match(llms, /^> .+/m, 'llms.txt has no one-line summary under the title');
});

test('every provider in the catalog gets a line, not only the ones with a page', () => {
  // The renderer withholds a page from a provider carrying too few sourced
  // facts. That is right for a page and wrong here: the facts it does have are
  // what this file is for, and leaving it out would report a smaller catalog
  // than `providers.json` and the home page both show.
  for (const provider of providers) {
    const line = llms.split('\n').find((row) => row.includes(`[${provider.name}]`));
    assert.ok(line, `${provider.id} has no line in llms.txt`);
    assert.ok(
      line.includes(provider.source_checked_at),
      `${provider.id} is listed without the date its sources were read`,
    );
    const { requests_per_minute: rpm, requests_per_day: rpd } = provider.limits;
    if (rpm !== null) assert.ok(line.includes(`${rpm} requests/minute`), `${provider.id} drops its per-minute limit`);
    if (rpd !== null) assert.ok(line.includes(`${rpd} requests/day`), `${provider.id} drops its per-day limit`);
  }

  assert.equal(
    llms.match(/^- \[/gm).length >= providers.length,
    true,
    'llms.txt lists fewer entries than the catalog has providers',
  );
});

test('a provider that publishes no number says so in words rather than going silent', () => {
  // A line that simply omits the limit reads as a provider with no limit at
  // all, which is the opposite of what the field means.
  const wordless = providers.filter(
    ({ limits }) => limits.requests_per_minute === null && limits.requests_per_day === null,
  );
  assert.ok(wordless.length > 0, 'no provider in the fixture documents its limits without a number');

  for (const provider of wordless) {
    const line = llms.split('\n').find((row) => row.includes(`[${provider.name}]`));
    const facts = line.slice(line.indexOf('): ') + 3).split(' · ');
    // Category, limit, card, compatibility, date — the limit is the second.
    assert.ok(
      facts[1] && facts[1] !== facts[0],
      `${provider.id} reports its limit as a repeat of its category: ${line}`,
    );
  }
});

test('no address in the file is one the renderer did not produce', () => {
  // The sitemap is built from the artifacts for this reason and this file is
  // built from them for the same one: an address in a machine-read index that
  // answers 404 is worse than an address that was never offered.
  const links = ownLinks(llms);
  assert.ok(links.length >= 30, `only ${links.length} of the site's own addresses are named`);

  for (const url of links) {
    assert.ok(published.has(url), `llms.txt names ${url}, which is not generated`);
  }
});

test('every price arrives with the sentence it was published in and the write-up it came from', () => {
  // The whole point of the sibling table is that a bare `$1` is ambiguous
  // between per million tokens, per month and per seat. A list that kept the
  // number and dropped the sentence would put that ambiguity back.
  for (const row of FIELD_NOTES_ROWS) {
    assert.ok(llms.includes(row.value), `llms.txt drops the figure ${row.value}`);
    assert.ok(llms.includes(row.context), `llms.txt quotes ${row.value} without its sentence`);
    assert.ok(llms.includes(readerUrl(row)), `llms.txt quotes ${row.value} without linking the write-up`);
  }
});

test('an unfamiliar limit status is reported as itself rather than dropped', () => {
  // The catalog has fourteen of these and gains one whenever a provider
  // invents a new way to not publish a number. The failure to avoid is a line
  // that silently loses its limit when that happens.
  const invented = providers.map((provider) => (provider.id === 'groq' ? {
    ...provider,
    limits: { ...provider.limits, requests_per_minute: null, requests_per_day: null, status: 'documented-in-moon-phases' },
  } : provider));

  const rendered = renderLlms(invented, artifacts);
  const line = rendered.split('\n').find((row) => row.includes('[GroqCloud]'));
  assert.ok(
    line.includes('documented-in-moon-phases'),
    `an unmapped status vanished from the line: ${line}`,
  );
});

test('the catalog counts in the summary are the ones the catalog holds', () => {
  const cardFree = providers.filter(({ credit_card_required: card }) => !card).length;
  const summary = llms.split('\n').find((row) => row.startsWith('> '));
  assert.ok(summary.includes(`${providers.length} API providers`), `summary miscounts providers: ${summary}`);
  assert.ok(summary.includes(`${cardFree} of them without a credit card`), `summary miscounts card-free providers: ${summary}`);
});

// This file is read by the one visitor the family gets for free: an answer
// engine that found the catalog on its own. Until the section below existed it
// named no other address in the family, so that visitor left with the free
// tiers and nothing else — including no way to reach the prices that replace a
// free tier once it ends, which is the next question anybody asks.
test('the machine index names the sibling indexes, and only ones this family publishes', async () => {
  const { SIBLING_INDEXES } = await import('../src/field-notes.js');
  assert.ok(SIBLING_INDEXES.length >= 3);

  for (const { url, note } of SIBLING_INDEXES) {
    assert.match(url, /^https:\/\/xyzs996\.github\.io\/[a-z0-9-]+\/llms\.txt$/);
    assert.ok(llms.includes(url), `llms.txt drops the sibling index ${url}`);
    // A bare list of addresses makes the reader fetch all three to find out
    // which one it wanted. Each line says what is behind it.
    assert.ok(llms.includes(note), `llms.txt lists ${url} with no description`);
    assert.ok(note.length > 40, `${url} is described in too few words to choose by`);
  }

  // And it does not point at itself: a reader already holding this file gains
  // nothing from a line telling it to fetch this file.
  assert.ok(!SIBLING_INDEXES.some(({ url }) => url.includes('/free-llm-api/')));
});

// The one shape in this file an answer engine quotes whole is a question next
// to one address. Every entry in it pointed back into this repository, which is
// where every citation it earned landed — while the sibling supplying the
// prices above sat at three unique visitors and an empty referrer list.
test('the questions that start where the free tiers end link the sibling, not this repo', () => {
  const section = llms.split('## Questions answered in full')[1].split('\n## ')[0];
  // ⚠ Selected by "does not point back here", not by the sibling's repo name.
  // The name is no longer in every one of these lines: a write-up published on
  // Medium first is linked at its original, which carries neither repo's name.
  // Filtering on the name silently dropped that entry and the count fell to
  // two, which is the same defect this test exists to catch, wearing a
  // different hat.
  const sibling = section
    .split('\n')
    .filter((line) => line.startsWith('- **') && !line.includes('free-llm-api'));
  assert.ok(sibling.length >= 3, `only ${sibling.length} questions reach the sibling`);

  for (const line of sibling) {
    // A question and an address is the whole shape; a line that lost either one
    // is not quotable as an answer.
    assert.match(line, /^- \*\*[^*]+\?\*\* —/, `not phrased as a question: ${line.slice(0, 60)}…`);
    // ⚠ The sentence has to be there too. Without it the line asserts a claim
    // in this file's own voice, and this file has no business making claims
    // about somebody else's prices.
    const quoted = line.match(/"([^"]+)"/);
    assert.ok(quoted, `no quoted sentence: ${line.slice(0, 60)}…`);
    const row = FIELD_NOTES_ROWS.find(({ context }) => context === quoted[1]);
    assert.ok(row, `quotes a sentence no exported figure carries: ${quoted[1].slice(0, 50)}…`);
    // And the address is the row's own, not one typed next to the question.
    assert.ok(line.includes(readerUrl(row)), `${row.value} is quoted under someone else's link`);
  }
});

test('a question whose figure the export drops prints nothing, rather than a stale link', async () => {
  // The questions are written by hand and the answers are not. When the sibling
  // stops publishing the figure one of them rests on, the honest outcome is a
  // missing line — not a question still pointing at a write-up that no longer
  // argues it.
  const { renderLlms } = await import('../src/llms.js');
  const full = renderLlms(providers, artifacts);
  assert.ok(full.includes('gross margin sits behind'));

  const dropped = FIELD_NOTES_ROWS.filter(({ value }) => value !== '$1');
  const before = FIELD_NOTES_ROWS.splice(0, FIELD_NOTES_ROWS.length, ...dropped);
  try {
    const thinner = renderLlms(providers, artifacts);
    assert.ok(!thinner.includes('gross margin sits behind'), 'the question outlived its figure');
    // The other two are untouched, so this is a dropped line and not a dropped
    // section.
    assert.ok(thinner.includes('Are Chinese models actually cheaper'));
  } finally {
    FIELD_NOTES_ROWS.splice(0, FIELD_NOTES_ROWS.length, ...before);
  }
});
