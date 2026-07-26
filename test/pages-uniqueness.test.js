import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MODEL_FAMILIES, clientPageIds } from '../src/pages.js';
import { renderArtifacts } from '../src/render.js';
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

function words(html) {
  return html
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/&[a-z#0-9]+;/g, ' ')
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9._/-]*/g) ?? [];
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
    .filter(([path]) => /^docs\/(provider|model|client)\/[a-z0-9-]+\.html$/.test(path) || path === 'docs/methodology.html')
    .map(([path, html]) => [path, bodyOf(html)]),
);

const GROUPS = {
  provider: [...bodies.keys()].filter((path) => path.startsWith('docs/provider/')),
  model: [...bodies.keys()].filter((path) => path.startsWith('docs/model/')),
  client: [...bodies.keys()].filter((path) => path.startsWith('docs/client/')),
};

test('every generated page carries a body worth reading on its own', () => {
  for (const [path, body] of bodies) {
    const count = words(body).length;
    assert.ok(count >= MINIMUM_BODY_WORDS, `${path} has ${count} body words, under ${MINIMUM_BODY_WORDS}`);
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

function sentencesOf(text) {
  return text
    .split(/(?<=[.:])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(' ').length >= MINIMUM_FACT_WORDS);
}

// A statement counts as this page's own only when no other generated page
// makes it. A provider's name is not a fact by that measure, and neither is the
// shared CORS wording; the provider's own limits sentence is.
function distinctiveFacts(path, candidates) {
  const others = [...texts].filter(([other]) => other !== path).map(([, text]) => text);

  return candidates.filter((candidate) => (
    typeof candidate === 'string'
    && candidate.split(' ').length >= MINIMUM_FACT_WORDS
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
    const path = `docs/provider/${provider.id}.html`;
    const text = texts.get(path);

    assert.ok(text.includes(plainText(provider.limits.summary)), `${path} drops the provider's own limits wording`);
    assert.ok(text.includes(plainText(provider.availability.note)), `${path} drops the provider's lifecycle note`);
    assert.ok(text.includes(provider.base_url), `${path} never names the endpoint`);
    for (const { url } of provider.official_sources) {
      assert.ok(text.includes(url), `${path} cites ${url} without showing it`);
    }

    // The provider's own documented wording appears on its page and nowhere
    // else, which is what stops 25 pages from re-stating one another.
    const elsewhere = [...texts]
      .filter(([other, body]) => other !== path && body.includes(plainText(provider.limits.summary)))
      .map(([other]) => other);
    assert.deepEqual(elsewhere, [], `${provider.id}'s limits wording is repeated on other pages`);
  }
});

test('every model family page names its members and every client page names its client', async () => {
  const { CLIENT_PAGE_TITLES } = await import('../src/pages.js');

  for (const family of MODEL_FAMILIES) {
    const text = texts.get(`docs/model/${family.id}.html`);
    assert.ok(text.includes(plainText(family.blurb)), `${family.id} drops its own description`);
    for (const member of providersInFamily(family, providers).filter(isLandingPageEligible)) {
      assert.ok(text.includes(member.name), `${family.id} omits ${member.id}`);
    }
  }

  for (const clientId of clientPageIds) {
    const text = texts.get(`docs/client/${clientId}.html`);
    assert.ok(text.includes(CLIENT_PAGE_TITLES[clientId]), `${clientId} never names the client`);
  }
});

test('the whole matrix is deterministic, so a rerun cannot quietly reshuffle it', () => {
  assert.deepEqual(renderArtifacts(structuredClone(providers), structuredClone(changelog)), artifacts);
});
