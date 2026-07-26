import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { plainText } from '../src/html.js';
import { renderArtifacts } from '../src/render.js';
import { ANALYTICS_EXCLUDED_PATHS, SOCIAL_IMAGE_PATH, renderHead } from '../src/seo.js';
import { RENDERED_LOCALES, SITE, SITE_URL } from '../src/site.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const changelog = JSON.parse(
  await readFile(new URL('../data/changelog.json', import.meta.url), 'utf8'),
);
const artifacts = renderArtifacts(providers, changelog);

// Every generated page, keyed the way it is published: the catalog lives at the
// site root, so its path is the empty string rather than `index.html`.
const pages = new Map(
  Object.entries(artifacts)
    .filter(([path]) => path.endsWith('.html'))
    .map(([path, html]) => [path === 'docs/index.html' ? '' : path.slice('docs/'.length), html]),
);
const pageUrls = new Set([...pages.keys()].map((path) => `${SITE_URL}${path}`));

function attribute(html, pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, `page has no ${label}`);
  return match[1];
}

function metaProperty(html, property) {
  return attribute(html, new RegExp(`<meta property="${property}" content="([^"]*)"`), property);
}

function metaName(html, name) {
  return attribute(html, new RegExp(`<meta name="${name}" content="([^"]*)"`), name);
}

function structuredData(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(([, json]) => JSON.parse(json));
}

function typesOn(path) {
  return structuredData(pages.get(path)).map((node) => node['@type']);
}

test('every page declares one address for itself and shares it consistently', () => {
  for (const [path, html] of pages) {
    const url = `${SITE_URL}${path}`;

    assert.equal(attribute(html, /<link rel="canonical" href="([^"]+)">/, 'canonical link'), url, path);
    assert.equal(metaProperty(html, 'og:url'), url, path);
    // A social card that advertises a different headline than the page is the
    // usual way these tags rot, so they are held to the page's own words.
    assert.equal(metaProperty(html, 'og:title'), attribute(html, /<title>([^<]*)<\/title>/, 'title'), path);
    assert.equal(metaProperty(html, 'og:description'), metaName(html, 'description'), path);
    assert.equal(metaName(html, 'twitter:title'), metaProperty(html, 'og:title'), path);
    assert.equal(metaName(html, 'twitter:description'), metaProperty(html, 'og:description'), path);
  }
});

test('every page ships a large-image social card backed by an image in the repository', async () => {
  const image = `${SITE_URL}${SOCIAL_IMAGE_PATH}`;
  const onDisk = await readFile(new URL(`../docs/${SOCIAL_IMAGE_PATH}`, import.meta.url))
    .then(() => true, () => false);
  assert.ok(onDisk, `${SOCIAL_IMAGE_PATH} is advertised but not committed`);

  for (const [path, html] of pages) {
    assert.equal(metaName(html, 'twitter:card'), 'summary_large_image', path);
    assert.equal(metaProperty(html, 'og:image'), image, path);
    assert.equal(metaProperty(html, 'og:image:width'), '1280', path);
    assert.equal(metaProperty(html, 'og:image:height'), '640', path);
    assert.equal(metaProperty(html, 'og:type'), 'website', path);
    assert.match(metaName(html, 'robots'), /^index, follow/, path);
  }
});

test('hreflang names only locales this renderer actually publishes', () => {
  const published = new Set(SITE.locales
    .filter(({ code }) => RENDERED_LOCALES.includes(code))
    .map(({ hreflang }) => hreflang));

  for (const [path, html] of pages) {
    const links = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
    const declared = links.map(([, hreflang]) => hreflang);

    assert.deepEqual(declared, [...published, 'x-default'], `${path} advertises the wrong locale set`);
    for (const [, hreflang, href] of links) {
      assert.ok(
        pageUrls.has(href),
        `${path} offers ${hreflang} at ${href}, which this renderer never generates`,
      );
    }
  }
});

// The list of rendered locales is a claim about the artifacts, so it is checked
// against them: adding a Chinese mirror without declaring it, or declaring one
// without generating it, fails here rather than in a search console months later.
test('the declared locale list matches the pages on disk', () => {
  const prefixed = SITE.locales.filter(({ path_prefix: prefix }) => prefix !== '');
  const found = new Set();

  for (const path of pages.keys()) {
    const locale = prefixed.find(({ path_prefix: prefix }) => path.startsWith(prefix));
    found.add(locale?.code ?? SITE.default_locale);
  }

  assert.deepEqual([...found].sort(), [...RENDERED_LOCALES].sort());
});

test('every structured data block parses and says what kind of thing it describes', () => {
  for (const [path, html] of pages) {
    const nodes = structuredData(html);
    assert.ok(nodes.length > 0, `${path} carries no structured data`);

    for (const node of nodes) {
      assert.equal(node['@context'], 'https://schema.org', path);
      assert.equal(typeof node['@type'], 'string', path);
      // A `</script>` inside an escaped string would end the block early and
      // leave a crawler parsing prose as JSON.
      assert.doesNotMatch(JSON.stringify(node), /<\/script/i, path);
    }
  }
});

test('each kind of page carries the structured data its content justifies', () => {
  assert.deepEqual(typesOn(''), ['WebSite', 'Dataset']);
  assert.deepEqual(typesOn('verify.html'), ['WebApplication']);
  assert.deepEqual(typesOn('methodology.html'), ['BreadcrumbList', 'TechArticle']);

  for (const path of pages.keys()) {
    if (path.startsWith('provider/')) {
      assert.deepEqual(typesOn(path), ['BreadcrumbList', 'Dataset', 'FAQPage'], path);
    }
    if (path.startsWith('model/')) assert.deepEqual(typesOn(path), ['BreadcrumbList', 'ItemList'], path);
    if (path.startsWith('client/')) assert.deepEqual(typesOn(path), ['BreadcrumbList', 'HowTo'], path);
  }
});

test('structured answers repeat the page instead of inventing a second one', () => {
  for (const [path, html] of pages) {
    if (!path.startsWith('provider/')) continue;
    const body = plainText(html.match(/<article class="page-body" id="page-body">([\s\S]*?)<\/article>/)[1]);
    const [faq] = structuredData(html).filter((node) => node['@type'] === 'FAQPage');

    assert.ok(faq.mainEntity.length >= 4, `${path} answers ${faq.mainEntity.length} questions`);
    for (const { name, acceptedAnswer } of faq.mainEntity) {
      assert.ok(body.includes(name), `${path} answers "${name}" only in its markup`);
      assert.ok(
        body.includes(acceptedAnswer.text),
        `${path} tells a crawler something the reader never sees: ${acceptedAnswer.text}`,
      );
    }
  }
});

test('every breadcrumb trail walks real pages and ends on the page itself', () => {
  for (const [path, html] of pages) {
    const [crumbs] = structuredData(html).filter((node) => node['@type'] === 'BreadcrumbList');
    if (!crumbs) continue;

    const urls = crumbs.itemListElement.map(({ item }) => item);
    assert.equal(new Set(urls).size, urls.length, `${path} visits an address twice`);
    assert.equal(urls.at(-1), `${SITE_URL}${path}`, `${path} does not end its own trail`);
    for (const url of urls) assert.ok(pageUrls.has(url), `${path} points a crumb at ${url}`);
    crumbs.itemListElement.forEach((item, index) => assert.equal(item.position, index + 1, path));
  }
});

test('the sitemap lists every generated page exactly once and nothing else', () => {
  const sitemap = artifacts['docs/sitemap.xml'];
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);

  assert.equal(new Set(locations).size, locations.length, 'the sitemap repeats a URL');
  assert.deepEqual(new Set(locations), pageUrls);
  for (const url of locations) assert.ok(url.startsWith(SITE_URL), `${url} points off this site`);
  // A sitemap entry for an address a crawler cannot follow is worse than none.
  assert.doesNotMatch(sitemap, /github\.com/);
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset /);
  assert.match(sitemap, /<\/urlset>\n$/);
});

test('each sitemap entry is dated by the sources behind that page', () => {
  const entries = [...artifacts['docs/sitemap.xml'].matchAll(
    /<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>/g,
  )];
  const newest = providers.map(({ source_checked_at: date }) => date).sort().at(-1);

  assert.equal(entries.length, pageUrls.size);
  for (const [, url, lastmod] of entries) {
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, url);
    const provider = providers.find(({ id }) => url === `${SITE_URL}provider/${id}.html`);
    assert.equal(lastmod, provider ? provider.source_checked_at : newest, url);
  }
});

test('robots.txt opens the whole site and points at the sitemap that exists', () => {
  const robots = artifacts['docs/robots.txt'];

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/\s*$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${SITE_URL}sitemap\\.xml$`, 'm'));
  assert.ok(Object.hasOwn(artifacts, 'docs/sitemap.xml'));
  assert.equal(artifacts['docs/.nojekyll'], '', 'the Jekyll opt-out is a marker, not a document');
});

test('the analytics beacon and the verification tag appear only once configured', () => {
  const shared = { title: 'Free LLM API', description: 'A catalog of free LLM API tiers.' };
  const configured = { ...SITE, cloudflare_beacon_token: 'a'.repeat(32), google_site_verification: 'gsc-token' };

  const unset = renderHead({ ...shared, path: '' });
  assert.doesNotMatch(unset, /cloudflareinsights/);
  assert.doesNotMatch(unset, /google-site-verification/);

  const home = renderHead({ ...shared, path: '', site: configured });
  assert.match(home, /<script defer src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"/);
  assert.match(home, /data-cf-beacon='\{&quot;token&quot;:&quot;a{32}&quot;\}'/);
  assert.match(home, /<meta name="google-site-verification" content="gsc-token">/);

  // The checker refuses the beacon even when a caller asks for it, so the
  // guarantee survives an edit that forgets why the flag was there.
  for (const path of ANALYTICS_EXCLUDED_PATHS) {
    const excluded = renderHead({ ...shared, path, site: configured, analytics: true });
    assert.doesNotMatch(excluded, /cloudflareinsights/, path);
    assert.match(excluded, /<meta name="google-site-verification"/, path);
  }
});

// Matching host names rather than words: "plausible" is also ordinary English
// and appears in the methodology prose, which a looser pattern would call a
// tracker. The assertion holds whether or not a beacon token is configured.
test('the only script a page may load from elsewhere is the beacon, and never on the checker', () => {
  const allowedHost = 'static.cloudflareinsights.com';

  for (const [path, html] of pages) {
    for (const [, src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
      if (!/^https?:/i.test(src)) continue;
      assert.equal(new URL(src).host, allowedHost, `${path} loads a script from somewhere unexpected`);
      assert.equal(ANALYTICS_EXCLUDED_PATHS.has(path), false, `${path} must load nothing third-party`);
    }
  }

  const verify = pages.get('verify.html');
  assert.match(verify, /This page loads no third-party script of any kind/);
  assert.match(verify, /<script type="module" src="\.\/verify\.js"><\/script>/);
  assert.doesNotMatch(
    verify.match(/content="([^"]*connect-src[^"]*)"/)[1],
    /cloudflareinsights|xyzs996\.github\.io/,
  );
});
