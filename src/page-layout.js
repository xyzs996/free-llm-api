import { escapeHtml } from './html.js';

// Kept in step with data/site.json by a test; the SEO task threads the whole
// site config through the renderer and this constant goes away then.
export const SITE_URL = 'https://xyzs996.github.io/free-llm-api/';

export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;

// Only the depths this site actually uses, so a typo in a caller cannot
// silently produce links that resolve one directory too high.
const PREFIXES = Object.freeze({ 0: './', 1: '../' });

export function relativePrefix(depth) {
  const prefix = PREFIXES[depth];
  if (prefix === undefined) throw new Error(`Unsupported page depth: ${depth}`);
  return prefix;
}

function renderBreadcrumb(trail, prefix) {
  const items = trail.map(({ href, text }, index) => {
    const label = escapeHtml(text);
    const cell = index === trail.length - 1 || !href
      ? `<span aria-current="page">${label}</span>`
      : `<a href="${escapeHtml(prefix + href)}">${label}</a>`;
    return `<li>${cell}</li>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items.join('')}</ol></nav>`;
}

function renderRelated(groups, prefix) {
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
  return `      <aside class="related" aria-label="Related pages">
${blocks.join('\n')}
      </aside>`;
}

export function renderDocument({
  depth = 0,
  lang = 'en',
  title,
  description,
  canonicalPath,
  head = '',
  breadcrumb = [],
  eyebrow,
  h1,
  lede,
  body,
  related = [],
  footerNote = 'Every number on this page comes from the provider’s own documentation, dated in the catalog.',
}) {
  if (title.length > TITLE_LIMIT) {
    throw new Error(`Title is ${title.length} characters, over the ${TITLE_LIMIT} limit: ${title}`);
  }
  if (description.length > DESCRIPTION_LIMIT) {
    throw new Error(`Description is ${description.length} characters, over the ${DESCRIPTION_LIMIT} limit: ${title}`);
  }

  const prefix = relativePrefix(depth);

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${escapeHtml(SITE_URL + canonicalPath)}">
  <link rel="stylesheet" href="${prefix}styles.css">${head}
</head>
<body>
  <header class="page-head">
    <div class="shell">
      ${renderBreadcrumb(breadcrumb, prefix)}
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
${renderRelated(related, prefix)}
    </div>
  </main>

  <footer><div class="shell"><span>${escapeHtml(footerNote)}</span><a href="${prefix}index.html">Free LLM API catalog</a></div></footer>
</body>
</html>
`;
}
