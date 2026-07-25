import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { classifyPreflight, modelsUrl } from '../scripts/cors-check.js';
import {
  BROWSER_CHECK_STATES,
  LANDING_PAGE_MINIMUM_SUMMARY,
  MODEL_FAMILY_MINIMUM_PROVIDERS,
  isLandingPageEligible,
  providersInFamily,
  validateModelFamilies,
  validateProviders,
  validateSite,
} from '../src/validate.js';

const providers = JSON.parse(
  await readFile(new URL('../data/providers.json', import.meta.url), 'utf8'),
);
const families = JSON.parse(
  await readFile(new URL('../data/model-families.json', import.meta.url), 'utf8'),
);
const site = JSON.parse(
  await readFile(new URL('../data/site.json', import.meta.url), 'utf8'),
);

function clone(provider) {
  return structuredClone(provider);
}

test('every provider records whether a browser may call it, and when that was checked', () => {
  assert.equal(validateProviders(providers).length, 0);

  for (const provider of providers) {
    assert.ok(
      Object.values(BROWSER_CHECK_STATES).includes(provider.browser_check),
      `${provider.id} has no browser_check state`,
    );
    assert.match(provider.browser_checked_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(
      provider.browser_check_note.length > 30,
      `${provider.id} must explain what the preflight returned`,
    );
  }
});

test('a missing or invented browser_check state fails validation', () => {
  const withoutState = clone(providers[0]);
  delete withoutState.browser_check;
  assert.match(
    validateProviders([withoutState]).join('\n'),
    /browser_check must be one of supported, blocked, unverified/,
  );

  const invented = clone(providers[0]);
  invented.browser_check = 'probably';
  assert.match(validateProviders([invented]).join('\n'), /browser_check must be one of/);

  const undated = clone(providers[0]);
  undated.browser_checked_at = '2026-02-31';
  assert.match(validateProviders([undated]).join('\n'), /browser_checked_at must be a real/);
});

test('optional enrichment fields are validated only when they are present', () => {
  const bare = clone(providers[0]);
  assert.equal(validateProviders([bare]).length, 0, 'the fields stay optional');

  const enriched = clone(providers[0]);
  enriched.region_notes = 'Available worldwide.';
  enriched.docs_url = 'https://example.com/docs';
  enriched.limits.summary_zh = '每分钟 30 次。';
  enriched.availability.note_zh = '仍然开放注册。';
  assert.equal(validateProviders([enriched]).length, 0);

  const broken = clone(providers[0]);
  broken.region_notes = '   ';
  broken.docs_url = 'http://example.com/docs';
  broken.limits.summary_zh = '';
  const errors = validateProviders([broken]).join('\n');
  assert.match(errors, /region_notes must be a non-empty string when present/);
  assert.match(errors, /docs_url must be an HTTPS URL when present/);
  assert.match(errors, /limits\.summary_zh must be a non-empty string when present/);
});

test('a verify override is rejected unless it names a method and a path', () => {
  const withOverride = clone(providers[0]);
  withOverride.verify = { method: 'GET', path: 'v1/models' };
  assert.equal(validateProviders([withOverride]).length, 0);

  const broken = clone(providers[0]);
  broken.verify = { method: 'TRACE', path: '' };
  const errors = validateProviders([broken]).join('\n');
  assert.match(errors, /verify\.method must be one of GET, POST/);
  assert.match(errors, /verify\.path must be a non-empty string/);
});

test('landing pages are gated on sourced, non-thin content', () => {
  const eligible = providers.filter(isLandingPageEligible);
  assert.ok(eligible.length > 0, 'the catalog must produce landing pages');

  for (const provider of eligible) {
    assert.ok(provider.limits.summary.length >= LANDING_PAGE_MINIMUM_SUMMARY);
    assert.ok(provider.official_sources.length >= 1);
    assert.ok(provider.signup_url);
  }

  const thin = clone(providers[0]);
  thin.limits.summary = 'Free tier available.';
  assert.equal(isLandingPageEligible(thin), false, 'a one-line summary is a thin page');

  const unsourced = clone(providers[0]);
  unsourced.official_sources = [];
  assert.equal(isLandingPageEligible(unsourced), false);

  const closed = clone(providers[0]);
  closed.signup_url = null;
  assert.equal(isLandingPageEligible(closed), false, 'a page nobody can act on is not a page');
});

test('every model family covers at least two providers in this catalog', () => {
  assert.equal(validateModelFamilies(families, providers).length, 0);

  for (const family of families) {
    const matches = providersInFamily(family, providers);
    assert.ok(
      matches.length >= MODEL_FAMILY_MINIMUM_PROVIDERS,
      `${family.id} only matches ${matches.length} provider(s)`,
    );
  }

  const lonely = { ...families[0], id: 'lonely', pattern: 'no-such-model-anywhere' };
  assert.match(
    validateModelFamilies([lonely], providers).join('\n'),
    /matches 0 provider\(s\); a family page needs at least 2/,
  );

  const broken = { ...families[0], pattern: '([' };
  assert.match(validateModelFamilies([broken], providers).join('\n'), /valid regular expression/);
});

test('the site config describes exactly one root locale and keeps tokens optional', () => {
  assert.equal(validateSite(site).length, 0);
  assert.equal(site.google_site_verification, '');
  assert.equal(site.cloudflare_beacon_token, '');

  const relative = { ...site, site_url: 'https://xyzs996.github.io/free-llm-api' };
  assert.match(validateSite(relative).join('\n'), /must end with a slash/);

  const twoRoots = {
    ...site,
    locales: site.locales.map((locale) => ({ ...locale, path_prefix: '' })),
  };
  assert.match(validateSite(twoRoots).join('\n'), /exactly one locale must serve the site root/);

  const missingDefault = { ...site, default_locale: 'fr' };
  assert.match(validateSite(missingDefault).join('\n'), /default_locale must name one of/);
});

test('the preflight classifier separates a blocked origin from an unlisted header', () => {
  const origin = 'https://xyzs996.github.io';

  assert.equal(
    classifyPreflight({ status: 204, allowOrigin: '*', allowHeaders: '*' }, origin).state,
    BROWSER_CHECK_STATES.SUPPORTED,
  );
  assert.equal(
    classifyPreflight({ status: 200, allowOrigin: origin, allowHeaders: 'authorization, content-type' }, origin).state,
    BROWSER_CHECK_STATES.SUPPORTED,
  );
  assert.equal(
    classifyPreflight({ status: 405, allowOrigin: null, allowHeaders: null }, origin).state,
    BROWSER_CHECK_STATES.BLOCKED,
  );
  assert.equal(
    classifyPreflight({ status: 200, allowOrigin: 'https://example.com', allowHeaders: '*' }, origin).state,
    BROWSER_CHECK_STATES.BLOCKED,
  );

  const headerMissing = classifyPreflight(
    { status: 200, allowOrigin: '*', allowHeaders: 'content-type' },
    origin,
  );
  assert.equal(headerMissing.state, BROWSER_CHECK_STATES.UNVERIFIED, 'an unlisted header is not a verdict');
  assert.match(headerMissing.reason, /does not list authorization/);
});

test('the preflight target is the models endpoint of each base URL', () => {
  assert.equal(modelsUrl('https://api.groq.com/openai/v1'), 'https://api.groq.com/openai/v1/models');
  assert.equal(
    modelsUrl('https://generativelanguage.googleapis.com/v1beta/openai/'),
    'https://generativelanguage.googleapis.com/v1beta/openai/models',
  );
});
