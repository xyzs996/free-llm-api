import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { localized } from '../src/i18n.js';
import { MODEL_FAMILIES, clientPageIds, comparisonPageIds } from '../src/pages.js';
import { renderArtifacts } from '../src/render.js';
import { LOCALES, neutralPath } from '../src/site.js';
import { isLandingPageEligible, providersInFamily } from '../src/validate.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const artifacts = renderArtifacts(providers, changelog);

const MINIMUM_BODY_WORDS = 300;
const MAXIMUM_SIMILARITY = 0.60;
// Near-duplicate detection compares overlapping word sequences, not word bags:
// two independently written pages about rate limits share almost all of their
// vocabulary, so a bag-of-words score says nothing about whether one page was
// stamped out of the other. Three-word shingles are the classic setting and
// still leave the measurement with teeth — the worst pair here lands well
// inside the limit rather than scraping past it.
const SHINGLE_LENGTH = 3;

// Everything outside #page-body is skeleton: breadcrumb, related links, footer.
// A doorway page is one whose *body* is boilerplate, so only the body is scored.
function bodyOf(html) {
  const match = html.match(/<article class="page-body" id="page-body">([\s\S]*?)<\/article>/);
  assert.ok(match, 'page has no body element to measure');
  return match[1];
}

// Chinese writes no spaces between words, so a Latin tokenizer finds almost
// nothing on a Chinese page. Each CJK character becomes its own token, which
// turns the shingles below into character trigrams — the standard fingerprint
// for Chinese text, and the same measurement in spirit as the word trigrams
// English gets. Latin tokens are unchanged, so English scores do not move.
const CJK_CHARACTER = /[㐀-䶿一-鿿]/u;
const TOKEN = /[㐀-䶿一-鿿]|[a-z0-9][a-z0-9._/-]*/gu;

function words(html) {
  const text = html
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/&[a-z#0-9]+;/g, ' ')
    .toLowerCase();
  return [...text.matchAll(TOKEN)].map(([token]) => token);
}

// Prose like this runs about two Chinese characters to one English word, so
// substance is counted in word equivalents rather than in tokens. Otherwise an
// eight-character fragment would pass for as much content as an eight-word
// English sentence.
const CJK_CHARACTERS_PER_WORD = 2;

function wordEquivalents(tokens) {
  return tokens.reduce(
    (total, token) => total + (CJK_CHARACTER.test(token) ? 1 / CJK_CHARACTERS_PER_WORD : 1),
    0,
  );
}

// Where a generated page is published stripped of its locale, so a translation
// can be matched with the page it translates.
function neutral(path) {
  return neutralPath(path.slice('docs/'.length));
}

function isTranslation(path) {
  return neutral(path) !== path.slice('docs/'.length);
}

function originalOf(path) {
  return `docs/${neutral(path)}`;
}

function shingles(tokens) {
  const set = new Set();
  for (let index = 0; index + SHINGLE_LENGTH <= tokens.length; index += 1) {
    set.add(tokens.slice(index, index + SHINGLE_LENGTH).join(' '));
  }
  return set;
}

function jaccard(left, right) {
  let shared = 0;
  for (const item of left) if (right.has(item)) shared += 1;
  return shared / (left.size + right.size - shared);
}

const bodies = new Map(
  Object.entries(artifacts)
    .filter(([path]) => /^docs\/([a-z-]+\/)?(provider|model|client|compare)\/[a-z0-9-]+\.html$/.test(path)
      || /^docs\/([a-z-]+\/)?methodology\.html$/.test(path))
    .map(([path, html]) => [path, bodyOf(html)]),
);

// Pages are only compared with others of their kind *and* their language: a
// Chinese page and its English original share no vocabulary, so scoring them
// against each other would measure nothing and hide the pairs that matter.
const GROUPS = Object.fromEntries(
  LOCALES.flatMap(({ code, path_prefix: prefix }) => ['provider', 'model', 'client', 'compare'].map((kind) => [
    `${code}/${kind}`,
    [...bodies.keys()].filter((path) => path.startsWith(`docs/${prefix}${kind}/`)),
  ])),
);

test('every generated page carries a body worth reading on its own', () => {
  for (const [path, body] of bodies) {
    // A translation is held to its original instead, because the same content
    // is shorter in Chinese and a word count would only measure the script.
    if (isTranslation(path)) continue;
    const count = wordEquivalents(words(body));
    assert.ok(count >= MINIMUM_BODY_WORDS, `${path} has ${count} body words, under ${MINIMUM_BODY_WORDS}`);
  }
});

// The failure this catches is a translation that quietly drops a section: it
// would still read well, still pass every similarity check, and leave the
// hreflang link promising a page that says less than the one it points from.
test('a translated page carries the whole page it translates, not a summary of it', () => {
  const elements = ['h2', 'h3', 'p', 'li', 'tr', 'pre', 'a'];

  for (const [path, body] of bodies) {
    if (!isTranslation(path)) continue;
    const original = bodies.get(originalOf(path));
    assert.ok(original, `${path} translates ${originalOf(path)}, which is not generated`);

    for (const element of elements) {
      const count = (html) => (html.match(new RegExp(`<${element}[\\s>]`, 'g')) ?? []).length;
      assert.equal(
        count(body),
        count(original),
        `${path} carries a different number of <${element}> elements than ${originalOf(path)}`,
      );
    }
  }
});

test('no two pages of the same kind are near-duplicates of each other', () => {
  for (const [kind, paths] of Object.entries(GROUPS)) {
    assert.ok(paths.length >= 2, `${kind} pages cannot be compared`);
    const fingerprints = new Map(paths.map((path) => [path, shingles(words(bodies.get(path)))]));

    for (let i = 0; i < paths.length; i += 1) {
      for (let j = i + 1; j < paths.length; j += 1) {
        const score = jaccard(fingerprints.get(paths[i]), fingerprints.get(paths[j]));
        assert.ok(
          score < MAXIMUM_SIMILARITY,
          `${paths[i]} and ${paths[j]} are ${score.toFixed(3)} similar, at or over ${MAXIMUM_SIMILARITY}`,
        );
      }
    }
  }
});

// Matching happens on the rendered text a reader sees, so an escaped apostrophe
// or a tag boundary cannot make two identical sentences look different.
function plainText(html) {
  return html
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll(/\s+/g, ' ')
    .trim();
}

const texts = new Map([...bodies].map(([path, body]) => [path, plainText(body)]));

const MINIMUM_FACT_WORDS = 8;
const MINIMUM_DISTINCTIVE_FACTS = 3;

// English ends a sentence with a stop and a space; Chinese ends it with a
// full-width stop that already carries the gap, so both endings are split on.
function sentencesOf(text) {
  return text
    .split(/(?<=[.:])\s+|(?<=[。：])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => wordEquivalents(words(sentence)) >= MINIMUM_FACT_WORDS);
}

// A statement counts as this page's own only when no other generated page
// makes it. A provider's name is not a fact by that measure, and neither is the
// shared CORS wording; the provider's own limits sentence is.
//
// The same page in another language does not count as another page: an entry
// with no Chinese wording yet falls back to the English sentence, and that is
// the fallback working rather than two pages repeating each other.
function distinctiveFacts(path, candidates) {
  const others = [...texts]
    .filter(([other]) => other !== path && neutral(other) !== neutral(path))
    .map(([, text]) => text);

  return candidates.filter((candidate) => (
    typeof candidate === 'string'
    && wordEquivalents(words(candidate)) >= MINIMUM_FACT_WORDS
    && texts.get(path).includes(candidate)
    && !others.some((other) => other.includes(candidate))
  ));
}

test('every page states at least three substantive things found nowhere else on the site', () => {
  for (const path of texts.keys()) {
    const facts = distinctiveFacts(path, sentencesOf(texts.get(path)));
    assert.ok(
      facts.length >= MINIMUM_DISTINCTIVE_FACTS,
      `${path} makes ${facts.length} statements no other page makes, under ${MINIMUM_DISTINCTIVE_FACTS}`,
    );
  }
});

test('every provider page quotes that provider and cites where the wording came from', () => {
  for (const provider of providers.filter(isLandingPageEligible)) {
    for (const locale of LOCALES) {
      const path = `docs/${locale.path_prefix}provider/${provider.id}.html`;
      const text = texts.get(path);
      const summary = plainText(localized(provider.limits, 'summary', locale));

      assert.ok(text.includes(summary), `${path} drops the provider's own limits wording`);
      assert.ok(
        text.includes(plainText(localized(provider.availability, 'note', locale))),
        `${path} drops the provider's lifecycle note`,
      );
      assert.ok(text.includes(provider.base_url), `${path} never names the endpoint`);
      for (const { url } of provider.official_sources) {
        assert.ok(text.includes(url), `${path} cites ${url} without showing it`);
      }

      // The provider's own documented wording appears on its page and nowhere
      // else, which is what stops 25 pages from re-stating one another. Its
      // own translation is the one exception, since an entry with no Chinese
      // wording yet legitimately falls back to the English sentence.
      const elsewhere = [...texts]
        .filter(([other, body]) => neutral(other) !== neutral(path) && body.includes(summary))
        .map(([other]) => other);
      assert.deepEqual(elsewhere, [], `${provider.id}'s limits wording is repeated on other pages`);
    }
  }
});

test('every model family page names its members and every client page names its client', async () => {
  const { CLIENT_PAGE_TITLES } = await import('../src/pages.js');

  for (const locale of LOCALES) {
    for (const family of MODEL_FAMILIES) {
      const path = `docs/${locale.path_prefix}model/${family.id}.html`;
      const text = texts.get(path);
      assert.ok(
        text.includes(plainText(localized(family, 'blurb', locale))),
        `${path} drops the family's own description`,
      );
      for (const member of providersInFamily(family, providers).filter(isLandingPageEligible)) {
        assert.ok(text.includes(member.name), `${path} omits ${member.id}`);
      }
    }

    // A product name is the same in both languages, so the title is the one
    // string a translated client page still has to print unchanged.
    for (const clientId of clientPageIds) {
      const path = `docs/${locale.path_prefix}client/${clientId}.html`;
      assert.ok(texts.get(path).includes(CLIENT_PAGE_TITLES[clientId]), `${path} never names the client`);
    }

    for (const comparisonId of comparisonPageIds) {
      const path = `docs/${locale.path_prefix}compare/${comparisonId}.html`;
      assert.ok(texts.get(path), `${path} has no measurable comparison body`);
    }
  }
});

test('the whole matrix is deterministic, so a rerun cannot quietly reshuffle it', () => {
  assert.deepEqual(renderArtifacts(structuredClone(providers), structuredClone(changelog)), artifacts);
});
