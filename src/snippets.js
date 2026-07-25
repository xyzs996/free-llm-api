// Every configuration snippet this project hands out comes from here: the CLI
// writes these strings to disk, and the site inlines the same strings into its
// provider pages. One implementation means the copy button on the website and
// `free-llm-api setup` can never drift apart.
//
// Nothing in this module touches the filesystem, the network, or a credential.
// Each snippet reads its key from an environment variable that the reader sets
// themselves, so a snippet is safe to publish, paste into an issue, or commit.

export const DEFAULT_OPENAI_BASE_URL = 'https://aiapiv2.pekpik.com/v1';
export const DEFAULT_ANTHROPIC_BASE_URL = 'https://aiapiv2.pekpik.com';
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_KEY_ENV = 'PEKPIK_API_KEY';
export const DEFAULT_PROVIDER_ID = 'pekpik';
export const DEFAULT_PROVIDER_NAME = 'PekPik';

// `wire` says which API shape the snippet speaks, so a provider page can hide
// the Claude Code wrapper for endpoints that only speak the OpenAI protocol.
export const SNIPPET_CLIENTS = Object.freeze([
  {
    id: 'codex',
    label: 'Codex CLI',
    kind: 'config',
    mode: 'generated',
    language: 'toml',
    filename: 'config.toml',
    wire: 'openai',
    needsModel: true,
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    kind: 'config',
    mode: 'generated',
    language: 'bash',
    filename: 'run-claude-code.sh',
    wire: 'anthropic',
    needsModel: false,
  },
  {
    id: 'continue',
    label: 'Continue',
    kind: 'config',
    mode: 'generated',
    language: 'yaml',
    filename: 'config.yaml',
    wire: 'openai',
    needsModel: true,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    kind: 'guide',
    mode: 'guided',
    language: 'markdown',
    filename: 'SETUP.md',
    wire: 'openai',
    needsModel: true,
  },
  {
    id: 'cline',
    label: 'Cline',
    kind: 'guide',
    mode: 'guided',
    language: 'markdown',
    filename: 'SETUP.md',
    wire: 'openai',
    needsModel: true,
  },
  {
    id: 'curl',
    label: 'cURL',
    kind: 'example',
    mode: 'generated',
    language: 'bash',
    filename: 'verify.sh',
    wire: 'openai',
    needsModel: false,
  },
  {
    id: 'python',
    label: 'Python',
    kind: 'example',
    mode: 'generated',
    language: 'python',
    filename: 'chat.py',
    wire: 'openai',
    needsModel: true,
  },
  {
    id: 'node',
    label: 'Node.js',
    kind: 'example',
    mode: 'generated',
    language: 'javascript',
    filename: 'chat.mjs',
    wire: 'openai',
    needsModel: true,
  },
]);

export function snippetClient(clientId) {
  return SNIPPET_CLIENTS.find(({ id }) => id === clientId) ?? null;
}

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

// A model identifier, not a sentence. The leading `@` exists because
// Cloudflare Workers AI really does name its models `@cf/meta/llama-...`;
// everything else stays as narrow as it was, so no model name can carry a
// quote, a space, or a line break into a generated config.
export const MODEL_ID_PATTERN = /^[@A-Za-z0-9][A-Za-z0-9._:/-]*$/;

// YAML reserves `@` as an indicator, so a Cloudflare model has to be quoted.
// Anything matching this stays a plain scalar, which keeps every previously
// generated config.yaml byte-for-byte unchanged.
const YAML_PLAIN_SCALAR = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

function validateModel(value) {
  if (!MODEL_ID_PATTERN.test(value)) {
    throw new Error('--model contains unsupported characters');
  }
  return value;
}

function yamlScalar(value) {
  return YAML_PLAIN_SCALAR.test(value) ? value : JSON.stringify(value);
}

// `data/providers.json` lists what a reader will find in each catalog, which
// includes prose such as "200+ models routed across partner providers". Those
// entries describe a catalog; they are not identifiers anyone can paste into a
// config. Returning null is the honest answer, and the caller then offers the
// credential-free /models request, which needs no model name at all.
export function snippetModelFor(provider) {
  const models = Array.isArray(provider?.models) ? provider.models : [];
  return models.find((model) => MODEL_ID_PATTERN.test(model)) ?? null;
}

// The environment variable name is interpolated into shell, TOML, YAML, Python
// and JavaScript. Restricting it to upper snake case makes it inert in all five
// grammars, so no caller can smuggle a quote or a newline through this field.
export function validateKeyEnv(value) {
  if (typeof value !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(value)) {
    throw new Error('keyEnv must be an UPPER_SNAKE_CASE environment variable name');
  }
  return value;
}

// Used as a bare TOML key in `[model_providers.<id>]`.
function validateProviderId(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new Error('providerId must be a lowercase slug of letters, digits, and hyphens');
  }
  return value;
}

// Appears inside a TOML double-quoted string and after a YAML `name:` key.
// Parentheses are allowed because catalog names such as "Moonshot AI (Kimi)"
// carry them; quotes, colons, and line breaks stay out.
function validateProviderName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ()._-]*$/.test(value)) {
    throw new Error('providerName must not contain quotes, colons, or line breaks');
  }
  return value;
}

// `github-models` becomes GITHUB_MODELS_API_KEY. Provider pages use this so a
// reader who follows two providers does not end up with one variable holding
// whichever key they exported last.
export function keyEnvForProvider(provider) {
  const slug = String(provider?.id ?? '')
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!/^[A-Z][A-Z0-9_]*$/.test(slug)) {
    throw new Error(`Cannot derive an environment variable name from provider id: ${provider?.id}`);
  }
  return `${slug}_API_KEY`;
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function codexConfig({ baseUrl, model, keyEnv, providerId, providerName }) {
  return `# Merge this snippet into ~/.codex/config.toml.
# Project-level config cannot select a custom model provider.
model = "${model}"
model_provider = "${providerId}"

[model_providers.${providerId}]
name = "${providerName} OpenAI-compatible gateway"
base_url = "${baseUrl}"
env_key = "${keyEnv}"
wire_api = "responses"
`;
}

function claudeCodeWrapper({ baseUrl, keyEnv }) {
  return `#!/usr/bin/env sh
set -eu

: "\${${keyEnv}:?Set ${keyEnv} before running Claude Code}"
ANTHROPIC_BASE_URL=${shellQuote(baseUrl)} \\
ANTHROPIC_AUTH_TOKEN="$${keyEnv}" \\
exec claude "$@"
`;
}

function continueConfig({ baseUrl, model, keyEnv, providerName }) {
  const secretReference = `\${{ secrets.${keyEnv} }}`;
  return `name: ${providerName} Free LLM
version: 0.1.0
schema: v1
models:
  - name: ${providerName} ${model}
    provider: openai
    model: ${yamlScalar(model)}
    apiBase: ${baseUrl}
    apiKey: ${secretReference}
    roles:
      - chat
      - edit
      - apply
`;
}

function cursorGuide({ baseUrl, model, keyEnv }) {
  return `# Cursor setup

This project does not modify Cursor settings or its credential storage.

1. Open **Cursor Settings > Models**.
2. Add your key from the \`${keyEnv}\` environment variable to the OpenAI API key field manually.
3. Set **Override OpenAI Base URL** to \`${baseUrl}\`.
4. Add or select the model \`${model}\`, then click **Verify**.

Changing the OpenAI Base URL can affect built-in models. Custom API keys apply only to supported chat models; features such as Tab Completion continue to use Cursor's built-in models.
`;
}

function clineGuide({ baseUrl, model, keyEnv }) {
  return `# Cline setup

This project does not modify VS Code or Cline extension storage.

1. Open Cline settings and choose **OpenAI Compatible** as the API Provider.
2. Set **Base URL** to \`${baseUrl}\`.
3. Paste the key held in \`${keyEnv}\` into Cline's API Key field manually.
4. Set **Model ID** to \`${model}\`, save, and send a small test message.
`;
}

// The same request the browser checker sends: it lists the models the key can
// reach, which costs no tokens, creates no charge, and passes no content filter.
function curlVerify({ baseUrl, keyEnv }) {
  return `#!/usr/bin/env sh
set -eu

: "\${${keyEnv}:?Set ${keyEnv} to a key you created yourself at the provider console}"

# Prints the models this key can reach, then the HTTP status on its own line so
# 200, 401, and 429 stay distinguishable.
curl --silent --show-error \\
  --write-out '\\nHTTP %{http_code}\\n' \\
  --header "Authorization: Bearer $${keyEnv}" \\
  ${shellQuote(`${baseUrl}/models`)}
`;
}

function pythonExample({ baseUrl, model, keyEnv }) {
  return `"""Send one chat completion to an OpenAI-compatible endpoint.

The key is read from ${keyEnv}, so it never lives in this file, in your shell
history, or in version control. Standard library only: no pip install, no SDK.
"""

import json
import os
import urllib.error
import urllib.request

BASE_URL = "${baseUrl}"
MODEL = "${model}"
KEY_ENV = "${keyEnv}"


def main() -> int:
    key = os.environ.get(KEY_ENV)
    if not key:
        print(f"Set {KEY_ENV} to a key you created yourself at the provider console.")
        return 1

    request = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(
            {
                "model": MODEL,
                "messages": [{"role": "user", "content": "Reply with the single word: ready"}],
            }
        ).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        print(f"HTTP {error.code}: {detail}")
        return 1

    print(body["choices"][0]["message"]["content"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`;
}

function nodeExample({ baseUrl, model, keyEnv }) {
  return `// Send one chat completion to an OpenAI-compatible endpoint.
//
// The key is read from ${keyEnv}, so it never lives in this file, in your shell
// history, or in version control. Node 20+ only: no dependencies, no SDK.

const BASE_URL = ${JSON.stringify(baseUrl)};
const MODEL = ${JSON.stringify(model)};
const KEY_ENV = ${JSON.stringify(keyEnv)};

const key = process.env[KEY_ENV];
if (!key) {
  process.stderr.write(\`Set \${KEY_ENV} to a key you created yourself at the provider console.\\n\`);
  process.exit(1);
}

const response = await fetch(\`\${BASE_URL}/chat/completions\`, {
  method: 'POST',
  headers: {
    authorization: \`Bearer \${key}\`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
  }),
});

const body = await response.text();
if (!response.ok) {
  process.stderr.write(\`HTTP \${response.status}: \${body}\\n\`);
  process.exit(1);
}

process.stdout.write(\`\${JSON.parse(body).choices[0].message.content}\\n\`);
`;
}

const generators = {
  codex: codexConfig,
  'claude-code': claudeCodeWrapper,
  continue: continueConfig,
  cursor: cursorGuide,
  cline: clineGuide,
  curl: curlVerify,
  python: pythonExample,
  node: nodeExample,
};

/**
 * Render one snippet. Defaults reproduce the hosted gateway configuration the
 * CLI has always emitted; provider pages override every field.
 *
 * @returns {{clientId: string, label: string, kind: string, language: string,
 *   filename: string, wire: string, baseUrl: string, model: string,
 *   keyEnv: string, providerId: string, providerName: string, content: string}}
 */
export function renderSnippet(clientId, options = {}) {
  const client = snippetClient(clientId);
  if (!client) {
    throw new Error(`Unsupported client: ${clientId}`);
  }

  const defaultBaseUrl = client.wire === 'anthropic'
    ? DEFAULT_ANTHROPIC_BASE_URL
    : DEFAULT_OPENAI_BASE_URL;
  const values = {
    baseUrl: normalizeBaseUrl(options.baseUrl ?? defaultBaseUrl),
    model: validateModel(options.model ?? DEFAULT_MODEL),
    keyEnv: validateKeyEnv(options.keyEnv ?? DEFAULT_KEY_ENV),
    providerId: validateProviderId(options.providerId ?? DEFAULT_PROVIDER_ID),
    providerName: validateProviderName(options.providerName ?? DEFAULT_PROVIDER_NAME),
  };

  return {
    clientId: client.id,
    label: client.label,
    kind: client.kind,
    language: client.language,
    filename: client.filename,
    wire: client.wire,
    ...values,
    content: generators[client.id](values),
  };
}
