import { embedJson, escapeHtml, plainText } from './html.js';
import {
  DEFAULT_LOCALE,
  LOCALES,
  REPO_URL,
  SITE,
  SITE_NAME,
  SITE_URL,
  neutralPath,
  pageUrl,
} from './site.js';

export const SOCIAL_IMAGE_PATH = 'assets/social-preview.png';
const SOCIAL_IMAGE = `${SITE_URL}${SOCIAL_IMAGE_PATH}`;
const SOCIAL_IMAGE_WIDTH = '1280';
const SOCIAL_IMAGE_HEIGHT = '640';
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
const OG_LOCALES = Object.freeze({ en: 'en_US', zh: 'zh_CN' });
const CATALOG_NAME = 'Free LLM API provider catalog';
const LICENSE_URL = 'https://opensource.org/licenses/MIT';

const PUBLISHER = Object.freeze({
  '@type': 'Organization',
  name: SITE_NAME,
  url: REPO_URL,
});

/* ------------------------------------------------------------------- head */

export function alternateLinks(path) {
  const neutral = neutralPath(path);
  return [
    ...LOCALES.map((locale) => ({ hreflang: locale.hreflang, href: pageUrl(neutral, locale) })),
    { hreflang: 'x-default', href: pageUrl(neutral, DEFAULT_LOCALE) },
  ];
}

function metaProperty(property, content) {
  return `<meta property="${property}" content="${escapeHtml(content)}">`;
}

function metaName(name, content) {
  return `<meta name="${name}" content="${escapeHtml(content)}">`;
}

// Pages that may never load a third-party script, whatever a caller asks for.
// The key checker promises that what you paste reaches one provider and
// nothing else, and a promise a future edit can switch off is not one.
export const ANALYTICS_EXCLUDED_PATHS = Object.freeze(new Set(['verify.html']));

// Returns the shared part of every `<head>`: the identity of the page (canonical
// and alternates), how it should look when shared, its structured data, and —
// only where it is allowed — the analytics beacon.
export function renderHead({
  path,
  title,
  description,
  locale = DEFAULT_LOCALE,
  jsonLd = [],
  analytics = true,
  site = SITE,
}) {
  const url = pageUrl(neutralPath(path), locale);
  const lines = [
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...alternateLinks(path).map(({ hreflang, href }) => (
      `<link rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}">`
    )),
    metaName('robots', 'index, follow, max-image-preview:large, max-snippet:-1'),
    metaProperty('og:type', 'website'),
    metaProperty('og:site_name', SITE_NAME),
    metaProperty('og:title', title),
    metaProperty('og:description', description),
    metaProperty('og:url', url),
    metaProperty('og:locale', OG_LOCALES[locale.code] ?? locale.code),
    metaProperty('og:image', SOCIAL_IMAGE),
    metaProperty('og:image:width', SOCIAL_IMAGE_WIDTH),
    metaProperty('og:image:height', SOCIAL_IMAGE_HEIGHT),
    metaName('twitter:card', 'summary_large_image'),
    metaName('twitter:title', title),
    metaName('twitter:description', description),
    metaName('twitter:image', SOCIAL_IMAGE),
  ];

  // Both tokens are public site identifiers rather than secrets, and an unset
  // one emits nothing at all instead of an empty attribute a crawler would
  // read as a broken declaration.
  if (site.google_site_verification) {
    lines.push(metaName('google-site-verification', site.google_site_verification));
  }

  for (const node of jsonLd) {
    lines.push(`<script type="application/ld+json">${embedJson(node)}</script>`);
  }

  if (analytics && site.cloudflare_beacon_token && !ANALYTICS_EXCLUDED_PATHS.has(neutralPath(path))) {
    const beacon = JSON.stringify({ token: site.cloudflare_beacon_token });
    lines.push(`<script defer src="${BEACON_SRC}" data-cf-beacon='${escapeHtml(beacon)}'></script>`);
  }

  return lines.map((line) => `\n  ${line}`).join('');
}

/* -------------------------------------------------------- structured data */

function node(type, fields) {
  return { '@context': 'https://schema.org', '@type': type, ...fields };
}

export function webSiteNode(description) {
  return node('WebSite', {
    name: SITE_NAME,
    url: SITE_URL,
    description,
    inLanguage: LOCALES.map(({ hreflang }) => hreflang),
    publisher: PUBLISHER,
  });
}

export function catalogDatasetNode({ description, checkedAt, providerCount }) {
  return node('Dataset', {
    name: CATALOG_NAME,
    description,
    url: SITE_URL,
    identifier: `${REPO_URL}/blob/main/data/providers.json`,
    license: LICENSE_URL,
    isAccessibleForFree: true,
    dateModified: checkedAt,
    creator: PUBLISHER,
    keywords: [
      'free LLM API',
      'free API tier',
      'LLM rate limits',
      'OpenAI-compatible endpoint',
    ],
    variableMeasured: [
      'requests per minute',
      'requests per day',
      'credit card requirement',
      'OpenAI protocol compatibility',
      'browser reachability',
    ],
    size: `${providerCount} providers`,
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: `${SITE_URL}providers.json`,
    }],
  });
}

export function providerDatasetNode(provider) {
  return node('Dataset', {
    name: `${provider.name} free tier terms`,
    description: provider.limits.summary,
    url: pageUrl(`provider/${provider.id}.html`),
    isAccessibleForFree: true,
    dateModified: provider.source_checked_at,
    creator: PUBLISHER,
    citation: provider.official_sources.map(({ title, url }) => ({
      '@type': 'CreativeWork',
      name: title,
      url,
    })),
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: CATALOG_NAME,
      url: SITE_URL,
    },
  });
}

export function faqPageNode(entries) {
  return node('FAQPage', {
    mainEntity: entries.map(({ question, answer }) => ({
      '@type': 'Question',
      name: plainText(question),
      acceptedAnswer: { '@type': 'Answer', text: plainText(answer) },
    })),
  });
}

// A crumb without an href is the page itself. Two crumbs that resolve to the
// same URL — "Free LLM API" and "Providers" both being the catalog — collapse
// into one entry, because a trail that visits an address twice is not a trail.
export function breadcrumbNode(trail, selfPath) {
  const items = [];
  const seen = new Set();

  for (const { href, text } of trail) {
    const url = pageUrl(neutralPath(href ?? selfPath));
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: plainText(text),
      item: url,
    });
  }

  return node('BreadcrumbList', { itemListElement: items });
}

export function itemListNode({ name, description, items }) {
  return node('ItemList', {
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map(({ name: itemName, url }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: itemName,
      url,
    })),
  });
}

export function howToNode({ name, description, url, tool, supply, steps }) {
  return node('HowTo', {
    name,
    description,
    url,
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: [{ '@type': 'HowToTool', name: tool }],
    supply: [{ '@type': 'HowToSupply', name: supply }],
    step: steps.map(({ name: stepName, text }, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: stepName,
      text: plainText(text),
    })),
  });
}

export function webApplicationNode({ name, description, url, features }) {
  return node('WebApplication', {
    name,
    description,
    url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and the Fetch API',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: features,
    publisher: PUBLISHER,
  });
}

export function techArticleNode({ headline, description, url, dateModified }) {
  return node('TechArticle', {
    headline,
    description,
    url,
    dateModified,
    inLanguage: DEFAULT_LOCALE.hreflang,
    author: PUBLISHER,
    publisher: PUBLISHER,
    license: LICENSE_URL,
  });
}

/* -------------------------------------------------------------- site files */

function sitemapEntry(path, lastmod) {
  const alternates = alternateLinks(path)
    .map(({ hreflang, href }) => (
      `\n    <xhtml:link rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}"/>`
    ))
    .join('');

  return `  <url>
    <loc>${escapeHtml(pageUrl(path))}</loc>${alternates}
    <lastmod>${escapeHtml(lastmod)}</lastmod>
  </url>`;
}

export function renderSitemap(paths, lastmodFor) {
  const entries = [...paths].sort().map((path) => sitemapEntry(path, lastmodFor(path)));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

export function renderRobots() {
  return `# Everything published here is meant to be indexed; nothing is gated.
User-agent: *
Allow: /

Sitemap: ${SITE_URL}sitemap.xml
`;
}

// The sitemap is derived from the artifacts that were actually produced, so a
// page cannot be generated without being listed and cannot be listed without
// being generated.
export function renderSiteFiles(providers, artifacts) {
  const checkedAt = providers.map(({ source_checked_at: date }) => date).sort().at(-1);
  const providerDates = new Map(providers.map((provider) => (
    [`provider/${provider.id}.html`, provider.source_checked_at]
  )));
  const paths = Object.keys(artifacts)
    .filter((path) => path.startsWith('docs/') && path.endsWith('.html'))
    .map((path) => path.slice('docs/'.length))
    .map((path) => (path === 'index.html' ? '' : path));

  return {
    'docs/.nojekyll': '',
    'docs/robots.txt': renderRobots(),
    // A provider page is only as current as the sources behind that provider,
    // so it reports its own review date rather than the newest one on the site.
    'docs/sitemap.xml': renderSitemap(paths, (path) => (
      providerDates.get(neutralPath(path)) ?? checkedAt
    )),
  };
}
