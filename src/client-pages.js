import { escapeMarkdown } from './markdown.js';

export const HOSTED_CTA_URL = 'https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api';

const CTA_QUESTION = 'Rotating keys across eight providers and hitting 429 every day?';
const CTA_ANSWER = 'One OpenAI-compatible endpoint covers every model.';

function isUsableWithOpenAiClient(provider) {
  return provider.openai_compatible
    && !provider.credit_card_required
    && provider.availability.accepting_new_users
    && provider.category !== 'metered-access';
}

export const LIMIT_STATUS_LABELS = Object.freeze({
  'tier-based': 'Set by project tier',
  'documented-per-model': 'Published per model',
  'documented-per-endpoint': 'Published per endpoint',
  'documented-per-tier': 'Published per tier',
  'documented-account-wide': 'Published account-wide',
  'documented-baseline': 'Published baseline, then scaled',
  'documented-in-compute-units': 'Published in compute units',
  'documented-in-credits': 'Published as a credit balance',
  'documented-in-plans': 'Published per paid plan',
  'documented-with-conditions': 'Published with conditions',
  'dynamic-no-fixed-numbers': 'Dynamic, no fixed numbers',
  'free-models-listed': 'Selected models priced at zero',
  not_published: 'Enforced but not published',
  retiring: 'Retiring',
  retired: 'Retired',
});

export function limitStatusLabel(status) {
  return LIMIT_STATUS_LABELS[status] ?? status;
}

function limitsLabel(provider) {
  const parts = [
    provider.limits.requests_per_minute === null ? null : `${provider.limits.requests_per_minute} RPM`,
    provider.limits.requests_per_day === null ? null : `${provider.limits.requests_per_day}/day`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : limitStatusLabel(provider.limits.status);
}

function renderProviderTable(providers) {
  const rows = providers
    .filter(isUsableWithOpenAiClient)
    .map((provider) => {
      const signup = provider.signup_url ? `[Sign up](${provider.signup_url})` : 'Closed';
      return `| ${escapeMarkdown(provider.name)} | \`${escapeMarkdown(provider.base_url)}\` | ${escapeMarkdown(limitsLabel(provider))} | ${signup} |`;
    })
    .join('\n');

  return `| Provider | OpenAI-compatible base URL | Published limits | Access |
| --- | --- | --- | --- |
${rows}`;
}

function renderCta() {
  return `---

${CTA_QUESTION} ${CTA_ANSWER}

[Create a PekPik API account](${HOSTED_CTA_URL})
`;
}

const pages = [
  {
    path: 'docs/claude-code.md',
    render: (table) => `# Claude Code with a free LLM API

Claude Code speaks the Anthropic Messages API. Every free tier in the table below speaks the OpenAI chat completions API. That protocol mismatch, not the key, is what usually breaks a free Claude Code setup.

## What has to be true

1. \`ANTHROPIC_BASE_URL\` must point at an endpoint that accepts Anthropic-format requests. Claude Code appends its own API path, so the value is a gateway root, not a \`/v1\` suffix.
2. \`ANTHROPIC_AUTH_TOKEN\` must hold the key. Claude Code reads it from the environment at start-up.
3. The model you name must exist on that endpoint. A wrong model id fails as a 404 from the provider, not as a Claude Code error.

## One command

\`\`\`bash
npx free-llm-api setup claude-code
PEKPIK_API_KEY=YOUR_API_KEY ./.free-llm/claude-code/run-claude-code.sh
\`\`\`

The generated file is a POSIX shell wrapper. It checks that the key variable exists, maps it to \`ANTHROPIC_AUTH_TOKEN\`, sets \`ANTHROPIC_BASE_URL\`, and then execs the installed \`claude\` binary. It stores the variable name, never the value. Point it somewhere else with \`--base-url\`.

## Two ways to reach a free tier

**Through a translation layer.** The providers below are OpenAI-compatible, so Claude Code cannot call them directly. [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) runs locally, holds your own provider keys, and exposes one endpoint with controlled failover.

**Through a gateway that already speaks Anthropic.** Then \`ANTHROPIC_BASE_URL\` is the gateway root and no translation layer is involved.

${table}

Numbers come from each provider's own documentation on the date recorded in [\`data/providers.json\`](../data/providers.json). Entries showing a status instead of a number publish no fixed rate.

## What to expect

Free tiers are rate limited per minute and per day, and Claude Code sends long tool-call prompts. Agentic sessions consume a daily quota faster than chat does. A 429 means that request was limited; it says nothing about your remaining quota unless the provider returns a reset header.

## Sources

- [Claude Code LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)
- [Client setup details](./clients.md)

${renderCta()}`,
  },
  {
    path: 'docs/codex.md',
    render: (table) => `# Codex CLI with a custom model provider

Codex CLI can call any OpenAI-compatible endpoint through a custom model provider. The configuration lives in \`~/.codex/config.toml\`.

## What has to be true

1. \`model_provider\` names an entry under \`[model_providers.*]\`.
2. That entry sets \`base_url\` and \`env_key\`. Codex reads the key from the named environment variable, so the key never enters the config file.
3. \`wire_api\` matches what the provider actually implements. Use \`"chat"\` for a provider that serves \`/chat/completions\`, and \`"responses"\` only where the Responses API is documented. A wrong value fails as a 404 or a schema error on the first request.
4. The file must be the user-level one. Codex's current security rules ignore project-level \`.codex/config.toml\` keys that redirect provider authentication, including \`model_provider\` and \`model_providers\`.

## One command

\`\`\`bash
npx free-llm-api setup codex
\`\`\`

This writes a merge snippet for review. Merge it into \`~/.codex/config.toml\` yourself; the CLI never edits an existing config in place.

## Free tiers that expose an OpenAI-compatible endpoint

${table}

Numbers come from each provider's own documentation on the date recorded in [\`data/providers.json\`](../data/providers.json). Entries showing a status instead of a number publish no fixed rate.

## What to expect

Codex sends large context windows for repository work. A provider with a generous request-per-day count can still cut you off on tokens per day. Check both columns in the catalog before committing to one provider.

## Sources

- [Codex advanced configuration and custom model providers](https://developers.openai.com/codex/config-advanced#custom-model-providers)
- [Client setup details](./clients.md)

${renderCta()}`,
  },
  {
    path: 'docs/cline.md',
    render: (table) => `# Cline with a free OpenAI-compatible API

Cline ships an **OpenAI Compatible** provider type. It takes three values: Base URL, API Key, and Model ID. Nothing else has to change.

## What has to be true

1. The Base URL is the root that serves \`/chat/completions\`. Most providers document it with the \`/v1\` suffix included.
2. The Model ID is the provider's exact id, not a display name. Cline passes it through verbatim.
3. The model must support tool calls well enough to produce valid diffs. This is the practical filter: small free models frequently return malformed edits, which Cline surfaces as repeated failed apply attempts rather than as an API error.

## One command

\`\`\`bash
npx free-llm-api setup cline
\`\`\`

This writes a review guide. The values are entered in the Cline settings panel by hand; this project does not read or write VS Code extension storage.

## Free tiers that expose an OpenAI-compatible endpoint

${table}

Numbers come from each provider's own documentation on the date recorded in [\`data/providers.json\`](../data/providers.json). Entries showing a status instead of a number publish no fixed rate.

## What to expect

Plan mode and Act mode call the model with different prompt sizes, so a provider that works for planning can still fail on a large diff. If edits fail repeatedly while the API returns 200, the model is the constraint, not the quota.

## Sources

- [Cline OpenAI Compatible provider](https://docs.cline.bot/provider-config/openai-compatible)
- [Client setup details](./clients.md)

${renderCta()}`,
  },
];

export const clientPagePaths = pages.map(({ path }) => path);

export function renderClientPages(providers) {
  const table = renderProviderTable(providers);
  return Object.fromEntries(pages.map(({ path, render }) => [path, render(table)]));
}
