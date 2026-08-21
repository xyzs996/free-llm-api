import { readFileSync } from 'node:fs';

// The renderer is a build step, so the site config is read once at import and
// stays a synchronous value, the same way the model families are.
export const SITE = Object.freeze(JSON.parse(
  readFileSync(new URL('../data/site.json', import.meta.url), 'utf8'),
));

export const SITE_URL = SITE.site_url;
export const REPO_URL = SITE.repo_url;
export const SITE_NAME = 'Free LLM API';

// The open thread. Until it was linked, the only way to say "this number moved"
// was the correction form, which requires the provider's own page and the date
// you read it. Those requirements are right — a number here changes on evidence
// — but they also mean a reader who merely noticed something has nowhere to put
// it, and the repository hears nothing at all. The thread is the path that asks
// for none of that, so it is named next to the form everywhere the form is.
export const THREAD_URL = `${REPO_URL}/discussions/1`;

// The locales this renderer actually emits pages for. An hreflang alternate
// pointing at a page nobody generated is worse than no alternate at all, so
// this list is held equal to the artifacts on disk by test/seo.test.js rather
// than being a statement of intent.
export const RENDERED_LOCALES = Object.freeze(['en', 'zh']);

export const LOCALES = Object.freeze(
  SITE.locales.filter(({ code }) => RENDERED_LOCALES.includes(code)),
);

export const DEFAULT_LOCALE = LOCALES.find(({ code }) => code === SITE.default_locale) ?? LOCALES[0];

// A directory and its index file are one page, not two, so `index.html` comes
// off the end of every address this site publishes. Otherwise the catalog would
// be reachable at two URLs and would compete with itself for both of them.
export function pageUrl(path, locale = DEFAULT_LOCALE) {
  return `${SITE_URL}${locale.path_prefix}${path.replace(/(^|\/)index\.html$/, '$1')}`;
}

// The address a generated file is served at, derived from where it is written.
// Tests use this rather than restating the rule, so the sitemap, the canonical
// links and the assertions about them cannot disagree.
export function artifactUrl(artifactPath) {
  return pageUrl(artifactPath.replace(/^docs\//, ''));
}

// How many directories a locale's pages sit below the site root: the default
// locale publishes at the root, every other one inside its own folder.
export function localeDepth(locale) {
  return locale.path_prefix === '' ? 0 : 1;
}

// Where a locale-neutral path is published for a given locale, as a repository
// path rather than a URL.
export function localePath(path, locale) {
  return `${locale.path_prefix}${path}`;
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
