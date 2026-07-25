#!/usr/bin/env node

// Asks every catalog endpoint whether a browser is allowed to call it with an
// Authorization header. This sends a CORS preflight only: no API key, no
// credential of any kind, and no request body. It is a maintainer command and
// must never run in CI, because CI does not make network calls.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BROWSER_CHECK_STATES } from '../src/validate.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = '.free-llm/cors-report.json';
const DEFAULT_TIMEOUT_MS = 15000;

function usage() {
  return `node scripts/cors-check.js [--origin <url>] [--provider <id>] [--timeout <ms>]

Sends one credential-free CORS preflight per provider and writes the observed
states to ${REPORT_PATH}. It never edits data/providers.json; updating
browser_check stays a reviewed edit.
`;
}

function parseArgs(args) {
  const options = { origin: null, provider: null, timeout: DEFAULT_TIMEOUT_MS };

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--help' || option === '-h') return null;
    if (!['--origin', '--provider', '--timeout'].includes(option)) {
      throw new Error(`Unknown cors-check option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${option}`);
    index += 1;

    if (option === '--timeout') {
      const timeout = Number(value);
      if (!Number.isFinite(timeout) || timeout <= 0) {
        throw new Error('--timeout must be a positive number of milliseconds');
      }
      options.timeout = timeout;
      continue;
    }
    options[option.slice(2)] = value;
  }

  return options;
}

export function modelsUrl(baseUrl) {
  return new URL('models', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export function classifyPreflight({ status, allowOrigin, allowHeaders }, origin) {
  const originAllowed = allowOrigin === '*' || allowOrigin === origin;
  if (!originAllowed) {
    return {
      state: BROWSER_CHECK_STATES.BLOCKED,
      reason: allowOrigin === null
        ? `preflight answered ${status} without an access-control-allow-origin header`
        : `preflight allows ${allowOrigin} but not ${origin}`,
    };
  }

  const headerAllowed = allowHeaders === '*'
    || (typeof allowHeaders === 'string' && /(^|[\s,])authorization([\s,]|$)/i.test(allowHeaders));
  if (!headerAllowed) {
    return {
      state: BROWSER_CHECK_STATES.UNVERIFIED,
      reason: `preflight allows the origin but does not list authorization in access-control-allow-headers (${allowHeaders ?? 'header absent'})`,
    };
  }

  return {
    state: BROWSER_CHECK_STATES.SUPPORTED,
    reason: allowOrigin === '*'
      ? 'preflight allows any origin to send an Authorization header'
      : 'preflight echoes the requesting origin and allows an Authorization header',
  };
}

async function preflight(provider, origin, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(modelsUrl(provider.base_url), {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization',
      },
      signal: controller.signal,
    });

    const observed = classifyPreflight({
      status: response.status,
      allowOrigin: response.headers.get('access-control-allow-origin'),
      allowHeaders: response.headers.get('access-control-allow-headers'),
    }, origin);

    return { id: provider.id, http_status: response.status, ...observed };
  } catch (error) {
    return {
      id: provider.id,
      http_status: null,
      state: BROWSER_CHECK_STATES.UNVERIFIED,
      reason: `the preflight itself failed (${error.cause?.code ?? error.name}); this says nothing about the provider's CORS policy`,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options === null) {
    process.stdout.write(usage());
    return;
  }

  const site = JSON.parse(await readFile(resolve(root, 'data/site.json'), 'utf8'));
  const origin = options.origin ?? new URL(site.site_url).origin;
  const catalog = JSON.parse(await readFile(resolve(root, 'data/providers.json'), 'utf8'));
  const providers = options.provider === null
    ? catalog
    : catalog.filter(({ id }) => id === options.provider);

  if (providers.length === 0) throw new Error(`No provider matches ${options.provider}`);

  const observations = await Promise.all(
    providers.map((provider) => preflight(provider, origin, options.timeout)),
  );
  observations.sort((left, right) => left.id.localeCompare(right.id));

  const recorded = new Map(catalog.map((provider) => [provider.id, provider.browser_check]));
  const drift = observations.filter((observation) => (
    observation.state !== BROWSER_CHECK_STATES.UNVERIFIED
    && observation.state !== recorded.get(observation.id)
  ));

  for (const observation of observations) {
    const marker = drift.includes(observation) ? '!' : ' ';
    process.stdout.write(
      `${marker} ${observation.id.padEnd(22)} ${String(observation.http_status ?? '-').padEnd(4)} ${observation.state.padEnd(11)} ${observation.reason}\n`,
    );
  }

  await mkdir(resolve(root, dirname(REPORT_PATH)), { recursive: true });
  await writeFile(
    resolve(root, REPORT_PATH),
    `${JSON.stringify({ origin, observations }, null, 2)}\n`,
    'utf8',
  );
  process.stdout.write(`\nWrote ${REPORT_PATH} for ${observations.length} providers.\n`);

  const inconclusive = observations.filter(
    ({ state }) => state === BROWSER_CHECK_STATES.UNVERIFIED,
  ).length;
  if (inconclusive > 0) {
    process.stdout.write(`${inconclusive} preflight(s) were inconclusive and are not treated as drift.\n`);
  }

  if (drift.length > 0) {
    process.stderr.write(
      `${drift.length} provider(s) no longer match data/providers.json. Review each one, then edit browser_check by hand:\n${
        drift.map(({ id, state }) => `- ${id}: recorded ${recorded.get(id)}, observed ${state}`).join('\n')
      }\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`cors-check failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
