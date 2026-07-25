#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDoctorResult, runDoctor } from './doctor.js';
import { clients, setupClient } from './setup.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage() {
  return `free-llm-api <command>

Commands:
  providers [--free-tier] [--no-credit-card]
  list
  setup <codex|claude-code|continue|cursor|cline> [--output <dir>] [--base-url <url>] [--model <id>] [--dry-run]
  doctor [options]
`;
}

function parseSetupOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (!['--output', '--base-url', '--model'].includes(option)) {
      throw new Error(`Unknown setup option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${option}`);
    }
    const key = {
      '--output': 'output',
      '--base-url': 'baseUrl',
      '--model': 'model',
    }[option];
    options[key] = value;
    index += 1;
  }
  return options;
}

function parseDoctorOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === '--chat') {
      options.chat = true;
      continue;
    }
    if (!['--base-url', '--model', '--timeout-ms'].includes(option)) {
      throw new Error(`Unknown doctor option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${option}`);
    }
    const key = {
      '--base-url': 'baseUrl',
      '--model': 'model',
      '--timeout-ms': 'timeoutMs',
    }[option];
    options[key] = value;
    index += 1;
  }
  return options;
}

function parseProviderFilters(args) {
  const filters = {};
  for (const option of args) {
    if (option === '--free-tier') {
      filters.freeTierOnly = true;
      continue;
    }
    if (option === '--no-credit-card') {
      filters.noCreditCard = true;
      continue;
    }
    throw new Error(`Unknown providers option: ${option}`);
  }
  return filters;
}

function quotaLabel(limits) {
  const parts = [
    limits.requests_per_minute === null ? null : `${limits.requests_per_minute} RPM`,
    limits.requests_per_day === null ? null : `${limits.requests_per_day} RPD`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : limits.status;
}

export function selectProviders(providers, filters = {}) {
  return providers.filter((provider) => {
    if (filters.freeTierOnly && provider.category !== 'provider-free-tier') return false;
    if (filters.noCreditCard && provider.credit_card_required) return false;
    return true;
  });
}

export function formatProviderLines(providers) {
  return providers
    .map((provider) => {
      const card = provider.credit_card_required ? 'card required' : 'no card';
      return `${provider.id.padEnd(18)} ${quotaLabel(provider.limits).padEnd(22)} ${card.padEnd(14)} ${provider.signup_url ?? 'new access closed'}`;
    })
    .join('\n');
}

async function main(argv) {
  const [command, ...args] = argv;

  if (command === 'providers') {
    const filters = parseProviderFilters(args);
    const providers = JSON.parse(
      await readFile(resolve(repositoryRoot, 'data/providers.json'), 'utf8'),
    );
    const selected = selectProviders(providers, filters);
    if (selected.length === 0) {
      process.stdout.write('No provider matches the requested filters.\n');
      return;
    }
    process.stdout.write(`${formatProviderLines(selected)}\n`);
    return;
  }

  if (command === 'list') {
    if (args.length > 0) throw new Error('list does not accept arguments');
    for (const client of clients) {
      process.stdout.write(`${client.id.padEnd(13)} ${client.mode}\n`);
    }
    return;
  }

  if (command === 'setup') {
    const [clientId, ...optionArgs] = args;
    if (!clientId) throw new Error('setup requires a client');
    const result = await setupClient(clientId, parseSetupOptions(optionArgs));
    const noun = result.mode === 'guided' ? 'guide' : 'config';
    if (!result.written) {
      process.stdout.write(`Dry run: nothing was written.\nWould create ${noun}: ${result.artifactPath}\n`);
      if (result.exists) {
        process.stdout.write('A file already exists there, so a real run would refuse to overwrite it.\n');
      }
      process.stdout.write(`\n${result.content}`);
      return;
    }
    process.stdout.write(`Created ${noun}: ${result.artifactPath}\n`);
    return;
  }

  if (command === 'doctor') {
    const result = await runDoctor(parseDoctorOptions(args));
    process.stdout.write(formatDoctorResult(result));
    if (result.errorMessage) {
      process.stderr.write(`Error: ${result.errorMessage}\n`);
    }
    return result.exitCode;
  }

  if (command === '--help' || command === '-h' || command === undefined) {
    process.stdout.write(usage());
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode ?? 0;
  })
  .catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  });
