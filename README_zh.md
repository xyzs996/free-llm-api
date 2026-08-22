# 免费大模型 API 清单

[English](README.md) · 简体中文

[![CI](https://github.com/xyzs996/free-llm-api/actions/workflows/ci.yml/badge.svg)](https://github.com/xyzs996/free-llm-api/actions/workflows/ci.yml)
[![许可证 MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![服务商](https://img.shields.io/endpoint?url=https%3A%2F%2Fxyzs996.github.io%2Ffree-llm-api%2Fbadges%2Fproviders.json&label=%E6%9C%8D%E5%8A%A1%E5%95%86)](https://xyzs996.github.io/free-llm-api/zh/)
[![来源核验于](https://img.shields.io/endpoint?url=https%3A%2F%2Fxyzs996.github.io%2Ffree-llm-api%2Fbadges%2Fchecked.json&label=%E6%9D%A5%E6%BA%90%E6%A0%B8%E9%AA%8C%E4%BA%8E)](https://xyzs996.github.io/free-llm-api/zh/methodology.html)

永久免费的 Provider、无需信用卡的选择、直达官方 API Key 申请入口、模型与已核验限额，都集中在这一份清单里。

> 13 家提供长期免费额度 · 13 家无需信用卡 · 13 家兼容 OpenAI · 来源核验于 2026-08-22。本仓库不分发任何 Key。一次探活只描述那一次采样请求，不代表服务商整体可用性。

**[浏览在线目录](https://xyzs996.github.io/free-llm-api/zh/) · [按模型选择](https://xyzs996.github.io/free-llm-api/zh/#browse) · [配置编码 Agent](docs/clients.md) · [检测自己的 Key](https://xyzs996.github.io/free-llm-api/zh/verify.html)**

[![可筛选的 LLM 免费额度目录](docs/assets/status-page.png)](https://xyzs996.github.io/free-llm-api/zh/)

Star 本仓库可以收藏这份数据集并跟进更新。Star 不会改变任何服务商的 Key、额度或限流，本项目也不会因为 Star 给出任何回报。

## 按需求选择免费 API

| 目标 | 推荐 | 入选依据 | 开始使用 |
| --- | --- | --- | --- |
| 已公布的每日请求上限最高 | [GroqCloud](https://xyzs996.github.io/free-llm-api/zh/provider/groq.html) | 已公布 1,000 次/天 | [申请 API Key](https://console.groq.com/keys) |
| 已公布的每分钟请求上限最高 | [SiliconFlow](https://xyzs996.github.io/free-llm-api/zh/provider/siliconflow.html) | 已公布 1,000 RPM | [申请 API Key](https://cloud.siliconflow.com/account/ak) |
| 可使用浏览器 Key 检测 | [Google Gemini API](https://xyzs996.github.io/free-llm-api/zh/provider/gemini.html) | 已验证支持浏览器跨域请求 | [申请 API Key](https://aistudio.google.com/apikey) |
| 快速配置编码 Agent | [GroqCloud](https://xyzs996.github.io/free-llm-api/zh/provider/groq.html) | 已有 OpenAI 兼容的编码工具配置 | [申请 API Key](https://console.groq.com/keys) |

这些推荐完全由公开数据规则生成，不是付费展示。完整比较请打开包含 26 家服务商的[可筛选目录](https://xyzs996.github.io/free-llm-api/zh/)。

免费不等于跑得起。真正要看的数是免费额度用完之后、替代它的那一档要多少钱。同一维护者整理了[一张表](https://github.com/xyzs996/ai-coding-field-notes/blob/main/README_CN.md)：引用过的每一个带单位的数字都在里面，**每一行都带着它出处的整句话**。其中每百万 token 的价钱是这几条：

| 价格 | 单位 | 它出自的那句原话 |
| --- | --- | --- |
| `$0.06 / $0.2` | per million | At the low end, MiniMax M3 runs $0.06 to $0.2 per million and draws 60% to 70% of its revenue from outside its home market. [→](https://xyzs996.github.io/ai-coding-field-notes/articles/1-6-billion-free-tokens-is-a-compression-ratio-not-a.html) |
| `$0.19 / $5` | per million tokens | Chinese AI models provide a cost-effective alternative to their American counterparts, with input costs as low as $0.19 per million tokens, compared to OpenAI's $5-12. [→](https://markyanai.medium.com/how-chinese-ai-agent-tools-leverage-1-6-billion-free-tokens-69b483c4eb6a) |
| `$1` | per million tokens | Top-tier Chinese models such as GLM5.2 and DeepSeek V4 Pro sit near $1 per million tokens at inference gross margins of 10% to 20%. [→](https://xyzs996.github.io/ai-coding-field-notes/articles/1-6-billion-free-tokens-is-a-compression-ratio-not-a.html) |
| `$1.25 / $4.25` | per million | Meta priced Muse Spark 1.1 at $1.25 per million input and $4.25 per million output, roughly 75% and 83% below Anthropic's Opus, and the tradeoff is visible in the benchmarks, since it leads on MCP Atlas and JobBench while trailing on SWE-Bench Pro and DeepSWE 1.1. [→](https://xyzs996.github.io/ai-coding-field-notes/articles/1-6-billion-free-tokens-is-a-compression-ratio-not-a.html) |
| `$3` | per million input tokens | The $3 per million input tokens price point means developers should carefully evaluate whether the premium model's capabilities justify the increased costs for their specific use cases. [→](https://xyzs996.github.io/ai-coding-field-notes/articles/choosing-the-right-ai-model-for-coding-cost-vs-efficiency.html) |

原话原样引用、不翻译——翻过来就成了我们的转述，而不是他们写的那句。所以一个 `$1.43` 不会在「每百万 token」「每月」「每席位」之间含混过去。机器读的话是 [JSON 和 CSV](https://cdn.jsdelivr.net/gh/xyzs996/ai-coding-field-notes@main/data/figures.json)，读文章的话看这篇：[token 账单到底花在哪](https://xyzs996.github.io/ai-coding-field-notes/articles/token-optimization-for-indie-developers-ai-api-bills.html)。

要换的那个模型不在上面几行里？[一句话说出它的名字](https://github.com/xyzs996/ai-coding-field-notes/issues/new?template=figure.yml&came_from=free-llm-api%2FREADME_zh.md)——只有一格要填，下一个去查的价钱按这个排。

## 永久免费额度

这里是主清单：均为 Provider 自己长期提供的免费额度，不是会过期的注册赠送额度，并且目前都不要求绑定信用卡。

| 服务商 | 模型 | 官方公布限额 | 信用卡 | OpenAI 兼容 | 获取 API Key |
| --- | --- | --- | --- | --- | --- |
| [Google Gemini API](https://xyzs996.github.io/free-llm-api/zh/provider/gemini.html) | Free-tier eligibility varies by model<br>gemini-2.5-flash<br>gemini-2.5-flash-lite | [动态 / 依模型而定](https://ai.google.dev/gemini-api/docs/rate-limits) | 不需要 | 是 | [申请](https://aistudio.google.com/apikey) |
| [GroqCloud](https://xyzs996.github.io/free-llm-api/zh/provider/groq.html) | openai/gpt-oss-120b<br>openai/gpt-oss-20b<br>openai/gpt-oss-safeguard-20b | [30 RPM，1,000 次/天](https://console.groq.com/docs/rate-limits) | 不需要 | 是 | [申请](https://console.groq.com/keys) |
| [SambaNova Cloud](https://xyzs996.github.io/free-llm-api/zh/provider/sambanova.html) | DeepSeek-V3.1<br>Meta-Llama-3.3-70B-Instruct<br>gpt-oss-120b | [20 RPM，20 次/天](https://sambanova-systems.mintlify.dev/docs/en/models/rate-limits.md) | 不需要 | 是 | [申请](https://cloud.sambanova.ai/apis) |
| [Cohere](https://xyzs996.github.io/free-llm-api/zh/provider/cohere.html) | command-a-03-2025<br>command-r-plus<br>embed-v4.0 | [20 RPM](https://docs.cohere.com/docs/rate-limits) | 不需要 | 是 | [申请](https://dashboard.cohere.com/api-keys) |
| [Cloudflare Workers AI](https://xyzs996.github.io/free-llm-api/zh/provider/cloudflare-workers-ai.html) | @cf/meta/llama-3.3-70b-instruct-fp8-fast<br>@cf/openai/gpt-oss-120b<br>@cf/qwen/qwen2.5-coder-32b-instruct | [动态 / 依模型而定](https://developers.cloudflare.com/workers-ai/platform/pricing/) | 不需要 | 是 | [申请](https://dash.cloudflare.com/profile/api-tokens) |
| [Hugging Face Inference Providers](https://xyzs996.github.io/free-llm-api/zh/provider/huggingface.html) | deepseek-ai/DeepSeek-V3-0324<br>openai/gpt-oss-120b<br>200+ models routed across partner providers | [动态 / 依模型而定](https://huggingface.co/docs/inference-providers/pricing) | 不需要 | 是 | [申请](https://huggingface.co/settings/tokens) |
| [SiliconFlow](https://xyzs996.github.io/free-llm-api/zh/provider/siliconflow.html) | Qwen/Qwen3-8B<br>THUDM/GLM-4-9B-0414<br>deepseek-ai/DeepSeek-R1 | [1,000 RPM](https://docs.siliconflow.com/en/userguide/rate-limits/rate-limit-and-upgradation) | 不需要 | 是 | [申请](https://cloud.siliconflow.com/account/ak) |
| [Fireworks AI](https://xyzs996.github.io/free-llm-api/zh/provider/fireworks.html) | accounts/fireworks/models/llama-v3p3-70b-instruct<br>accounts/fireworks/models/gpt-oss-120b | [10 RPM](https://docs.fireworks.ai/guides/quotas_usage/account-quotas) | 不需要 | 是 | [申请](https://app.fireworks.ai/settings/users/api-keys) |
| [Z.AI Open Platform](https://xyzs996.github.io/free-llm-api/zh/provider/zai.html) | GLM-4.7-Flash<br>GLM-4.5-Flash<br>GLM-4.6V-Flash | [动态 / 依模型而定](https://docs.z.ai/guides/overview/pricing) | 不需要 | 是 | [申请](https://z.ai/manage-apikey/apikey-list) |
| [Mistral La Plateforme](https://xyzs996.github.io/free-llm-api/zh/provider/mistral.html) | mistral-small-latest<br>open-mistral-nemo<br>codestral-latest | [动态 / 依模型而定](https://docs.mistral.ai/) | 不需要 | 是 | [申请](https://console.mistral.ai/api-keys) |
| [Alibaba Cloud Model Studio](https://xyzs996.github.io/free-llm-api/zh/provider/dashscope.html) | qwen-plus<br>qwen-turbo<br>qwen3-coder-plus | [动态 / 依模型而定](https://www.alibabacloud.com/help/en/model-studio/rate-limit) | 不需要 | 是 | [申请](https://bailian.console.alibabacloud.com/) |
| [Pollinations.AI](https://xyzs996.github.io/free-llm-api/zh/provider/pollinations.html) | openai<br>mistral<br>Community-hosted open models | [4 RPM](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) | 不需要 | 是 | [申请](https://pollinations.ai/) |
| [Ollama Cloud](https://xyzs996.github.io/free-llm-api/zh/provider/ollama-cloud.html) | gpt-oss:120b-cloud<br>gpt-oss:20b-cloud<br>qwen3-coder:480b-cloud | [动态 / 依模型而定](https://docs.ollama.com/cloud) | 不需要 | 是 | [申请](https://ollama.com/settings/keys) |

## 其他访问方式

下面的服务仍可能有用，但它们属于免费模型聚合、注册赠送额度、即将下线的免费档或按量计费，并非长期免费的 Provider Free Tier。

| 服务商 | 访问形式 | 模型 | 官方公布限额 | 信用卡 | OpenAI 兼容 | 获取 API Key |
| --- | --- | --- | --- | --- | --- | --- |
| [Novita AI](https://xyzs996.github.io/free-llm-api/zh/provider/novita.html) | 按量计费 | Llama 3.1 8B Instruct<br>OpenAI: GPT OSS 20B<br>BAAI:BGE-M3 | [动态 / 依模型而定](https://novita.ai/pricing) | 不需要 | 是 | [申请](https://novita.ai/settings/key-management) |
| [Moonshot AI (Kimi)](https://xyzs996.github.io/free-llm-api/zh/provider/moonshot.html) | 按量计费 | kimi-k2-0905-preview<br>moonshot-v1-8k<br>moonshot-v1-128k | [动态 / 依模型而定](https://platform.kimi.ai/docs/pricing/limits) | 不需要 | 是 | [申请](https://platform.moonshot.ai/console/api-keys) |
| [Cerebras Inference](https://xyzs996.github.io/free-llm-api/zh/provider/cerebras.html) | 注册赠送额度 | gpt-oss-120b<br>gemma-4-31b | [5 RPM](https://inference-docs.cerebras.ai/support/rate-limits) | 需要 | 是 | [申请](https://cloud.cerebras.ai/) |
| [Vercel AI Gateway](https://xyzs996.github.io/free-llm-api/zh/provider/vercel-ai-gateway.html) | 注册赠送额度 | Free Tier eligible model subset<br>openai/gpt-oss-120b<br>moonshotai/kimi-k2 | [动态 / 依模型而定](https://vercel.com/docs/ai-gateway/pricing) | 不需要 | 是 | [申请](https://vercel.com/dashboard/ai-gateway) |
| [IBM watsonx.ai](https://xyzs996.github.io/free-llm-api/zh/provider/watsonx.html) | 注册赠送额度 | ibm/granite-3-8b-instruct<br>meta-llama/llama-3-3-70b-instruct<br>mistralai/mistral-large | [动态 / 依模型而定](https://www.ibm.com/products/watsonx-ai/pricing) | 不需要 | 否 | [申请](https://dataplatform.cloud.ibm.com/registration/stepone) |
| [OpenRouter](https://xyzs996.github.io/free-llm-api/zh/provider/openrouter.html) | 免费模型聚合 | Model IDs ending in :free<br>openrouter/free | [20 RPM，50 次/天](https://openrouter.ai/docs/api-reference/limits) | 不需要 | 是 | [申请](https://openrouter.ai/settings/keys) |
| [GitHub Models](https://xyzs996.github.io/free-llm-api/zh/provider/github-models.html) | 已下线的免费额度<br>2026-07-30 已下线 | Retired — the model catalog is gone | [动态 / 依模型而定](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/) | 不需要 | 是 | 已停止新用户注册 |
| [Together AI](https://xyzs996.github.io/free-llm-api/zh/provider/together.html) | 按量计费 | meta-llama/Llama-3.3-70B-Instruct-Turbo<br>openai/gpt-oss-120b<br>Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo | [动态 / 依模型而定](https://docs.together.ai/docs/serverless/rate-limits) | 不需要 | 是 | [申请](https://api.together.ai/settings/api-keys) |
| [Nebius Token Factory](https://xyzs996.github.io/free-llm-api/zh/provider/nebius.html) | 按量计费 | deepseek-ai/DeepSeek-V3<br>meta-llama/Llama-3.3-70B-Instruct<br>Qwen/Qwen3-235B-A22B | [动态 / 依模型而定](https://docs.tokenfactory.nebius.com/ai-models-inference/rate-limits) | 不需要 | 是 | [申请](https://tokenfactory.nebius.com/) |
| [Perplexity API](https://xyzs996.github.io/free-llm-api/zh/provider/perplexity.html) | 按量计费 | sonar<br>sonar-pro<br>sonar-reasoning | [50 RPM](https://docs.perplexity.ai/docs/admin/rate-limits-usage-tiers) | 不需要 | 是 | [申请](https://www.perplexity.ai/account/api/keys) |
| [DeepInfra](https://xyzs996.github.io/free-llm-api/zh/provider/deepinfra.html) | 按量计费 | deepseek-ai/DeepSeek-V3<br>Qwen/Qwen3-Next-80B-A3B-Instruct<br>meta-llama/Llama-4-Scout-17B-16E | [动态 / 依模型而定](https://deepinfra.com/pricing) | 不需要 | 是 | [申请](https://deepinfra.com/dash/api_keys) |
| [Chutes](https://xyzs996.github.io/free-llm-api/zh/provider/chutes.html) | 按量计费 | zai-org/GLM-5<br>Qwen/Qwen3-32B<br>unsloth/Mistral-Nemo-Instruct-2407 | [动态 / 依模型而定](https://chutes.ai/pricing) | 不需要 | 是 | [申请](https://chutes.ai/app/api) |
| [Scaleway Generative APIs](https://xyzs996.github.io/free-llm-api/zh/provider/scaleway.html) | 按量计费 | llama-3.3-70b-instruct<br>gpt-oss-120b<br>qwen3-coder-30b-a3b-instruct | [动态 / 依模型而定](https://www.scaleway.com/en/docs/generative-apis/reference-content/rate-limits/) | 需要 | 是 | [申请](https://console.scaleway.com/) |

对于动态或依模型而定的限制，本项目不会用猜测数字替代。点击限额即可查看当前官方来源。

## 快速开始

申请你自己的 Groq API Key 后，只需要给 OpenAI SDK 换一个 Base URL 和模型 ID：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["GROQ_API_KEY"],
    base_url="https://api.groq.com/openai/v1",
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "用一句话打个招呼。"}],
)
print(response.choices[0].message.content)
```

编码 Agent 可以生成从环境变量读取 Key 的客户端配置：

```bash
npx free-llm-api setup claude-code
```

客户端指南：[Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [全部客户端](docs/clients.md)。

## 把这份清单拉进你自己的代码

上面这张表就是一个文件，不需要 key，带 `Access-Control-Allow-Origin: *`：

```bash
curl -s https://xyzs996.github.io/free-llm-api/providers.json
```

每一行都带着 `base_url`、`openai_compatible`、`credit_card_required`、`browser_check`、公开的 `limits`，以及每条额度是从哪个 `official_sources` 读来的 —— 全都带日期。这足够让程序自己挑服务商，而不是让人再读一遍上面那张表。其中既兼容 OpenAI、又不要信用卡的有 23 家：

```bash
curl -s https://xyzs996.github.io/free-llm-api/providers.json | jq -r '.[] | select(.openai_compatible and .credit_card_required == false) | "\(.id)\t\(.base_url)"'
```

构建流程不想访问 Pages 的话，[同样的字节在 CDN 上有一份](https://cdn.jsdelivr.net/gh/xyzs996/free-llm-api@main/data/providers.json)。`@main` 跟着分支走；换成 tag 就固定住了。

## 检测你已有的 Key

打开[浏览器 key 检测页](https://xyzs996.github.io/free-llm-api/zh/verify.html)。不用安装，也不会留存内容：请求从浏览器直达所选服务商。Content Security Policy 只允许连接清单中的 26 个服务商源，不允许统计服务或本站服务器。21 家支持跨域浏览器请求；被拦截的服务商会得到等价的 `curl` 命令。

## 三个问题答全了，出处都在

这一页只顺带提到的三件事，那三条帖子是从头答的：每条先给一句直接的回答，再把背后核过的数、以及那条数是哪天读到的，一并摆出来。帖子是英文的，标题不翻译——翻了，点进去看到的还是英文。

- [Which free LLM APIs work without a credit card — and what are the published limits?](https://github.com/xyzs996/free-llm-api/discussions/2)
- [What are the Gemini, Groq and OpenRouter free tier rate limits right now?](https://github.com/xyzs996/free-llm-api/discussions/3)
- [Which free LLM APIs are OpenAI compatible, and what base URL do I point my coding agent at?](https://github.com/xyzs996/free-llm-api/discussions/4)

## 为什么可以信任这份清单

- 每条限额和生命周期信息都链接官方来源，并记录核验日期。
- 注册赠送额度、按量计费、聚合器和即将下线的免费档与永久免费额度分开展示。
- 本仓库不保存或分发可用凭据；自己的 Key 应放在环境变量中。
- 一次探活不代表整体可用性。`429` 只说明这次采样被限流；原因和剩余额度都是未知的。

探活必须在 CI 之外显式运行，Key 只从对应环境变量读取：

```bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
```

被忽略的 `data/probe-output.json` 只包含受限的分类、状态码、延迟和时间戳，绝不包含 Key、响应体或原始异常。详见[核验方法](https://xyzs996.github.io/free-llm-api/zh/methodology.html)。

## 本周变化

2026-08-22 当周。发布以来的第一次复核。逐家重读了官方源：GitHub Models 已经关停，Novita 的免费行一条不剩，Groq 把两个 Llama 模型移出了免费表。有两家这次读不到源，核验日期保持原样。

- **生命周期 — GitHub Models：** 按预告于 2026-07-30 关停：playground、模型目录、推理 API 和 BYOK 端点全部下线。作为墓碑条目保留。
- **生命周期 — Novita AI：** inclusionai/Ling-3.0-flash 与 Mind Lab Macaron V1 Venti 不再标价为零；定价表上已无任何免费模型。移入按量计费。
- **生命周期 — Moonshot AI (Kimi)：** 文档迁至 platform.kimi.ai。最低一档仍需先充值 $1 才调得通，因此本条从「永久免费额度」移入按量计费。
- **限额变化 — GroqCloud：** llama-3.3-70b-versatile 与 llama-3.1-8b-instant 已离开免费计划表；openai/gpt-oss-safeguard-20b、qwen/qwen3.6-27b、groq/compound-mini 在表内。RPM/RPD 两列改取 openai/gpt-oss-120b 的 30 RPM / 1K RPD。
- **限额变化 — Cerebras Inference：** zai-glm-4.7 已离开免费试用表；只剩 gpt-oss-120b 与 gemma-4-31b，仍为 5 RPM / 30K TPM / 1M TPH / 1M TPD。
- **新增 — Z.AI Open Platform：** 视觉模型 GLM-4.6V-Flash 现在与 GLM-4.7-Flash、GLM-4.5-Flash 一样，定价各列均为 $0。
- **新增 — SambaNova Cloud：** DeepSeek-V3.2 与 gemma-4-31B-it 以预览身份进入免费表，数字同为 20 RPM / 20 RPD / 200K TPD。
- **更正（4）：** Pollinations.AI、Nebius Token Factory、Vercel AI Gateway、Cloudflare Workers AI

上面每一条都能在下方清单里找到对应的核验日期与官方来源。完整历史见 [`data/changelog.json`](data/changelog.json)。

一条免费通道关掉,就变成一笔账单 —— 而这份清单到免费额度为止。付费的那几家每百万 token 实际多少钱、每个数字出自哪一句话:[实地记录里的成本表](https://github.com/xyzs996/ai-coding-field-notes/blob/main/README_CN.md)。

## 参与贡献

这个项目最需要的贡献是纠错：某家限额变化、停止注册或链接失效。见 [CONTRIBUTING.md](CONTRIBUTING.md) 与[纠错表单](https://github.com/xyzs996/free-llm-api/issues/new?template=correction.yml)。

没把握到能填表？[一行就够](https://github.com/xyzs996/free-llm-api/issues/new?template=heard.yml&came_from=README_zh.md)——表单只有一格，不用链接、不用截图、不用出处，那页由别人去找。

## 数据与本地运行

- `data/providers.json` 是经过核验的源数据集。
- [`llms.txt`](https://xyzs996.github.io/free-llm-api/llms.txt) 把整份清单压成一个纯文本文件：每家一行，带上它的额度、base URL，以及那条额度是哪天读到的。
- `data/changelog.json` 记录每周变化。
- `README.md`、`docs/providers.json` 和静态页面全部确定性生成。
- 写了额度却没有官方来源时，`npm run validate` 会失败。

```bash
npm run render && npm run serve
```

打开 `http://127.0.0.1:4173`。需要 Node.js 20+，无运行时依赖，也不需要任何 API Key。

## 安全

本仓库不含任何可用凭据。探活用的 Key 请放在环境变量里，报告中请抹掉 Authorization 头。详见 [SECURITY.md](SECURITY.md)。

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=xyzs996/free-llm-api&type=Date)](https://star-history.com/#xyzs996/free-llm-api&Date)

## 相关项目

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) 把你自己的多家 Key 收敛到一个本地端点，并做受控故障转移。
- [AI Coding Field Notes](https://github.com/xyzs996/ai-coding-field-notes/blob/main/README_CN.md) 把引用过的每一个带单位的数字都发成了 [JSON 和 CSV](https://cdn.jsdelivr.net/gh/xyzs996/ai-coding-field-notes@main/data/figures.json)，每一行都带着它出处的那句话，后面是对应的长文。

## 需要一个稳定端点？

如果轮换免费 Key 和处理不同限额本身已经成为工作，可以[创建 PekPik API 账号](https://aiapiv2.pekpik.com/register?utm_source=github&utm_medium=repo&utm_campaign=free-llm-api)，获得一个 OpenAI 兼容的托管端点。上面的免费目录不依赖它也能正常使用。
