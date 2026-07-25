# Cline with a free OpenAI-compatible API

Cline ships an **OpenAI Compatible** provider type. It takes three values: Base URL, API Key, and Model ID. Nothing else has to change.

## What has to be true

1. The Base URL is the root that serves `/chat/completions`. Most providers document it with the `/v1` suffix included.
2. The Model ID is the provider's exact id, not a display name. Cline passes it through verbatim.
3. The model must support tool calls well enough to produce valid diffs. This is the practical filter: small free models frequently return malformed edits, which Cline surfaces as repeated failed apply attempts rather than as an API error.

## One command

```bash
npx free-llm-api setup cline
```

This writes a review guide. The values are entered in the Cline settings panel by hand; this project does not read or write VS Code extension storage.

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

Plan mode and Act mode call the model with different prompt sizes, so a provider that works for planning can still fail on a large diff. If edits fail repeatedly while the API returns 200, the model is the constraint, not the quota.

## Sources

- [Cline OpenAI Compatible provider](https://docs.cline.bot/provider-config/openai-compatible)
- [Client setup details](./clients.md)

---

Rotating keys across eight providers and hitting 429 every day? One OpenAI-compatible endpoint covers every model.

[Create a PekPik API account](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api)
