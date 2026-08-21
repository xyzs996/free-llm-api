import { readFileSync } from 'node:fs';

// The renderer is a build step, so the site config is read once at import and
// stays a synchronous value, the same way the model families are.
export const SITE = Object.freeze(JSON.parse(
  readFileSync(new URL('../data/site.json', import.meta.url), 'utf8'),
));

export const SITE_URL = SITE.site_url;
export const REPO_URL = SITE.repo_url;
export const SITE_NAME = 'Free LLM API';

// `owner/name`, derived from the repository URL rather than written out again.
// The CDN mirror address in both READMEs is built from it, and a second copy of
// the slug is a 404 waiting to happen the first time anything is renamed.
export const REPO_SLUG = REPO_URL.replace(/^https:\/\/github\.com\//, '');

// The open thread.
//
// WARNING: as of 2026-08-21 nothing a reader can see points here any more, and
// the paragraph that used to argue for it is kept below only so nobody
// reinstates it on those grounds. It said the thread "asks for none of that",
// and that was true and beside the point: see `heardUrl` for what was measured.
// The thread itself is untouched and still listed as *content* — it is the ask
// that moved.
export const THREAD_URL = `${REPO_URL}/discussions/1`;

// Where that ask actually goes now, and why it is no longer the thread.
//
// Measured 2026-08-21, on this repository: four discussions, **zero replies,
// one upvote each — and that upvote is mine**. Zero issues. In the same
// fortnight this catalog drew 73 unique visitors, 15 of them arriving from
// chatgpt.com, and 72 of the 73 landed on the front page carrying that ask.
// So the readers are real and the willingness is untested: what the thread
// asks for is not a sentence, it is *going somewhere and composing one* —
// sign in, land in an empty room, invent a title, restate the situation from
// scratch. The sibling repository measured the identical shape on the same
// day (nine threads, zero replies, one self-upvote each) and the fix there
// was not a better question. It was a smaller first step.
//
// So: a form with exactly one empty field, and that field asks the only thing
// the page cannot already know. Everything the page does know — which
// provider, which page they were reading — is filled in before they arrive.
//
// WARNING: `?template=<file>.yml`, never `/issues/new/choose`. The chooser
// page **swallows query parameters**: the link still returns 200, the form
// still opens, and every prefilled field is empty. Nothing downstream can see
// it. A parameter whose `id` is absent from the YAML is dropped just as
// silently, so the ids below must match `.github/ISSUE_TEMPLATE/heard.yml`.
export function heardUrl(cameFrom = '') {
  const q = new URLSearchParams({ template: 'heard.yml' });
  if (cameFrom) q.set('came_from', cameFrom);
  return `${REPO_URL}/issues/new?${q}`;
}

// The correction form, with the one field the page already knows filled in.
// Same rule as above: this replaces `/issues/new/choose`, which opened a
// four-required-field form with every field blank — including "Provider",
// which is the name of the page the reader just clicked away from.
export function correctionUrl(provider = '') {
  const q = new URLSearchParams({ template: 'correction.yml' });
  if (provider) q.set('provider', provider);
  return `${REPO_URL}/issues/new?${q}`;
}

// The threads that answer instead of asking.
//
// `THREAD_URL` above asks the reader which free tier moved on them. Open a
// fortnight, zero replies — and the low bar was never the obstacle. That
// question presumes a reader who already picked a provider, signed up, and ran
// into a wall. Almost nobody arriving here has done all three yet; they are
// still on the question that brought them, and they have nothing to report.
//
// These three arrive from the other side. Each title is a query people
// measurably type — checked against Google's own completions, where
// `free tier rate limits` and `openai compatible api` both come back full and
// `free llm coding agent` comes back with two, which is why the phrasing is
// theirs. Each body answers with this dataset's own reviewed figures and the
// date they were read, then asks for one thing at the end.
//
// They live on github.com rather than on the Pages site on purpose: for these
// queries a repository discussion outranks a zero-star Pages domain, and the
// reader who lands on one is already signed in and one click from replying.
//
// WARNING: no digit may be copied into the notes below. Every figure lives in
// the thread beside the source page it was read from and the date it was read.
// A copy here has neither, and it goes stale silently the next time a provider
// moves a limit — which is the exact failure this whole dataset exists to stop.
export const THREAD_QA = Object.freeze([
  Object.freeze({
    number: 2,
    question: 'Which free LLM APIs work without a credit card — and what are the published limits?',
    note: 'every permanent free tier that asks for no card, with the limit each one publishes and the ones that publish none',
  }),
  Object.freeze({
    number: 3,
    question: 'What are the Gemini, Groq and OpenRouter free tier rate limits right now?',
    note: 'the per-minute and per-day figures each one documents, why one of the three publishes no single number, and what that means for quoting it',
  }),
  Object.freeze({
    number: 4,
    question: 'Which free LLM APIs are OpenAI compatible, and what base URL do I point my coding agent at?',
    note: 'the base URL for every compatible provider, the one that is not a drop-in, and what the compatible flag does not promise',
  }),
]);

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
