# 免费 LLM API 清单

[English](README.md) · 简体中文

一份有官方来源可查的免费 LLM API 与免费额度清单，附可解释的采样探活、可筛选的状态页，以及面向编码 agent 的一条命令配置。

> 来源核验日期：2026-07-25。一次探活只描述那一次采样请求，不代表服务商整体可用性。

## 本周变化

2026-07-25 当周。首次发布清单：26 家服务商，每个公布的数字都能追溯到本周核验过的官方页面。

- **新增（26）：** Google Gemini API、GroqCloud、SambaNova Cloud、Cohere、Cloudflare Workers AI、Hugging Face Inference Providers、SiliconFlow、Fireworks AI、Z.AI Open Platform、Novita AI、Mistral La Plateforme、Alibaba Cloud Model Studio、Moonshot AI (Kimi)、Pollinations.AI、Ollama Cloud、Cerebras Inference、Vercel AI Gateway、IBM watsonx.ai、OpenRouter、GitHub Models、Together AI、Nebius Token Factory、Perplexity API、DeepInfra、Chutes、Scaleway Generative APIs
- **生命周期 — GitHub Models：** 免费档 2026-07-30 下线，因此清单不提供它的注册链接。
- **更正 — Cerebras Inference：** 通过验证的支付方式是调用 API 的前提，所以这不算免信用卡的免费额度。
- **更正 — Fireworks AI：** 未绑定支付方式时的 10 RPM 上限作用于整个账号，不是按模型计算。

上面每一条都能在下方清单里找到对应的核验日期与官方来源。完整历史见 [`data/changelog.json`](data/changelog.json)。

## 验证你手上已有的 key

打开[浏览器 key 检测页](https://xyzs996.github.io/free-llm-api/verify.html)。不用安装、不留存任何内容：请求从你的浏览器直连服务商，因为该页面的 Content Security Policy 只允许连接本清单里的 26 个服务商源，除此之外一处都不允许——既没有统计服务，也没有本站自己。

26 家里有 21 家会响应跨域浏览器请求，其余 5 家会拒绝；对这些服务商，页面直接给出等价的 `curl` 命令，而不是猜一个结论。

## 本地运行

```bash
npm run render && npm run serve
```

打开 `http://127.0.0.1:4173`。需要 Node.js 20+，无运行时依赖，也不需要任何 API key。

把编码 agent 指向你已经拿到访问权限的任意端点：

```bash
npx free-llm-api setup claude-code
```

客户端指南：[Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [全部客户端](docs/clients.md)。

在八家服务商之间轮换 key、每天都撞 429？一个 OpenAI 兼容端点即可覆盖全部模型。[创建 PekPik API 账号](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api)。

Star 本仓库可以收藏这份数据集并跟进更新。Star 不会改变任何服务商的 key、额度或限流，本项目也不会因为 Star 给出任何回报。

![可筛选的 LLM 免费额度状态页](docs/assets/status-page.png)

## 服务商清单

| 服务商 | 免费形式 | 需信用卡 | OpenAI 兼容 | 官方公布限额 | 状态 | 注册 |
| --- | --- | --- | --- | --- | --- | --- |
| [Google Gemini API](https://ai.google.dev/gemini-api/docs/rate-limits) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://aistudio.google.com/apikey) |
| [GroqCloud](https://console.groq.com/docs/rate-limits) | 厂商免费额度 | 否 | 是 | 30 RPM，1000 次/天 | 正常开放 | [注册](https://console.groq.com/keys) |
| [SambaNova Cloud](https://sambanova-systems.mintlify.dev/docs/en/models/rate-limits.md) | 厂商免费额度 | 否 | 是 | 20 RPM，20 次/天 | 正常开放 | [注册](https://cloud.sambanova.ai/apis) |
| [Cohere](https://docs.cohere.com/docs/rate-limits) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://dashboard.cohere.com/api-keys) |
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://dash.cloudflare.com/profile/api-tokens) |
| [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/pricing) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://huggingface.co/settings/tokens) |
| [SiliconFlow](https://docs.siliconflow.com/en/userguide/rate-limits/rate-limit-and-upgradation) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://cloud.siliconflow.com/account/ak) |
| [Fireworks AI](https://docs.fireworks.ai/guides/quotas_usage/account-quotas) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://app.fireworks.ai/settings/users/api-keys) |
| [Z.AI Open Platform](https://docs.z.ai/guides/overview/pricing) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://z.ai/manage-apikey/apikey-list) |
| [Novita AI](https://novita.ai/pricing) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://novita.ai/settings/key-management) |
| [Mistral La Plateforme](https://docs.mistral.ai/) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://console.mistral.ai/api-keys) |
| [Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/rate-limit) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://bailian.console.alibabacloud.com/) |
| [Moonshot AI (Kimi)](https://platform.moonshot.ai/docs/pricing/limits) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://platform.moonshot.ai/console/api-keys) |
| [Pollinations.AI](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://pollinations.ai/) |
| [Ollama Cloud](https://docs.ollama.com/cloud) | 厂商免费额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://ollama.com/settings/keys) |
| [Cerebras Inference](https://inference-docs.cerebras.ai/support/rate-limits) | 注册赠送额度 | 是 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://cloud.cerebras.ai/) |
| [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/pricing) | 注册赠送额度 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://vercel.com/dashboard/ai-gateway) |
| [IBM watsonx.ai](https://www.ibm.com/products/watsonx-ai/pricing) | 注册赠送额度 | 否 | 否 | 动态 / 依模型而定 | 正常开放 | [注册](https://dataplatform.cloud.ibm.com/registration/stepone) |
| [OpenRouter](https://openrouter.ai/docs/api-reference/limits) | 免费模型聚合 | 否 | 是 | 20 RPM，50 次/天 | 正常开放 | [注册](https://openrouter.ai/settings/keys) |
| [GitHub Models](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/) | 即将下线的免费额度 | 否 | 是 | 动态 / 依模型而定 | 2026-07-30 下线 | 已停止新用户注册 |
| [Together AI](https://docs.together.ai/docs/serverless/rate-limits) | 按量计费 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://api.together.ai/settings/api-keys) |
| [Nebius Token Factory](https://docs.tokenfactory.nebius.com/ai-models-inference/rate-limits) | 按量计费 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://tokenfactory.nebius.com/) |
| [Perplexity API](https://docs.perplexity.ai/docs/admin/rate-limits-usage-tiers) | 按量计费 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://www.perplexity.ai/account/api/keys) |
| [DeepInfra](https://deepinfra.com/pricing) | 按量计费 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://deepinfra.com/dash/api_keys) |
| [Chutes](https://chutes.ai/pricing) | 按量计费 | 否 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://chutes.ai/app/api) |
| [Scaleway Generative APIs](https://www.scaleway.com/en/docs/generative-apis/reference-content/rate-limits/) | 按量计费 | 是 | 是 | 动态 / 依模型而定 | 正常开放 | [注册](https://console.scaleway.com/) |

标注为动态或依模型而定的限额，不会用猜测的数字替代。请点开对应链接查看服务商当前的官方额度。

## 探活语义

- `200`：这次采样请求成功。
- `401/403`：只说明采样用的凭据被拒绝。
- `429`：只说明这次采样被限流；原因和剩余额度都是未知的。
- `5xx` 或网络错误：采样端点这次连不通，不能据此断定服务商整体故障。

探活必须在 CI 之外显式运行。key 只从对应服务商的环境变量读取：

```bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
```

默认且唯一支持的输出是被 gitignore 的 `data/probe-output.json`，其中只有分类、状态码、延迟和时间戳，绝不包含 key、响应体或原始异常。CI 只校验静态数据，从不执行带凭据的探活。

## 数据

- `data/providers.json` 是经过核验的源数据集。
- `data/changelog.json` 记录每周变化，最新一周渲染在上方。
- `docs/providers.json`、`docs/index.html` 以及本文件由 `npm run render` 确定性生成，请勿手改产物。
- 每条记录都带官方来源与 `source_checked_at` 日期；写了额度却没有来源时 `npm run validate` 会失败。

## 安全

本仓库不含任何可用凭据。探活用的 key 请放在环境变量里，报告中请抹掉 Authorization 头。详见 [SECURITY.md](SECURITY.md)。

## 相关项目

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) 把你自己的多家 key 收敛到一个本地端点，并做受控故障转移。
