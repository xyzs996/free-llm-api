import { renderBadges, starHistory } from './badges.js';
import { HOSTED_CTA_URL } from './client-pages.js';
import { accessGroups, catalogSummary, quickPicks } from './growth.js';
import { escapeMarkdown } from './markdown.js';
import { LOCALES, REPO_URL, SITE_URL, localePath } from './site.js';
import { connectSrcOrigins } from './verify-page.js';

// This README sends readers to the Chinese edition of the site, not to the
// English page that happens to share the filename. If the Chinese pages are
// ever dropped from the render the links fall back to the root rather than
// pointing at an address nothing publishes.
const ZH_LOCALE = LOCALES.find(({ code }) => code === 'zh') ?? { path_prefix: '' };

function zhUrl(path) {
  return `${SITE_URL}${localePath(path, ZH_LOCALE)}`;
}

// The same vocabulary the Chinese pages print, taken from the one string table
// rather than restated here. This file had these words first; keeping a second
// copy is how a category ends up translated on the site and left as a raw slug
// in the README.
export {
  AVAILABILITY_STATUS_ZH,
  CATEGORY_TITLES_ZH,
  CHANGE_LABELS_ZH,
} from './i18n.js';

import {
  AVAILABILITY_STATUS_ZH,
  CATEGORY_TITLES_ZH,
  CHANGE_LABELS_ZH,
} from './i18n.js';

const GROUPED_CHANGE_THRESHOLD = 3;

function categoryTitle(category) {
  return CATEGORY_TITLES_ZH[category] ?? category;
}

function renderChangelogSectionZh(providers, changelog) {
  const week = changelog?.weeks?.[0];
  if (!week) return '';

  const nameFor = (id) => providers.find((provider) => provider.id === id)?.name ?? id;
  const groups = new Map();
  for (const change of week.changes) {
    if (!groups.has(change.type)) groups.set(change.type, []);
    groups.get(change.type).push(change);
  }

  const bullets = [...groups].flatMap(([type, changes]) => {
    const label = CHANGE_LABELS_ZH[type] ?? type;
    if (changes.length > GROUPED_CHANGE_THRESHOLD) {
      const names = changes
        .map(({ provider_id: id }) => escapeMarkdown(nameFor(id)))
        .join('、');
      return [`- **${label}（${changes.length}）：** ${names}`];
    }
    return changes.map((change) => (
      `- **${label} — ${escapeMarkdown(nameFor(change.provider_id))}：** ${escapeMarkdown(change.detail_zh ?? change.detail)}`
    ));
  });

  return `## 本周变化

${week.week_of} 当周。${escapeMarkdown(week.summary_zh ?? week.summary)}

${bullets.join('\n')}

上面每一条都能在下方清单里找到对应的核验日期与官方来源。完整历史见 [\`data/changelog.json\`](data/changelog.json)。

`;
}

function readmeLimitsZh(provider) {
  const values = [
    provider.limits.requests_per_minute === null
      ? null
      : `${provider.limits.requests_per_minute.toLocaleString('en-US')} RPM`,
    provider.limits.requests_per_day === null
      ? null
      : `${provider.limits.requests_per_day.toLocaleString('en-US')} 次/天`,
  ].filter(Boolean);

  return values.join('，') || '动态 / 依模型而定';
}

function readmeModelsZh(provider) {
  return provider.models.slice(0, 3).map(escapeMarkdown).join('<br>');
}

function renderReadmeRowsZh(providers, { includeType = false } = {}) {
  return providers.map((provider) => {
    const source = provider.official_sources[0];
    const detail = zhUrl(`provider/${provider.id}.html`);
    const access = provider.signup_url ? `[申请](${provider.signup_url})` : '已停止新用户注册';
    const type = provider.availability.retires_at
      ? `${categoryTitle(provider.category)}<br>${provider.availability.retires_at} 下线`
      : categoryTitle(provider.category);
    const cells = [
      `[${escapeMarkdown(provider.name)}](${detail})`,
      readmeModelsZh(provider),
      `[${escapeMarkdown(readmeLimitsZh(provider))}](${source.url})`,
      provider.credit_card_required ? '需要' : '不需要',
      provider.openai_compatible ? '是' : '否',
      access,
    ];
    if (includeType) cells.splice(1, 0, type);
    return `| ${cells.join(' | ')} |`;
  }).join('\n');
}

const QUICK_PICK_LABELS_ZH = Object.freeze({
  'highest-daily-limit': '已公布的每日请求上限最高',
  'highest-rpm': '已公布的每分钟请求上限最高',
  'browser-ready': '可使用浏览器 Key 检测',
  'coding-agents': '快速配置编码 Agent',
});

function renderReadmeQuickPicksZh(providers) {
  return quickPicks(providers).map(({ id, provider }) => {
    const reason = id === 'highest-daily-limit'
      ? `已公布 ${provider.limits.requests_per_day.toLocaleString('en-US')} 次/天`
      : id === 'highest-rpm'
        ? `已公布 ${provider.limits.requests_per_minute.toLocaleString('en-US')} RPM`
        : id === 'browser-ready'
          ? '已验证支持浏览器跨域请求'
          : '已有 OpenAI 兼容的编码工具配置';
    const signup = provider.signup_url ? `[申请 API Key](${provider.signup_url})` : '已关闭';
    return `| ${QUICK_PICK_LABELS_ZH[id]} | [${escapeMarkdown(provider.name)}](${zhUrl(`provider/${provider.id}.html`)}) | ${reason} | ${signup} |`;
  }).join('\n');
}

export function renderReadmeZh(providers, changelog) {
  const summary = catalogSummary(providers);
  const groups = accessGroups(providers);
  const browserCheckable = providers.filter(({ browser_check: check }) => check === 'supported').length;
  const badges = renderBadges(
    {
      ci: 'CI',
      license: '许可证 MIT',
      providers: '服务商',
      checked: '来源核验于',
    },
    { home: zhUrl(''), methodology: zhUrl('methodology.html') },
  );
  const stars = starHistory();

  return `# 免费大模型 API 清单

[English](README.md) · 简体中文

${badges}

永久免费的 Provider、无需信用卡的选择、直达官方 API Key 申请入口、模型与已核验限额，都集中在这一份清单里。

> ${summary.permanentFree} 家提供长期免费额度 · ${summary.noCardPermanentFree} 家无需信用卡 · ${summary.openAiCompatiblePermanentFree} 家兼容 OpenAI · 来源核验于 ${summary.latestReview}。本仓库不分发任何 Key。一次探活只描述那一次采样请求，不代表服务商整体可用性。

**[浏览在线目录](${zhUrl('')}) · [按模型选择](${zhUrl('')}#browse) · [配置编码 Agent](docs/clients.md) · [检测自己的 Key](${zhUrl('verify.html')})**

[![可筛选的 LLM 免费额度目录](docs/assets/status-page.png)](${zhUrl('')})

Star 本仓库可以收藏这份数据集并跟进更新。Star 不会改变任何服务商的 Key、额度或限流，本项目也不会因为 Star 给出任何回报。

## 按需求选择免费 API

| 目标 | 推荐 | 入选依据 | 开始使用 |
| --- | --- | --- | --- |
${renderReadmeQuickPicksZh(providers)}

这些推荐完全由公开数据规则生成，不是付费展示。完整比较请打开包含 ${providers.length} 家服务商的[可筛选目录](${zhUrl('')})。

免费不等于跑得起。真正要看的数是免费额度用完之后、替代它的那一档要多少钱。同一维护者整理了[一张表](https://github.com/xyzs996/ai-coding-field-notes/blob/main/figures.md)：引用过的每一个带单位的数字都在里面，**每一行都带着它出处的整句话**，所以一个 \`$1.43\` 不会在「每百万 token」「每月」「每席位」之间含混过去。机器读的话是 [JSON 和 CSV](https://github.com/xyzs996/ai-coding-field-notes/releases/latest/download/figures.json)，读文章的话看这篇：[token 账单到底花在哪](https://xyzs996.github.io/ai-coding-field-notes/articles/token-optimization-for-indie-developers-ai-api-bills.html)。

## 永久免费额度

这里是主清单：均为 Provider 自己长期提供的免费额度，不是会过期的注册赠送额度，并且目前都不要求绑定信用卡。

| 服务商 | 模型 | 官方公布限额 | 信用卡 | OpenAI 兼容 | 获取 API Key |
| --- | --- | --- | --- | --- | --- |
${renderReadmeRowsZh(groups.permanent)}

## 其他访问方式

下面的服务仍可能有用，但它们属于免费模型聚合、注册赠送额度、即将下线的免费档或按量计费，并非长期免费的 Provider Free Tier。

| 服务商 | 访问形式 | 模型 | 官方公布限额 | 信用卡 | OpenAI 兼容 | 获取 API Key |
| --- | --- | --- | --- | --- | --- | --- |
${renderReadmeRowsZh(groups.other, { includeType: true })}

对于动态或依模型而定的限制，本项目不会用猜测数字替代。点击限额即可查看当前官方来源。

## 快速开始

申请你自己的 Groq API Key 后，只需要给 OpenAI SDK 换一个 Base URL 和模型 ID：

\`\`\`python
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
\`\`\`

编码 Agent 可以生成从环境变量读取 Key 的客户端配置：

\`\`\`bash
npx free-llm-api setup claude-code
\`\`\`

客户端指南：[Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [全部客户端](docs/clients.md)。

## 检测你已有的 Key

打开[浏览器 key 检测页](${zhUrl('verify.html')})。不用安装，也不会留存内容：请求从浏览器直达所选服务商。Content Security Policy 只允许连接清单中的 ${connectSrcOrigins(providers).length} 个服务商源，不允许统计服务或本站服务器。${browserCheckable} 家支持跨域浏览器请求；被拦截的服务商会得到等价的 \`curl\` 命令。

## 为什么可以信任这份清单

- 每条限额和生命周期信息都链接官方来源，并记录核验日期。
- 注册赠送额度、按量计费、聚合器和即将下线的免费档与永久免费额度分开展示。
- 本仓库不保存或分发可用凭据；自己的 Key 应放在环境变量中。
- 一次探活不代表整体可用性。\`429\` 只说明这次采样被限流；原因和剩余额度都是未知的。

探活必须在 CI 之外显式运行，Key 只从对应环境变量读取：

\`\`\`bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
\`\`\`

被忽略的 \`data/probe-output.json\` 只包含受限的分类、状态码、延迟和时间戳，绝不包含 Key、响应体或原始异常。详见[核验方法](${zhUrl('methodology.html')})。

${renderChangelogSectionZh(providers, changelog)}## 参与贡献

这个项目最需要的贡献是纠错：某家限额变化、停止注册或链接失效。见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [Issue 模板](${REPO_URL}/issues/new/choose)。

## 数据与本地运行

- \`data/providers.json\` 是经过核验的源数据集。
- \`data/changelog.json\` 记录每周变化。
- \`README.md\`、\`docs/providers.json\` 和静态页面全部确定性生成。
- 写了额度却没有官方来源时，\`npm run validate\` 会失败。

\`\`\`bash
npm run render && npm run serve
\`\`\`

打开 \`http://127.0.0.1:4173\`。需要 Node.js 20+，无运行时依赖，也不需要任何 API Key。

## 安全

本仓库不含任何可用凭据。探活用的 Key 请放在环境变量里，报告中请抹掉 Authorization 头。详见 [SECURITY.md](SECURITY.md)。

## Star 历史

[![Star History Chart](${stars.image})](${stars.link})

## 相关项目

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) 把你自己的多家 Key 收敛到一个本地端点，并做受控故障转移。
- [AI Coding Field Notes](https://github.com/xyzs996/ai-coding-field-notes) 把引用过的每一个带单位的数字都发成了 [JSON 和 CSV](https://cdn.jsdelivr.net/gh/xyzs996/ai-coding-field-notes@main/data/figures.json)，每一行都带着它出处的那句话，后面是对应的长文。

## 需要一个稳定端点？

如果轮换免费 Key 和处理不同限额本身已经成为工作，可以[创建 PekPik API 账号](${HOSTED_CTA_URL})，获得一个 OpenAI 兼容的托管端点。上面的免费目录不依赖它也能正常使用。
`;
}
