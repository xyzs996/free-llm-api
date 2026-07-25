import { chmod, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const clients = Object.freeze([
  { id: 'codex', mode: 'generated', artifact: 'config.toml' },
  { id: 'claude-code', mode: 'generated', artifact: 'run-claude-code.sh' },
  { id: 'continue', mode: 'generated', artifact: 'config.yaml' },
  { id: 'cursor', mode: 'guided', artifact: 'SETUP.md' },
  { id: 'cline', mode: 'guided', artifact: 'SETUP.md' },
]);

const DEFAULT_OPENAI_BASE_URL = 'https://aiapiv2.pekpik.com/v1';
const DEFAULT_ANTHROPIC_BASE_URL = 'https://aiapiv2.pekpik.com';
const DEFAULT_MODEL = 'gpt-4o-mini';

export function normalizeBaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('--base-url must be a valid HTTP(S) URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('--base-url must use HTTP or HTTPS');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('--base-url must not contain credentials, a query, or a fragment');
  }

  return parsed.toString().replace(/\/$/, '');
}

function validateModel(value) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(value)) {
    throw new Error('--model contains unsupported characters');
  }
  return value;
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function codexConfig({ baseUrl, model }) {
  return `# Merge this snippet into ~/.codex/config.toml.
# Project-level config cannot select a custom model provider.
model = "${model}"
model_provider = "pekpik"

[model_providers.pekpik]
name = "PekPik OpenAI-compatible gateway"
base_url = "${baseUrl}"
env_key = "PEKPIK_API_KEY"
wire_api = "responses"
`;
}

function claudeCodeWrapper({ baseUrl }) {
  return `#!/usr/bin/env sh
set -eu

: "\${PEKPIK_API_KEY:?Set PEKPIK_API_KEY before running Claude Code}"
ANTHROPIC_BASE_URL=${shellQuote(baseUrl)} \\
ANTHROPIC_AUTH_TOKEN="$PEKPIK_API_KEY" \\
exec claude "$@"
`;
}

function continueConfig({ baseUrl, model }) {
  const secretReference = '${{ secrets.PEKPIK_API_KEY }}';
  return `name: PekPik Free LLM
version: 0.1.0
schema: v1
models:
  - name: PekPik ${model}
    provider: openai
    model: ${model}
    apiBase: ${baseUrl}
    apiKey: ${secretReference}
    roles:
      - chat
      - edit
      - apply
`;
}

function cursorGuide({ baseUrl, model }) {
  return `# Cursor setup

This project does not modify Cursor settings or its credential storage.

1. Open **Cursor Settings > Models**.
2. Add your key from the \`PEKPIK_API_KEY\` environment variable to the OpenAI API key field manually.
3. Set **Override OpenAI Base URL** to \`${baseUrl}\`.
4. Add or select the model \`${model}\`, then click **Verify**.

Changing the OpenAI Base URL can affect built-in models. Custom API keys apply only to supported chat models; features such as Tab Completion continue to use Cursor's built-in models.
`;
}

function clineGuide({ baseUrl, model }) {
  return `# Cline setup

This project does not modify VS Code or Cline extension storage.

1. Open Cline settings and choose **OpenAI Compatible** as the API Provider.
2. Set **Base URL** to \`${baseUrl}\`.
3. Paste the key held in \`PEKPIK_API_KEY\` into Cline's API Key field manually.
4. Set **Model ID** to \`${model}\`, save, and send a small test message.
`;
}

const generators = {
  codex: codexConfig,
  'claude-code': claudeCodeWrapper,
  continue: continueConfig,
  cursor: cursorGuide,
  cline: clineGuide,
};

export async function setupClient(clientId, options = {}) {
  const client = clients.find(({ id }) => id === clientId);
  if (!client) {
    throw new Error(`Unsupported client: ${clientId}`);
  }

  const defaultBaseUrl = clientId === 'claude-code'
    ? DEFAULT_ANTHROPIC_BASE_URL
    : DEFAULT_OPENAI_BASE_URL;
  const values = {
    baseUrl: normalizeBaseUrl(options.baseUrl ?? defaultBaseUrl),
    model: validateModel(options.model ?? DEFAULT_MODEL),
  };
  const outputDirectory = path.resolve(
    options.output ?? path.join(process.cwd(), '.free-llm', clientId),
  );
  const artifactPath = path.join(outputDirectory, client.artifact);
  const content = generators[clientId](values);

  if (options.dryRun) {
    const exists = await stat(artifactPath).then(() => true, () => false);
    return { artifactPath, mode: client.mode, content, written: false, exists };
  }

  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(artifactPath, content, {
      encoding: 'utf8',
      flag: 'wx',
      mode: clientId === 'claude-code' ? 0o755 : 0o644,
    });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`Generated artifact already exists: ${artifactPath}`);
    }
    throw error;
  }
  if (clientId === 'claude-code') {
    await chmod(artifactPath, 0o755);
  }

  return { artifactPath, mode: client.mode, content, written: true, exists: false };
}
