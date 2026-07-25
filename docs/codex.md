# Codex CLI with a custom model provider

Codex CLI can call any OpenAI-compatible endpoint through a custom model provider. The configuration lives in `~/.codex/config.toml`.

## What has to be true

1. `model_provider` names an entry under `[model_providers.*]`.
2. That entry sets `base_url` and `env_key`. Codex reads the key from the named environment variable, so the key never enters the config file.
3. `wire_api` matches what the provider actually implements. Use `"chat"` for a provider that serves `/chat/completions`, and `"responses"` only where the Responses API is documented. A wrong value fails as a 404 or a schema error on the first request.
4. The file must be the user-level one. Codex's current security rules ignore project-level `.codex/config.toml` keys that redirect provider authentication, including `model_provider` and `model_providers`.

## One command

```bash
npx free-llm-api setup codex
```

This writes a merge snippet for review. Merge it into `~/.codex/config.toml` yourself; the CLI never edits an existing config in place.

## Free tiers that expose an OpenAI-compatible endpoint

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
| Novita AI | `https://api.novita.ai/openai` | Selected models priced at zero | [Sign up](https://novita.ai/settings/key-management) |
| Mistral La Plateforme | `https://api.mistral.ai/v1` | Enforced but not published | [Sign up](https://console.mistral.ai/api-keys) |
| Alibaba Cloud Model Studio | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | Published per model | [Sign up](https://bailian.console.alibabacloud.com/) |
| Moonshot AI (Kimi) | `https://api.moonshot.ai/v1` | Published per tier | [Sign up](https://platform.moonshot.ai/console/api-keys) |
| Pollinations.AI | `https://text.pollinations.ai/openai` | Enforced but not published | [Sign up](https://pollinations.ai/) |
| Ollama Cloud | `https://ollama.com/v1` | Enforced but not published | [Sign up](https://ollama.com/settings/keys) |
| Vercel AI Gateway | `https://ai-gateway.vercel.sh/v1` | Published as a credit balance | [Sign up](https://vercel.com/dashboard/ai-gateway) |
| OpenRouter | `https://openrouter.ai/api/v1` | 20 RPM, 50/day | [Sign up](https://openrouter.ai/settings/keys) |

Numbers come from each provider's own documentation on the date recorded in [`data/providers.json`](../data/providers.json). Entries showing a status instead of a number publish no fixed rate.

## What to expect

Codex sends large context windows for repository work. A provider with a generous request-per-day count can still cut you off on tokens per day. Check both columns in the catalog before committing to one provider.

## Sources

- [Codex advanced configuration and custom model providers](https://developers.openai.com/codex/config-advanced#custom-model-providers)
- [Client setup details](./clients.md)

---

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model.

[Create a PekPik API account](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api)
