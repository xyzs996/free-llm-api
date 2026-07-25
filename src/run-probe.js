import { mkdir, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyProbe } from './probe.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUTPUT = 'data/probe-output.json';
const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 10_000;
export const MAX_OUTPUT_BYTES = 4_096;

const PROBE_TARGETS = Object.freeze({
  gemini: {
    apiKeyEnv: 'GEMINI_API_KEY',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/models',
  },
  'github-models': {
    apiKeyEnv: 'GITHUB_TOKEN',
    url: 'https://models.github.ai/catalog/models',
  },
  groq: {
    apiKeyEnv: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/models',
  },
  openrouter: {
    apiKeyEnv: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/models',
  },
});

export class ProbeUsageError extends Error {}

function requireTarget(providerId) {
  const target = PROBE_TARGETS[providerId];
  if (!target) {
    throw new ProbeUsageError(`Unknown provider. Choose one of: ${Object.keys(PROBE_TARGETS).join(', ')}.`);
  }
  return target;
}

function requireTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new ProbeUsageError(`Probe timeout must be between 1 and ${MAX_TIMEOUT_MS} milliseconds.`);
  }
}

export async function runProviderProbe({
  providerId,
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  now = () => new Date(),
  clock = () => performance.now(),
}) {
  const target = requireTarget(providerId);
  requireTimeout(timeoutMs);
  const apiKey = env[target.apiKeyEnv];
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new ProbeUsageError(`Missing ${target.apiKeyEnv} environment variable.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = clock();
  let probe;

  try {
    const response = await fetchImpl(target.url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      redirect: 'error',
      signal: controller.signal,
    });
    const latencyMs = Math.max(0, Math.round(clock() - startedAt));
    await response.body?.cancel?.().catch(() => {});
    probe = classifyProbe({
      httpStatus: response.status,
      latencyMs,
      checkedAt: now().toISOString(),
    });
  } catch (networkError) {
    probe = classifyProbe({
      networkError,
      latencyMs: Math.max(0, Math.round(clock() - startedAt)),
      checkedAt: now().toISOString(),
    });
  } finally {
    clearTimeout(timeout);
  }

  return {
    schema_version: 1,
    provider_id: providerId,
    probe,
  };
}

function serializeOutput(output) {
  const content = `${JSON.stringify(output, null, 2)}\n`;
  if (Buffer.byteLength(content) > MAX_OUTPUT_BYTES) {
    throw new ProbeUsageError(`Probe output exceeds the ${MAX_OUTPUT_BYTES}-byte safety limit.`);
  }
  return content;
}

export async function writeProbeOutput({
  output,
  rootDirectory = repositoryRoot,
  outputPath = DEFAULT_OUTPUT,
}) {
  if (outputPath.replaceAll('\\', '/') !== DEFAULT_OUTPUT) {
    throw new ProbeUsageError(`Probe output must be ${DEFAULT_OUTPUT}.`);
  }

  const absolutePath = resolve(rootDirectory, DEFAULT_OUTPUT);
  await mkdir(dirname(absolutePath), { recursive: true, mode: 0o700 });
  const handle = await open(absolutePath, 'w', 0o600);
  try {
    await handle.writeFile(serializeOutput(output), 'utf8');
    await handle.chmod(0o600);
  } finally {
    await handle.close();
  }
  return absolutePath;
}

function parseArguments(argv) {
  const options = { outputPath: DEFAULT_OUTPUT, providerId: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else if (argument === '--provider') {
      options.providerId = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--output') {
      options.outputPath = argv[index + 1] ?? '';
      index += 1;
    } else {
      throw new ProbeUsageError(`Unknown argument: ${argument}.`);
    }
  }
  return options;
}

export async function runProbeCli({
  argv = process.argv.slice(2),
  env = process.env,
  fetchImpl = globalThis.fetch,
  rootDirectory = repositoryRoot,
  stdout = process.stdout,
} = {}) {
  const options = parseArguments(argv);
  if (options.help) {
    stdout.write('Usage: npm run probe -- --provider <id> [--output data/probe-output.json]\n');
    return null;
  }
  if (!options.providerId) throw new ProbeUsageError('The --provider option is required.');

  const output = await runProviderProbe({ providerId: options.providerId, env, fetchImpl });
  await writeProbeOutput({ output, rootDirectory, outputPath: options.outputPath });
  stdout.write(`Wrote redacted probe for ${options.providerId} to ${DEFAULT_OUTPUT}.\n`);
  return output;
}

export function publicProbeError(error) {
  return error instanceof ProbeUsageError
    ? error.message
    : 'Probe failed without writing raw error details.';
}
