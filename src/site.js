import { readFileSync } from 'node:fs';

// The renderer is a build step, so the site config is read once at import and
// stays a synchronous value, the same way the model families are.
export const SITE = Object.freeze(JSON.parse(
  readFileSync(new URL('../data/site.json', import.meta.url), 'utf8'),
));

export const SITE_URL = SITE.site_url;
export const REPO_URL = SITE.repo_url;
export const SITE_NAME = 'Free LLM API';

// The locales this renderer actually emits pages for. An hreflang alternate
// pointing at a page nobody generated is worse than no alternate at all, so
// this list is held equal to the artifacts on disk by test/seo.test.js rather
// than being a statement of intent. The Chinese mirror joins it when the
// mirror exists.
export const RENDERED_LOCALES = Object.freeze(['en']);

export const LOCALES = Object.freeze(
  SITE.locales.filter(({ code }) => RENDERED_LOCALES.includes(code)),
);

export const DEFAULT_LOCALE = LOCALES.find(({ code }) => code === SITE.default_locale) ?? LOCALES[0];

// The catalog is published at the site root, so both spellings of its path
// resolve to the single URL used by every canonical link, sitemap entry and
// breadcrumb. Anything else would split one page across two addresses.
export function pageUrl(path, locale = DEFAULT_LOCALE) {
  return `${SITE_URL}${locale.path_prefix}${path === 'index.html' ? '' : path}`;
}

// A path may arrive carrying a locale prefix (a generated Chinese page) or
// without one (the English original). Both name the same document, so the
// prefix comes off before alternates are built from it.
export function neutralPath(path) {
  for (const { path_prefix: prefix } of SITE.locales) {
    if (prefix && path.startsWith(prefix)) return path.slice(prefix.length);
  }
  return path;
}
