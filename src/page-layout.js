import { escapeHtml } from './html.js';
import { translator } from './i18n.js';
import { breadcrumbNode, renderHead } from './seo.js';
import { DEFAULT_LOCALE, LOCALES, SITE_URL, localeDepth, localePath } from './site.js';

export { SITE_URL };

export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;

// Only the depths this site actually uses, so a typo in a caller cannot
// silently produce links that resolve one directory too high. Two is a page
// inside a section inside a translated mirror.
const PREFIXES = Object.freeze({ 0: './', 1: '../', 2: '../../' });

export function relativePrefix(depth) {
  const prefix = PREFIXES[depth];
  if (prefix === undefined) throw new Error(`Unsupported page depth: ${depth}`);
  return prefix;
}

function renderBreadcrumb(trail, prefix, label) {
  const items = trail.map(({ href, text }, index) => {
    const cell = index === trail.length - 1 || !href
      ? `<span aria-current="page">${escapeHtml(text)}</span>`
      : `<a href="${escapeHtml(prefix + href)}">${escapeHtml(text)}</a>`;
    return `<li>${cell}</li>`;
  });
  return `<nav class="breadcrumb" aria-label="${escapeHtml(label)}"><ol>${items.join('')}</ol></nav>`;
}

function renderRelated(groups, prefix, label) {
  if (groups.length === 0) return '';
  const blocks = groups.map(({ heading, links }) => {
    const items = links
      .map(({ href, text }) => `<li><a href="${escapeHtml(prefix + href)}">${escapeHtml(text)}</a></li>`)
      .join('');
    return `        <div>
          <h2>${escapeHtml(heading)}</h2>
          <ul>${items}</ul>
        </div>`;
  });
  return `      <aside class="related" aria-label="${escapeHtml(label)}">
${blocks.join('\n')}
      </aside>`;
}

// The switch points at the same document in the other language rather than at
// that language's home page, because sending a reader back to the top of a
// site they were already deep inside is the usual way a translation gets
// abandoned. Each label is written in the language it leads to.
export function renderLanguageSwitch(neutralPath, locale, rootPrefix) {
  const links = LOCALES
    .filter(({ code }) => code !== locale.code)
    .map(({ path_prefix: prefix, hreflang, label }) => (
      `<a lang="${escapeHtml(hreflang)}" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(rootPrefix + prefix + neutralPath)}">${escapeHtml(label)}</a>`
    ));
  return links.join('');
}

export function renderDocument({
  depth = 0,
  locale = DEFAULT_LOCALE,
  title,
  description,
  canonicalPath,
  head = '',
  jsonLd = [],
  analytics = true,
  breadcrumb = [],
  eyebrow,
  h1,
  lede,
  body,
  related = [],
  footerNote,
}) {
  if (title.length > TITLE_LIMIT) {
    throw new Error(`Title is ${title.length} characters, over the ${TITLE_LIMIT} limit: ${title}`);
  }
  if (description.length > DESCRIPTION_LIMIT) {
    throw new Error(`Description is ${description.length} characters, over the ${DESCRIPTION_LIMIT} limit: ${title}`);
  }

  const t = translator(locale);
  // Two prefixes, because a translated page sits one directory deeper than the
  // page it mirrors: its siblings are still one hop away, while the stylesheet
  // at the site root is two.
  const linkPrefix = relativePrefix(depth);
  const rootPrefix = relativePrefix(depth + localeDepth(locale));
  const publishedPath = localePath(canonicalPath, locale);
  // The visible trail and the structured one are the same data, so a page
  // cannot show one path and tell a crawler about another.
  const structured = breadcrumb.length > 1
    ? [breadcrumbNode(breadcrumb, canonicalPath, locale), ...jsonLd]
    : jsonLd;

  return `<!doctype html>
<html lang="${escapeHtml(locale.hreflang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${rootPrefix}styles.css">${renderHead({
    path: publishedPath,
    title,
    description,
    locale,
    jsonLd: structured,
    analytics,
  })}${head}
</head>
<body>
  <header class="page-head">
    <div class="shell">
      ${renderBreadcrumb(breadcrumb, linkPrefix, t('layout.breadcrumbLabel'))}
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(h1)}</h1>
      <p class="lede">${escapeHtml(lede)}</p>
    </div>
  </header>

  <main>
    <div class="shell page-grid">
      <article class="page-body" id="page-body">
${body}
      </article>
${renderRelated(related, linkPrefix, t('layout.relatedLabel'))}
    </div>
  </main>

  <footer><div class="shell"><span>${escapeHtml(footerNote ?? t('layout.footerNote'))}</span><a href="${linkPrefix}index.html">${escapeHtml(t('layout.footerLink'))}</a>${renderLanguageSwitch(canonicalPath, locale, rootPrefix)}</div></footer>
</body>
</html>
`;
}
