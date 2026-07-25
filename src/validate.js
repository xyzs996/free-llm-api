import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProbeInvariants } from './probe-contract.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const BROWSER_CHECK_STATES = Object.freeze({
  SUPPORTED: 'supported',
  BLOCKED: 'blocked',
  UNVERIFIED: 'unverified',
});

const VERIFY_METHODS = Object.freeze(['GET', 'POST']);

const OPTIONAL_PROVIDER_STRINGS = Object.freeze([
  'region_notes',
  'data_policy',
]);

const OPTIONAL_PROVIDER_URLS = Object.freeze([
  'docs_url',
  'pricing_url',
  'console_url',
]);

export const CHANGELOG_CHANGE_TYPES = Object.freeze({
  added: 'added',
  'limit-changed': 'limit-changed',
  lifecycle: 'lifecycle',
  correction: 'correction',
  removed: 'removed',
});

export const CHANGELOG_CHANGE_LABELS = Object.freeze({
  added: 'Added',
  'limit-changed': 'Limits changed',
  lifecycle: 'Lifecycle',
  correction: 'Corrected',
  removed: 'Removed',
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isRealDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isCanonicalTimestamp(value) {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function validateProbe(probe, path, errors) {
  if (!probe || typeof probe !== 'object' || Array.isArray(probe)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const field of [
    'endpoint_reachable',
    'credential_valid',
    'sample_quota_exhausted',
    'model_available',
  ]) {
    if (probe[field] !== null && typeof probe[field] !== 'boolean') {
      errors.push(`${path}.${field} must be boolean or null`);
    }
  }

  if (
    probe.http_status !== null
    && (!Number.isInteger(probe.http_status) || probe.http_status < 100 || probe.http_status > 599)
  ) {
    errors.push(`${path}.http_status must be an HTTP status or null`);
  }

  if (
    probe.latency_ms !== null
    && (!Number.isFinite(probe.latency_ms) || probe.latency_ms < 0)
  ) {
    errors.push(`${path}.latency_ms must be a non-negative number or null`);
  }

  if (probe.checked_at !== null && !isCanonicalTimestamp(probe.checked_at)) {
    errors.push(`${path}.checked_at must be an ISO timestamp or null`);
  }
  if (!isNonEmptyString(probe.classification)) {
    errors.push(`${path}.classification must be a non-empty string`);
  }
  if (!isNonEmptyString(probe.explanation)) {
    errors.push(`${path}.explanation must be a non-empty string`);
  }

  for (const invariant of validateProbeInvariants(probe)) {
    errors.push(`${path}.${invariant.field} must ${invariant.expectation} for ${probe.classification}`);
  }
}

function validateBrowserCheck(provider, path, errors) {
  const states = Object.values(BROWSER_CHECK_STATES);
  if (!states.includes(provider.browser_check)) {
    errors.push(`${path}.browser_check must be one of ${states.join(', ')}`);
  }
  if (!isNonEmptyString(provider.browser_check_note)) {
    errors.push(`${path}.browser_check_note must explain what the CORS preflight returned`);
  }
  if (!isRealDate(provider.browser_checked_at)) {
    errors.push(`${path}.browser_checked_at must be a real YYYY-MM-DD date`);
  }
}

function validateVerifyOverride(provider, path, errors) {
  if (!Object.hasOwn(provider, 'verify')) return;

  const verify = provider.verify;
  if (!verify || typeof verify !== 'object' || Array.isArray(verify)) {
    errors.push(`${path}.verify must be an object when present`);
    return;
  }
  if (!VERIFY_METHODS.includes(verify.method)) {
    errors.push(`${path}.verify.method must be one of ${VERIFY_METHODS.join(', ')}`);
  }
  if (!isNonEmptyString(verify.path)) {
    errors.push(`${path}.verify.path must be a non-empty string`);
  }
  if (Object.hasOwn(verify, 'model') && !isNonEmptyString(verify.model)) {
    errors.push(`${path}.verify.model must be a non-empty string when present`);
  }
}

function validateOptionalCopy(provider, path, errors) {
  for (const field of OPTIONAL_PROVIDER_STRINGS) {
    if (Object.hasOwn(provider, field) && !isNonEmptyString(provider[field])) {
      errors.push(`${path}.${field} must be a non-empty string when present`);
    }
  }
  for (const field of OPTIONAL_PROVIDER_URLS) {
    if (Object.hasOwn(provider, field) && !isHttpsUrl(provider[field])) {
      errors.push(`${path}.${field} must be an HTTPS URL when present`);
    }
  }
  if (Object.hasOwn(provider.limits ?? {}, 'summary_zh') && !isNonEmptyString(provider.limits.summary_zh)) {
    errors.push(`${path}.limits.summary_zh must be a non-empty string when present`);
  }
  if (Object.hasOwn(provider.availability ?? {}, 'note_zh') && !isNonEmptyString(provider.availability.note_zh)) {
    errors.push(`${path}.availability.note_zh must be a non-empty string when present`);
  }
}

export function validateProviders(providers) {
  const errors = [];
  if (!Array.isArray(providers) || providers.length === 0) {
    return ['providers must be a non-empty array'];
  }

  const ids = new Set();

  providers.forEach((provider, index) => {
    const path = `providers[${index}]`;
    if (!provider || typeof provider !== 'object' || Array.isArray(provider)) {
      errors.push(`${path} must be an object`);
      return;
    }

    for (const field of ['id', 'name', 'category', 'base_url']) {
      if (!isNonEmptyString(provider[field])) {
        errors.push(`${path}.${field} must be a non-empty string`);
      }
    }

    if (ids.has(provider.id)) errors.push(`${path}.id has duplicate id ${provider.id}`);
    ids.add(provider.id);

    if (provider.signup_url !== null && !isHttpsUrl(provider.signup_url)) {
      errors.push(`${path}.signup_url must be an HTTPS URL or null`);
    }
    if (!isHttpsUrl(provider.base_url)) {
      errors.push(`${path}.base_url must be an HTTPS URL`);
    }
    if (typeof provider.openai_compatible !== 'boolean') {
      errors.push(`${path}.openai_compatible must be boolean`);
    }
    if (typeof provider.credit_card_required !== 'boolean') {
      errors.push(`${path}.credit_card_required must be boolean`);
    }

    if (
      !Array.isArray(provider.models)
      || provider.models.length === 0
      || provider.models.some((model) => !isNonEmptyString(model))
    ) {
      errors.push(`${path}.models must contain non-empty strings`);
    }

    const hasSources = Array.isArray(provider.official_sources)
      && provider.official_sources.length > 0;

    if (!provider.limits || typeof provider.limits !== 'object') {
      errors.push(`${path}.limits must be an object`);
    } else {
      for (const field of ['status', 'summary']) {
        if (!isNonEmptyString(provider.limits[field])) {
          errors.push(`${path}.limits.${field} must be a non-empty string`);
        }
      }
      for (const field of ['requests_per_minute', 'requests_per_day']) {
        const value = provider.limits[field];
        if (value !== null && (!Number.isFinite(value) || value < 0)) {
          errors.push(`${path}.limits.${field} must be a non-negative number or null`);
        }
      }

      const statesLimits = provider.limits.requests_per_minute !== null
        || provider.limits.requests_per_day !== null
        || isNonEmptyString(provider.limits.summary);
      if (statesLimits && !hasSources) {
        errors.push(`${path}.limits states quota facts, so ${path}.official_sources must cite where they came from`);
      }
    }

    if (!provider.availability || typeof provider.availability !== 'object') {
      errors.push(`${path}.availability must be an object`);
    } else {
      if (!isNonEmptyString(provider.availability.status)) {
        errors.push(`${path}.availability.status must be a non-empty string`);
      }
      if (typeof provider.availability.accepting_new_users !== 'boolean') {
        errors.push(`${path}.availability.accepting_new_users must be boolean`);
      }
      if (
        provider.availability.retires_at !== null
        && !DATE_PATTERN.test(provider.availability.retires_at)
      ) {
        errors.push(`${path}.availability.retires_at must be YYYY-MM-DD or null`);
      }
      if (!isNonEmptyString(provider.availability.note)) {
        errors.push(`${path}.availability.note must be a non-empty string`);
      }
    }

    if (
      !Array.isArray(provider.official_sources)
      || provider.official_sources.length === 0
    ) {
      errors.push(`${path}.official_sources must be a non-empty array`);
    } else {
      provider.official_sources.forEach((source, sourceIndex) => {
        const sourcePath = `${path}.official_sources[${sourceIndex}]`;
        if (!isNonEmptyString(source?.title)) {
          errors.push(`${sourcePath}.title must be a non-empty string`);
        }
        if (!isHttpsUrl(source?.url)) {
          errors.push(`${sourcePath}.url must be an HTTPS URL`);
        }
      });
    }

    if (!isRealDate(provider.source_checked_at)) {
      errors.push(`${path}.source_checked_at must be a real YYYY-MM-DD date`);
    }
    validateBrowserCheck(provider, path, errors);
    validateVerifyOverride(provider, path, errors);
    validateOptionalCopy(provider, path, errors);
    validateProbe(provider.probe, `${path}.probe`, errors);
  });

  return errors;
}

export const LANDING_PAGE_MINIMUM_SUMMARY = 120;
export const MODEL_FAMILY_MINIMUM_PROVIDERS = 2;

/**
 * A provider only earns its own landing page when it carries enough unique,
 * sourced facts to be worth reading on its own. Everything below the bar still
 * appears in the catalog table; it just does not become a thin page.
 */
export function isLandingPageEligible(provider) {
  return isNonEmptyString(provider?.signup_url)
    && typeof provider?.limits?.summary === 'string'
    && provider.limits.summary.length >= LANDING_PAGE_MINIMUM_SUMMARY
    && Array.isArray(provider?.official_sources)
    && provider.official_sources.length >= 1;
}

export function providersInFamily(family, providers) {
  let pattern;
  try {
    pattern = new RegExp(family.pattern, 'i');
  } catch {
    return [];
  }
  return providers.filter((provider) => (
    Array.isArray(provider.models) && provider.models.some((model) => pattern.test(model))
  ));
}

export function validateModelFamilies(families, providers = []) {
  const errors = [];
  if (!Array.isArray(families) || families.length === 0) {
    return ['model families must be a non-empty array'];
  }

  const ids = new Set();
  families.forEach((family, index) => {
    const path = `modelFamilies[${index}]`;
    if (!family || typeof family !== 'object' || Array.isArray(family)) {
      errors.push(`${path} must be an object`);
      return;
    }

    for (const field of ['id', 'name', 'name_zh', 'pattern', 'vendor', 'blurb', 'blurb_zh']) {
      if (!isNonEmptyString(family[field])) {
        errors.push(`${path}.${field} must be a non-empty string`);
      }
    }

    if (ids.has(family.id)) errors.push(`${path}.id has duplicate id ${family.id}`);
    ids.add(family.id);

    try {
      new RegExp(family.pattern, 'i');
    } catch {
      errors.push(`${path}.pattern must be a valid regular expression`);
      return;
    }

    const matches = providersInFamily(family, providers);
    if (matches.length < MODEL_FAMILY_MINIMUM_PROVIDERS) {
      errors.push(
        `${path}.pattern matches ${matches.length} provider(s); a family page needs at least ${MODEL_FAMILY_MINIMUM_PROVIDERS}`,
      );
    }
  });

  return errors;
}

export function validateSite(site) {
  const errors = [];
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    return ['site must be an object'];
  }

  for (const field of ['site_url', 'repo_url']) {
    if (!isHttpsUrl(site[field])) errors.push(`site.${field} must be an HTTPS URL`);
  }
  if (isHttpsUrl(site.site_url) && !site.site_url.endsWith('/')) {
    errors.push('site.site_url must end with a slash so page paths can be appended');
  }

  if (!Array.isArray(site.locales) || site.locales.length === 0) {
    errors.push('site.locales must be a non-empty array');
  } else {
    const codes = new Set();
    site.locales.forEach((locale, index) => {
      const path = `site.locales[${index}]`;
      for (const field of ['code', 'hreflang', 'label']) {
        if (!isNonEmptyString(locale?.[field])) {
          errors.push(`${path}.${field} must be a non-empty string`);
        }
      }
      if (typeof locale?.path_prefix !== 'string') {
        errors.push(`${path}.path_prefix must be a string`);
      } else if (locale.path_prefix !== '' && !locale.path_prefix.endsWith('/')) {
        errors.push(`${path}.path_prefix must end with a slash when it is not empty`);
      }
      if (codes.has(locale?.code)) errors.push(`${path}.code has duplicate locale ${locale.code}`);
      codes.add(locale?.code);
    });

    if (!codes.has(site.default_locale)) {
      errors.push('site.default_locale must name one of site.locales');
    }
    if (site.locales.filter(({ path_prefix: prefix }) => prefix === '').length !== 1) {
      errors.push('exactly one locale must serve the site root with an empty path_prefix');
    }
  }

  // Both tokens are public site identifiers rather than secrets, but an unset
  // token has to stay an empty string so the renderer can omit the tag entirely.
  for (const field of ['google_site_verification', 'cloudflare_beacon_token']) {
    if (typeof site[field] !== 'string') {
      errors.push(`site.${field} must be a string, empty when unset`);
    }
  }

  return errors;
}

export function validateChangelog(changelog, providers = []) {
  const errors = [];
  if (!changelog || typeof changelog !== 'object' || Array.isArray(changelog)) {
    return ['changelog must be an object'];
  }
  if (changelog.schema_version !== 1) {
    errors.push('changelog.schema_version must be 1');
  }
  if (!Array.isArray(changelog.weeks) || changelog.weeks.length === 0) {
    return [...errors, 'changelog.weeks must be a non-empty array'];
  }

  const knownIds = new Set(
    Array.isArray(providers) ? providers.map((provider) => provider?.id) : [],
  );
  const seenWeeks = new Set();
  let previousWeek = null;

  changelog.weeks.forEach((week, index) => {
    const path = `changelog.weeks[${index}]`;
    if (!week || typeof week !== 'object' || Array.isArray(week)) {
      errors.push(`${path} must be an object`);
      return;
    }

    if (!isRealDate(week.week_of)) {
      errors.push(`${path}.week_of must be a real YYYY-MM-DD date`);
    } else {
      if (seenWeeks.has(week.week_of)) {
        errors.push(`${path}.week_of has duplicate week ${week.week_of}`);
      }
      seenWeeks.add(week.week_of);
      if (previousWeek !== null && week.week_of >= previousWeek) {
        errors.push(`${path}.week_of must be older than ${previousWeek}; weeks are newest first`);
      }
      previousWeek = week.week_of;
    }

    if (!isNonEmptyString(week.summary)) {
      errors.push(`${path}.summary must be a non-empty string`);
    }
    if (Object.hasOwn(week, 'summary_zh') && !isNonEmptyString(week.summary_zh)) {
      errors.push(`${path}.summary_zh must be a non-empty string when present`);
    }

    if (!Array.isArray(week.changes) || week.changes.length === 0) {
      errors.push(`${path}.changes must be a non-empty array`);
      return;
    }

    week.changes.forEach((change, changeIndex) => {
      const changePath = `${path}.changes[${changeIndex}]`;
      if (!change || typeof change !== 'object' || Array.isArray(change)) {
        errors.push(`${changePath} must be an object`);
        return;
      }
      if (!Object.hasOwn(CHANGELOG_CHANGE_TYPES, change.type)) {
        errors.push(`${changePath}.type must be one of ${Object.keys(CHANGELOG_CHANGE_TYPES).join(', ')}`);
      }
      if (!isNonEmptyString(change.provider_id)) {
        errors.push(`${changePath}.provider_id must be a non-empty string`);
        return;
      }
      if (!isNonEmptyString(change.detail)) {
        errors.push(`${changePath}.detail must be a non-empty string`);
      }
      if (Object.hasOwn(change, 'detail_zh') && !isNonEmptyString(change.detail_zh)) {
        errors.push(`${changePath}.detail_zh must be a non-empty string when present`);
      }
      if (change.type === 'removed') {
        if (knownIds.has(change.provider_id)) {
          errors.push(`${changePath}.provider_id ${change.provider_id} is still in the catalog`);
        }
        return;
      }
      if (!knownIds.has(change.provider_id)) {
        errors.push(`${changePath}.provider_id ${change.provider_id} is not in the catalog`);
      }
    });
  });

  return errors;
}

function usage() {
  return `node src/validate.js [--providers <path>] [--changelog <path>]

With no options both data/providers.json and data/changelog.json are validated.
Passing --providers alone validates that catalog only, because a changelog can
only be checked against the catalog its entries refer to.
`;
}

function parseArgs(args) {
  const options = { providers: null, changelog: null };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--help' || option === '-h') return null;
    if (!['--providers', '--changelog'].includes(option)) {
      throw new Error(`Unknown validate option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${option}`);
    }
    options[option.slice(2)] = value;
    index += 1;
  }
  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options === null) {
    process.stdout.write(usage());
    return;
  }

  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const providersPath = options.providers ?? 'data/providers.json';
  const changelogPath = options.changelog
    ?? (options.providers === null ? 'data/changelog.json' : null);

  const providers = JSON.parse(await readFile(resolve(root, providersPath), 'utf8'));
  const errors = validateProviders(providers);
  let weekCount = 0;

  if (changelogPath !== null) {
    const changelog = JSON.parse(await readFile(resolve(root, changelogPath), 'utf8'));
    weekCount = Array.isArray(changelog?.weeks) ? changelog.weeks.length : 0;
    errors.push(...validateChangelog(changelog, providers));
  }

  // The site config and the model families describe the generated pages, so they
  // are only meaningful when the real catalog is the one being validated.
  const checksSiteData = options.providers === null;
  let familyCount = 0;
  let pageCount = 0;

  if (checksSiteData) {
    const site = JSON.parse(await readFile(resolve(root, 'data/site.json'), 'utf8'));
    const families = JSON.parse(await readFile(resolve(root, 'data/model-families.json'), 'utf8'));
    familyCount = Array.isArray(families) ? families.length : 0;
    pageCount = Array.isArray(providers) ? providers.filter(isLandingPageEligible).length : 0;
    errors.push(...validateSite(site));
    errors.push(...validateModelFamilies(families, providers));
  }

  if (errors.length > 0) {
    process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  const catalogSize = Array.isArray(providers) ? providers.length : 0;
  process.stdout.write(
    changelogPath === null
      ? `Validated ${catalogSize} providers.\n`
      : `Validated ${catalogSize} providers and ${weekCount} changelog ${weekCount === 1 ? 'week' : 'weeks'}.\n`,
  );
  if (checksSiteData) {
    process.stdout.write(
      `Site config is valid: ${familyCount} model families, ${pageCount} of ${catalogSize} providers earn a landing page.\n`,
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Validation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
