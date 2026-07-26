# Free LLM API

English · [简体中文](README_zh.md)

[![CI](https://github.com/xyzs996/free-llm-api/actions/workflows/ci.yml/badge.svg)](https://github.com/xyzs996/free-llm-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![providers](https://img.shields.io/endpoint?url=https%3A%2F%2Fxyzs996.github.io%2Ffree-llm-api%2Fbadges%2Fproviders.json&label=providers)](https://xyzs996.github.io/free-llm-api/)
[![sources checked](https://img.shields.io/endpoint?url=https%3A%2F%2Fxyzs996.github.io%2Ffree-llm-api%2Fbadges%2Fchecked.json&label=sources%20checked)](https://xyzs996.github.io/free-llm-api/methodology.html)

A source-backed directory of free LLM API tiers: where to get your own API key from each provider, what the published limits actually are, and how to point a coding agent at one.

> Sources last reviewed: 2026-07-25. No keys are distributed here — every entry links to the provider's own signup. A probe describes one sampled request, not provider-wide uptime.

**[Status page](https://xyzs996.github.io/free-llm-api/) · [Browser key checker](https://xyzs996.github.io/free-llm-api/verify.html) · [Provider catalog](#provider-catalog) · [How this is checked](https://xyzs996.github.io/free-llm-api/methodology.html)**

[![Filterable LLM free-tier status page](docs/assets/status-page.png)](https://xyzs996.github.io/free-llm-api/)

Star this repository to bookmark the dataset and follow releases. A star changes nothing about any provider's keys, credits, or limits, and this project gives nothing in return for one.

## Check a key you already have

Open the [browser key checker](https://xyzs996.github.io/free-llm-api/verify.html). Nothing is installed and nothing is stored: the request goes from your browser straight to the provider, because the page's Content Security Policy allows connections to the 26 provider origins in this catalog and to nothing else — not to an analytics host, and not to this site.

21 of 26 providers answer a cross-origin browser request. The other 5 refuse one, so the page prints the equivalent `curl` command instead of guessing.

## Point a coding agent at one

Point a coding agent at any endpoint you already have access to:

```bash
npx free-llm-api setup claude-code
```

Client guides: [Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [all clients](docs/clients.md).

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model. [Create a PekPik API account](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api).

## Run locally

```bash
npm run render && npm run serve
```

Open `http://127.0.0.1:4173`. Node.js 20+ is required; there are no runtime dependencies and no API keys are needed.

## Changed this week

Week of 2026-07-25. First published catalog: 26 providers, every published number traced to an official page checked this week.

- **Added (26):** Google Gemini API, GroqCloud, SambaNova Cloud, Cohere, Cloudflare Workers AI, Hugging Face Inference Providers, SiliconFlow, Fireworks AI, Z.AI Open Platform, Novita AI, Mistral La Plateforme, Alibaba Cloud Model Studio, Moonshot AI (Kimi), Pollinations.AI, Ollama Cloud, Cerebras Inference, Vercel AI Gateway, IBM watsonx.ai, OpenRouter, GitHub Models, Together AI, Nebius Token Factory, Perplexity API, DeepInfra, Chutes, Scaleway Generative APIs
- **Lifecycle — GitHub Models:** Free tier retires 2026-07-30, so the catalog carries no signup link for it.
- **Corrected — Cerebras Inference:** A verified payment method is a precondition for API access, so this is not a card-free free tier.
- **Corrected — Fireworks AI:** The 10 RPM cap for accounts without a payment method applies account-wide, not per model.

Every entry above is dated and sourced in the catalog below. Full history: [`data/changelog.json`](data/changelog.json).

## Provider catalog

| Provider | Free access type | Credit card | OpenAI compatible | Published limits | Lifecycle | Signup |
| --- | --- | --- | --- | --- | --- | --- |
| [Google Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://aistudio.google.com/apikey) |
| [GroqCloud](https://console.groq.com/docs/rate-limits) | Provider free tier | No | Yes | 30 RPM, 1000 requests/day | active | [Open](https://console.groq.com/keys) |
| [SambaNova Cloud](https://sambanova-systems.mintlify.dev/docs/en/models/rate-limits.md) | Provider free tier | No | Yes | 20 RPM, 20 requests/day | active | [Open](https://cloud.sambanova.ai/apis) |
| [Cohere](https://docs.cohere.com/docs/rate-limits) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://dashboard.cohere.com/api-keys) |
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://dash.cloudflare.com/profile/api-tokens) |
| [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/pricing) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://huggingface.co/settings/tokens) |
| [SiliconFlow](https://docs.siliconflow.com/en/userguide/rate-limits/rate-limit-and-upgradation) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://cloud.siliconflow.com/account/ak) |
| [Fireworks AI](https://docs.fireworks.ai/guides/quotas_usage/account-quotas) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://app.fireworks.ai/settings/users/api-keys) |
| [Z.AI Open Platform](https://docs.z.ai/guides/overview/pricing) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://z.ai/manage-apikey/apikey-list) |
| [Novita AI](https://novita.ai/pricing) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://novita.ai/settings/key-management) |
| [Mistral La Plateforme](https://docs.mistral.ai/) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://console.mistral.ai/api-keys) |
| [Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/rate-limit) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://bailian.console.alibabacloud.com/) |
| [Moonshot AI (Kimi)](https://platform.moonshot.ai/docs/pricing/limits) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://platform.moonshot.ai/console/api-keys) |
| [Pollinations.AI](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://pollinations.ai/) |
| [Ollama Cloud](https://docs.ollama.com/cloud) | Provider free tier | No | Yes | Dynamic / model-dependent | active | [Open](https://ollama.com/settings/keys) |
| [Cerebras Inference](https://inference-docs.cerebras.ai/support/rate-limits) | Free trial credit | Yes | Yes | Dynamic / model-dependent | active | [Open](https://cloud.cerebras.ai/) |
| [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/pricing) | Free trial credit | No | Yes | Dynamic / model-dependent | active | [Open](https://vercel.com/dashboard/ai-gateway) |
| [IBM watsonx.ai](https://www.ibm.com/products/watsonx-ai/pricing) | Free trial credit | No | No | Dynamic / model-dependent | active | [Open](https://dataplatform.cloud.ibm.com/registration/stepone) |
| [OpenRouter](https://openrouter.ai/docs/api-reference/limits) | Free model aggregator | No | Yes | 20 RPM, 50 requests/day | active | [Open](https://openrouter.ai/settings/keys) |
| [GitHub Models](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/) | Retiring free tier | No | Yes | Dynamic / model-dependent | Retires 2026-07-30 | Closed to new users |
| [Together AI](https://docs.together.ai/docs/serverless/rate-limits) | Metered access | No | Yes | Dynamic / model-dependent | active | [Open](https://api.together.ai/settings/api-keys) |
| [Nebius Token Factory](https://docs.tokenfactory.nebius.com/ai-models-inference/rate-limits) | Metered access | No | Yes | Dynamic / model-dependent | active | [Open](https://tokenfactory.nebius.com/) |
| [Perplexity API](https://docs.perplexity.ai/docs/admin/rate-limits-usage-tiers) | Metered access | No | Yes | Dynamic / model-dependent | active | [Open](https://www.perplexity.ai/account/api/keys) |
| [DeepInfra](https://deepinfra.com/pricing) | Metered access | No | Yes | Dynamic / model-dependent | active | [Open](https://deepinfra.com/dash/api_keys) |
| [Chutes](https://chutes.ai/pricing) | Metered access | No | Yes | Dynamic / model-dependent | active | [Open](https://chutes.ai/app/api) |
| [Scaleway Generative APIs](https://www.scaleway.com/en/docs/generative-apis/reference-content/rate-limits/) | Metered access | Yes | Yes | Dynamic / model-dependent | active | [Open](https://console.scaleway.com/) |

Limits marked dynamic or model-dependent are intentionally not replaced with guessed numbers. Follow each provider link for the current official quota.

## Probe semantics

- `200`: the sampled request succeeded.
- `401/403`: only the sample credential was rejected.
- `429`: only the sample was rate-limited; the cause and remaining quota are unknown.
- `5xx` or a network error: the sampled endpoint had a reachability problem; this is not proof of a provider-wide outage.

Run probes explicitly outside CI. Keys are read only from the provider environment variable:

```bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
```

The default and only supported output is the ignored `data/probe-output.json`. It contains the classification, status, latency, and timestamp, never the key, response body, or raw exception. CI validates static data and never runs authenticated probes.

## Data

- `data/providers.json` is the reviewed source dataset.
- `data/changelog.json` records what changed each week; the newest week is rendered above.
- `docs/providers.json`, `docs/index.html`, and this README are generated deterministically by `npm run render`.
- Every provider entry includes official sources and a `source_checked_at` date. `npm run validate` fails when a quota is stated without one.

## Contributing

Corrections are the contribution this project runs on: a limit that moved, a
provider that closed signups, a link that died. Every claim in the catalog cites
an official page, so a fix is a data edit with a source next to it — see
[CONTRIBUTING.md](CONTRIBUTING.md) and the [issue templates](https://github.com/xyzs996/free-llm-api/issues/new/choose).

## Security

This repository contains no working credentials. Keep probe keys in environment variables and redact Authorization headers from reports. See [SECURITY.md](SECURITY.md).

## Star history

[![Star History Chart](https://api.star-history.com/svg?repos=xyzs996/free-llm-api&type=Date)](https://star-history.com/#xyzs996/free-llm-api&Date)

## Related projects

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) combines your own provider keys behind one local endpoint with controlled failover.
