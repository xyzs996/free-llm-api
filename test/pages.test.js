import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { findCredentialLeaks } from '../src/check.js';
import { DESCRIPTION_LIMIT, SITE_URL, TITLE_LIMIT } from '../src/page-layout.js';
import { MODEL_FAMILIES, clientPageIds } from '../src/pages.js';
import { renderArtifacts } from '../src/render.js';
import { MODEL_FAMILY_MINIMUM_PROVIDERS, isLandingPageEligible, providersInFamily } from '../src/validate.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const artifacts = renderArtifacts(providers, changelog);
const pages = Object.fromEntries(
  Object.entries(artifacts).filter(([path]) => path.endsWith('.html')),
);
const eligible = providers.filter(isLandingPageEligible);

function meta(html, name) {
  const match = html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`));
  assert.ok(match, `page is missing a ${name} meta tag`);
  return match[1];
}

function titleOf(html) {
  return html.match(/<title>([^<]*)<\/title>/)[1];
}

// Only links that stay on this site count as internal, and the target is
// resolved against the page's own directory so `../model/x.html` from a
// provider page and `./model/x.html` from the index land on the same node.
function internalLinks(path, html) {
  const directory = path.slice(0, path.lastIndexOf('/') + 1);
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map(([, href]) => href)
    .filter((href) => !/^(https?:|mailto:|#)/.test(href))
    .map((href) => new URL(href, `file:///${directory}`).pathname.replace(/^\//, ''))
    .map((target) => target.replace(/\?.*$/, ''));
}

test('every provider that earns a landing page gets exactly one', () => {
  const rendered = Object.keys(pages).filter((path) => path.startsWith('docs/provider/'));

  assert.equal(rendered.length, eligible.length);
  assert.deepEqual(
    rendered.sort(),
    eligible.map(({ id }) => `docs/provider/${id}.html`).sort(),
  );
  // The gate is the shared one, so a provider whose data thins out loses its
  // page instead of keeping a page with nothing on it.
  for (const provider of providers) {
    if (isLandingPageEligible(provider)) continue;
    assert.equal(Object.hasOwn(pages, `docs/provider/${provider.id}.html`), false);
  }
});

test('the page matrix covers every model family and every documented client', () => {
  for (const family of MODEL_FAMILIES) {
    assert.ok(Object.hasOwn(pages, `docs/model/${family.id}.html`), `${family.id} has no page`);
    assert.ok(
      providersInFamily(family, providers).length >= MODEL_FAMILY_MINIMUM_PROVIDERS,
      `${family.id} would be a page about a single provider`,
    );
  }
  for (const clientId of clientPageIds) {
    assert.ok(Object.hasOwn(pages, `docs/client/${clientId}.html`), `${clientId} has no page`);
  }
  assert.ok(Object.hasOwn(pages, 'docs/methodology.html'));
});

test('no two pages compete on the same title or the same description', () => {
  const titles = new Map();
  const descriptions = new Map();

  for (const [path, html] of Object.entries(pages)) {
    const title = titleOf(html);
    const description = meta(html, 'description');

    assert.ok(title.length > 0 && title.length <= TITLE_LIMIT, `${path} title is ${title.length} characters`);
    assert.ok(
      description.length > 0 && description.length <= DESCRIPTION_LIMIT,
      `${path} description is ${description.length} characters`,
    );
    assert.equal(titles.get(title), undefined, `${path} repeats the title of ${titles.get(title)}`);
    assert.equal(
      descriptions.get(description),
      undefined,
      `${path} repeats the description of ${descriptions.get(description)}`,
    );
    titles.set(title, path);
    descriptions.set(description, path);
  }
});

test('every page carries at least three links deeper into the site', () => {
  for (const [path, html] of Object.entries(pages)) {
    const targets = new Set(internalLinks(path, html));
    assert.ok(targets.size >= 3, `${path} offers only ${targets.size} internal destinations`);
  }
});

test('no page is an orphan and no internal link points at a page that was never generated', async () => {
  const inbound = new Map(Object.keys(pages).map((path) => [path, 0]));

  for (const [path, html] of Object.entries(pages)) {
    for (const target of new Set(internalLinks(path, html))) {
      if (target === path) continue;
      if (!target.endsWith('.html')) {
        // Stylesheets, scripts and images are checked into the repository
        // rather than generated, so the link has to resolve on disk instead.
        const exists = Object.hasOwn(artifacts, target)
          || await readFile(new URL(`../${target}`, import.meta.url)).then(() => true, () => false);
        assert.ok(exists, `${path} links to ${target}, which does not exist`);
        continue;
      }
      assert.ok(inbound.has(target), `${path} links to ${target}, which nothing generates`);
      inbound.set(target, inbound.get(target) + 1);
    }
  }

  for (const [path, count] of inbound) {
    if (path === 'docs/index.html') continue;
    assert.ok(count >= 1, `${path} is an orphan: nothing links to it`);
  }
});

test('the catalog page reaches every provider page, and every provider page reaches its families', () => {
  const index = pages['docs/index.html'];
  for (const provider of eligible) {
    assert.match(index, new RegExp(`href="\\./provider/${provider.id}\\.html"`), `${provider.id} is unreachable from the catalog`);
  }

  for (const family of MODEL_FAMILIES) {
    for (const provider of providersInFamily(family, providers)) {
      if (!isLandingPageEligible(provider)) continue;
      assert.match(
        pages[`docs/provider/${provider.id}.html`],
        new RegExp(`href="\\.\\./model/${family.id}\\.html"`),
        `${provider.id} hosts ${family.id} but never links to it`,
      );
      assert.match(
        pages[`docs/model/${family.id}.html`],
        new RegExp(`href="\\.\\./provider/${provider.id}\\.html"`),
        `${family.id} lists ${provider.id} but never links to it`,
      );
    }
  }
});

test('a model family page never becomes a page about one provider', () => {
  for (const family of MODEL_FAMILIES) {
    const members = providersInFamily(family, providers).filter(isLandingPageEligible);
    const html = pages[`docs/model/${family.id}.html`];
    const linked = new Set(
      [...html.matchAll(/href="\.\.\/provider\/([a-z0-9-]+)\.html"/g)].map(([, id]) => id),
    );

    assert.ok(
      linked.size >= MODEL_FAMILY_MINIMUM_PROVIDERS,
      `${family.id} names only ${linked.size} provider pages`,
    );
    for (const member of members) {
      assert.ok(linked.has(member.id), `${family.id} omits ${member.id}`);
    }
  }
});

test('every generated page declares a canonical URL that matches where it is written', () => {
  for (const [path, html] of Object.entries(pages)) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/);
    assert.ok(canonical, `${path} has no canonical link`);
    // A directory index canonicalises to its directory, because that is the URL
    // readers link to: the catalog is the bare site root and its translation is
    // the locale folder. Every other page canonicalises to its own file.
    const published = path.replace(/^docs\//, '').replace(/(^|\/)index\.html$/, '$1');
    const expected = `${SITE_URL}${published}`;
    assert.equal(canonical[1], expected, `${path} points its canonical URL somewhere else`);
  }
});

test('the matrix ships no credential and no misleading brand phrasing', () => {
  const banned = /free (gpt|claude|gemini|chatgpt api) key/i;

  for (const [path, html] of Object.entries(pages)) {
    assert.deepEqual(findCredentialLeaks(path, html), [], `${path} carries a credential`);
    assert.doesNotMatch(html, banned, `${path} implies a provider hands out keys`);
    assert.doesNotMatch(html, /<script>alert/);
  }
});

test('a hostile provider name cannot become markup on any generated page', () => {
  const hostile = structuredClone(providers);
  hostile[0].name = '<script>alert(1)</script>';
  hostile[0].official_sources = [{ title: '"><img onerror=alert(1)>', url: 'https://example.com/a' }];
  const rendered = renderArtifacts(hostile, changelog);

  for (const [path, html] of Object.entries(rendered)) {
    if (!path.endsWith('.html')) continue;
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/, path);
    assert.doesNotMatch(html, /<img onerror/, path);
  }
  assert.match(rendered[`docs/provider/${hostile[0].id}.html`], /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
