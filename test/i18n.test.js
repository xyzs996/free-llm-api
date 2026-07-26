import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { filterProviders } from '../docs/filter.js';
import { VERIFY_STATES, localizedVerdict, verdictFor } from '../docs/verify-contract.js';
import { plainText } from '../src/html.js';
import { LOCALE_STRINGS, dataSentence, localized, rawString, translator } from '../src/i18n.js';
import { PROBE_CLASSIFICATIONS } from '../src/probe-contract.js';
import { renderArtifacts } from '../src/render.js';
import { DEFAULT_LOCALE, LOCALES, artifactUrl } from '../src/site.js';
import { verifyStrings } from '../src/verify-page.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const artifacts = renderArtifacts(providers, changelog);

const ZH = LOCALES.find(({ code }) => code === 'zh');

// Keyed by the address each page is published at, because that is what an
// hreflang link points to. A page that names an address nothing publishes is
// the one failure this file exists to catch.
const pages = new Map(
  Object.entries(artifacts)
    .filter(([path]) => path.endsWith('.html'))
    .map(([path, html]) => [artifactUrl(path), html]),
);

function alternatesOf(html) {
  return Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
      .map(([, hreflang, href]) => [hreflang, href]),
  );
}

// The text a reader actually sees. Script blocks come out first: the checker
// embeds its provider data as JSON, and the raw ids in it are addressed to a
// script rather than to a person.
function visibleText(html) {
  return plainText(html.replaceAll(/<script[\s\S]*?<\/script>/g, ' '));
}

test('both string tables define exactly the same keys', () => {
  const [reference, ...others] = Object.entries(LOCALE_STRINGS);
  const expected = Object.keys(reference[1]).sort();

  for (const [code, table] of others) {
    const keys = Object.keys(table).sort();
    assert.deepEqual(
      keys.filter((key) => !expected.includes(key)),
      [],
      `${code} defines strings ${reference[0]} does not`,
    );
    assert.deepEqual(
      expected.filter((key) => !keys.includes(key)),
      [],
      `${code} is missing strings ${reference[0]} defines`,
    );
  }
});

test('a string the current language lacks fails the build instead of printing the other one', () => {
  const t = translator(ZH);

  assert.throws(() => t('nothing.defined'), /Missing zh string: nothing\.defined/);
  assert.throws(() => translator({ code: 'fr' }), /No string table for locale: fr/);
  // A template rendered with nothing to put in it would ship "{name}" to a
  // reader, so the placeholder itself is the failure.
  assert.throws(() => t('provider.h1'), /No value for \{name\}/);
  assert.equal(t('provider.h1', { name: 'Groq' }), 'Groq 免费额度');
});

test('a template the browser fills survives the build with its placeholder intact', () => {
  assert.equal(rawString('verify.asking', DEFAULT_LOCALE), 'Asking {name} to list its models.');
  assert.equal(rawString('verify.asking', ZH), '正在请求 {name} 列出它的模型。');
  assert.throws(() => rawString('verify.nothing', ZH), /Missing zh string/);
});

test('every page offers each published translation, and each one points back', () => {
  for (const [url, html] of pages) {
    const alternates = alternatesOf(html);

    for (const locale of LOCALES) {
      const href = alternates[locale.hreflang];
      assert.ok(href, `${url} advertises no ${locale.hreflang} edition`);
      assert.ok(pages.has(href), `${url} offers ${locale.hreflang} at ${href}, which nothing generates`);
      assert.match(
        pages.get(href),
        new RegExp(`<html lang="${locale.hreflang}">`),
        `${href} is offered as ${locale.hreflang} but does not declare it`,
      );
      // The alternates are a property of the translation set, not of one page,
      // so every member has to name the same set — otherwise the Chinese page
      // could point at an English page that never points back.
      assert.deepEqual(
        alternatesOf(pages.get(href)),
        alternates,
        `${url} and its ${locale.hreflang} edition disagree about where the set lives`,
      );
    }

    assert.ok(
      Object.values(alternates).includes(url),
      `${url} is missing from its own alternate set`,
    );
  }
});

test('the two editions publish the same pages, one per address', () => {
  const byLocale = new Map(LOCALES.map(({ hreflang }) => [hreflang, new Set()]));

  for (const [url, html] of pages) {
    const alternates = alternatesOf(html);
    const [hreflang] = LOCALES
      .filter((locale) => alternates[locale.hreflang] === url)
      .map(({ hreflang: code }) => code);
    assert.ok(hreflang, `${url} claims no locale of its own`);
    byLocale.get(hreflang).add(url);
  }

  const counts = [...byLocale].map(([hreflang, urls]) => [hreflang, urls.size]);
  assert.equal(new Set(counts.map(([, size]) => size)).size, 1, `editions differ in size: ${JSON.stringify(counts)}`);
  assert.equal(counts.reduce((total, [, size]) => total + size, 0), pages.size);
});

// The data fields the site prints as a label rather than as prose, each paired
// with the prefix its label lives under. Reading both sides from here means a
// value and its translation are checked against one list instead of two.
const LABELLED_VALUES = [
  ['category.', providers.map(({ category }) => category)],
  ['availability.', providers.map(({ availability }) => availability.status)],
  ['limitStatus.', providers.map(({ limits }) => limits.status)],
  ['probe.', Object.values(PROBE_CLASSIFICATIONS)],
  ['change.', changelog.weeks.flatMap(({ changes }) => changes.map(({ type }) => type))],
];

test('every value the catalog labels has a label in both languages', () => {
  for (const [prefix, values] of LABELLED_VALUES) {
    for (const value of new Set(values)) {
      for (const [code, table] of Object.entries(LOCALE_STRINGS)) {
        assert.ok(table[`${prefix}${value}`], `${code} has no label for ${prefix}${value}`);
      }
    }
  }
});

// A slug is an identifier for the renderer, not a word in any language. One
// reaching a Chinese page means a value was printed where a lookup belonged.
test('no Chinese page prints a raw data slug where a translated label belongs', () => {
  const slugs = new Set(LABELLED_VALUES.flatMap(([, values]) => values));

  for (const [url, html] of pages) {
    if (!url.includes('/zh/')) continue;
    const text = visibleText(html);

    for (const slug of slugs) {
      assert.doesNotMatch(
        text,
        new RegExp(`(^|[^\\w-])${slug}($|[^\\w-])`),
        `${url} shows the raw slug "${slug}"`,
      );
    }
  }
});

test('the key checker ships every verdict in both languages', () => {
  const english = verifyStrings(DEFAULT_LOCALE);
  const chinese = verifyStrings(ZH);

  for (const state of Object.values(VERIFY_STATES)) {
    for (const [code, strings] of [['en', english], ['zh', chinese]]) {
      assert.equal(typeof strings.labels[state], 'string', `${code} has no label for ${state}`);
      assert.ok(strings.explanations[state].length > 0, `${code} explains ${state} with nothing`);
    }
    assert.notEqual(chinese.labels[state], english.labels[state], `${state} was left in English`);
  }

  // The verdict logic lives in one script that both editions load, so the
  // wording is swapped in afterwards rather than branched on inside it.
  const verdict = verdictFor(VERIFY_STATES.KEY_ACCEPTED, 200);
  const localizedOne = localizedVerdict(verdict, chinese);
  assert.equal(localizedOne.label, chinese.labels[VERIFY_STATES.KEY_ACCEPTED]);
  assert.equal(localizedOne.explanation, chinese.explanations[VERIFY_STATES.KEY_ACCEPTED]);
  assert.equal(localizedOne.tone, verdict.tone, 'the tone is not wording and must not move');
  assert.equal(localizedOne.status, 200);

  // A page that ships no table, or a state a table has not caught up with,
  // keeps the English sentence rather than printing an empty result panel.
  assert.deepEqual(localizedVerdict(verdict), verdict);
  assert.deepEqual(localizedVerdict(verdict, { labels: {}, explanations: {} }), verdict);
});

test('the catalog search finds a provider by the wording in front of the reader', () => {
  const translated = providers.find(({ limits }) => limits.summary_zh);
  assert.ok(translated, 'the catalog should carry at least one translated limits summary');

  const query = translated.limits.summary_zh.slice(0, 6);
  const found = filterProviders(providers, { query });
  assert.ok(
    found.some(({ id }) => id === translated.id),
    `searching "${query}" on the Chinese catalog finds nothing`,
  );
  assert.deepEqual(filterProviders(providers, { query: translated.limits.summary }).map(({ id }) => id).includes(translated.id), true);
});

test('prose that lives in the data has a Chinese sentence for every value in use', () => {
  for (const provider of providers) {
    const note = dataSentence(provider.browser_check_note, ZH);
    assert.ok(note.length > 0, `${provider.id} has an empty browser check note`);
    assert.notEqual(note, provider.browser_check_note, `${provider.id}'s note was left in English`);
    assert.equal(dataSentence(provider.browser_check_note, DEFAULT_LOCALE), provider.browser_check_note);
  }

  assert.throws(() => dataSentence('A sentence nobody translated.', ZH), /No zh translation/);
});

test('a record without a translation still renders, in the language it has', () => {
  const record = { summary: 'English only.', note: 'English note.', note_zh: '中文注释。' };

  assert.equal(localized(record, 'summary', ZH), 'English only.');
  assert.equal(localized(record, 'note', ZH), '中文注释。');
  // The English edition reads the English field even when a translation exists.
  assert.equal(localized(record, 'note', DEFAULT_LOCALE), 'English note.');
});
