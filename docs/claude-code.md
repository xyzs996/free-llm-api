# Claude Code with a free LLM API

Claude Code speaks the Anthropic Messages API. Every free tier in the table below speaks the OpenAI chat completions API. That protocol mismatch, not the key, is what usually breaks a free Claude Code setup.

## What has to be true

1. `ANTHROPIC_BASE_URL` must point at an endpoint that accepts Anthropic-format requests. Claude Code appends its own API path, so the value is a gateway root, not a `/v1` suffix.
2. `ANTHROPIC_AUTH_TOKEN` must hold the key. Claude Code reads it from the environment at start-up.
3. The model you name must exist on that endpoint. A wrong model id fails as a 404 from the provider, not as a Claude Code error.

## One command

```bash
npx free-llm-api setup claude-code
PEKPIK_API_KEY=YOUR_API_KEY ./.free-llm/claude-code/run-claude-code.sh
```

The generated file is a POSIX shell wrapper. It checks that the key variable exists, maps it to `ANTHROPIC_AUTH_TOKEN`, sets `ANTHROPIC_BASE_URL`, and then execs the installed `claude` binary. It stores the variable name, never the value. Point it somewhere else with `--base-url`.

## Two ways to reach a free tier

**Through a translation layer.** The providers below are OpenAI-compatible, so Claude Code cannot call them directly. [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) runs locally, holds your own provider keys, and exposes one endpoint with controlled failover.

**Through a gateway that already speaks Anthropic.** Then `ANTHROPIC_BASE_URL` is the gateway root and no translation layer is involved.

| Provider | OpenAI-compatible base URL | Published limits | Access |
| --- | --- | --- | --- |
| Google Gemini API | `https://generativelanguage.googleapis.com/v1beta/openai/` | Set by project tier | [Sign up](https://aistudio.google.com/apikey) |
| GroqCloud | `https://api.groq.com/openai/v1` | 30 RPM, 1000/day | [Sign up](https://console.groq.com/keys) |
| SambaNova Cloud | `https://api.sambanova.ai/v1` | 20 RPM, 20/day | [Sign up](https://cloud.sambanova.ai/apis) |
| Cohere | `https://api.cohere.ai/compatibility/v1` | 20 RPM | [Sign up](https://dashboard.cohere.com/api-keys) |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1` | Published in compute units | [Sign up](https://dash.cloudflare.com/profile/api-tokens) |
| Hugging Face Inference Providers | `https://router.huggingface.co/v1` | Published as a credit balance | [Sign up](https://huggingface.co/settings/tokens) |
| SiliconFlow | `https://api.siliconflow.com/v1` | 1000 RPM | [Sign up](https://cloud.siliconflow.com/account/ak) |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | 10 RPM | [Sign up](https://app.fireworks.ai/settings/users/api-keys) |
| Z.AI Open Platform | `https://api.z.ai/api/paas/v4` | Selected models priced at zero | [Sign up](https://z.ai/manage-apikey/apikey-list) |
| Mistral La Plateforme | `https://api.mistral.ai/v1` | Enforced but not published | [Sign up](https://console.mistral.ai/api-keys) |
| Alibaba Cloud Model Studio | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | Published per model | [Sign up](https://bailian.console.alibabacloud.com/) |
| Pollinations.AI | `https://text.pollinations.ai/openai` | 4 RPM | [Sign up](https://pollinations.ai/) |
| Ollama Cloud | `https://ollama.com/v1` | Enforced but not published | [Sign up](https://ollama.com/settings/keys) |
| Vercel AI Gateway | `https://ai-gateway.vercel.sh/v1` | Published as a credit balance | [Sign up](https://vercel.com/dashboard/ai-gateway) |
| OpenRouter | `https://openrouter.ai/api/v1` | 20 RPM, 50/day | [Sign up](https://openrouter.ai/settings/keys) |

Numbers come from each provider's own documentation on the date recorded in [`data/providers.json`](../data/providers.json). Entries showing a status instead of a number publish no fixed rate.

## What to expect

Free tiers are rate limited per minute and per day, and Claude Code sends long tool-call prompts. Agentic sessions consume a daily quota faster than chat does. A 429 means that request was limited; it says nothing about your remaining quota unless the provider returns a reset header.

## Sources

- [Claude Code LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)
- [Client setup details](./clients.md)

---

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model.

[Create a PekPik API account](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api)
