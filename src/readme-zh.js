import { HOSTED_CTA_URL } from './client-pages.js';
import { escapeMarkdown } from './markdown.js';
import { SITE_URL, connectSrcOrigins } from './verify-page.js';

const GROUPED_CHANGE_THRESHOLD = 3;

export const CATEGORY_TITLES_ZH = Object.freeze({
  'provider-free-tier': '厂商免费额度',
  'free-model-aggregator': '免费模型聚合',
  'trial-credit': '注册赠送额度',
  'metered-access': '按量计费',
  'retiring-free-tier': '即将下线的免费额度',
});

export const AVAILABILITY_STATUS_ZH = Object.freeze({
  active: '正常开放',
  retiring: '即将下线',
});

export const CHANGE_LABELS_ZH = Object.freeze({
  added: '新增',
  'limit-changed': '限额变化',
  lifecycle: '生命周期',
  correction: '更正',
  removed: '移除',
});

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

export function renderReadmeZh(providers, changelog) {
  const browserCheckable = providers.filter(({ browser_check: check }) => check === 'supported').length;
  const latestSourceCheck = providers
    .map(({ source_checked_at: checkedAt }) => checkedAt)
    .sort()
    .at(-1);

  const rows = providers.map((provider) => {
    const primarySource = provider.official_sources[0];
    const access = provider.signup_url ? `[注册](${provider.signup_url})` : '已停止新用户注册';
    const limits = provider.limits.requests_per_day === null
      ? '动态 / 依模型而定'
      : `${provider.limits.requests_per_minute} RPM，${provider.limits.requests_per_day} 次/天`;
    const lifecycle = provider.availability.retires_at
      ? `${provider.availability.retires_at} 下线`
      : AVAILABILITY_STATUS_ZH[provider.availability.status] ?? provider.availability.status;

    return `| [${escapeMarkdown(provider.name)}](${primarySource.url}) | ${escapeMarkdown(categoryTitle(provider.category))} | ${provider.credit_card_required ? '是' : '否'} | ${provider.openai_compatible ? '是' : '否'} | ${escapeMarkdown(limits)} | ${escapeMarkdown(lifecycle)} | ${access} |`;
  }).join('\n');

  return `# 免费 LLM API 清单

[English](README.md) · 简体中文

一份有官方来源可查的免费 LLM API 与免费额度清单，附可解释的采样探活、可筛选的状态页，以及面向编码 agent 的一条命令配置。

> 来源核验日期：${latestSourceCheck}。一次探活只描述那一次采样请求，不代表服务商整体可用性。

${renderChangelogSectionZh(providers, changelog)}## 验证你手上已有的 key

打开[浏览器 key 检测页](${SITE_URL}verify.html)。不用安装、不留存任何内容：请求从你的浏览器直连服务商，因为该页面的 Content Security Policy 只允许连接本清单里的 ${connectSrcOrigins(providers).length} 个服务商源，除此之外一处都不允许——既没有统计服务，也没有本站自己。

${providers.length} 家里有 ${browserCheckable} 家会响应跨域浏览器请求，其余 ${providers.length - browserCheckable} 家会拒绝；对这些服务商，页面直接给出等价的 \`curl\` 命令，而不是猜一个结论。

## 本地运行

\`\`\`bash
npm run render && npm run serve
\`\`\`

打开 \`http://127.0.0.1:4173\`。需要 Node.js 20+，无运行时依赖，也不需要任何 API key。

把编码 agent 指向你已经拿到访问权限的任意端点：

\`\`\`bash
npx free-llm-api setup claude-code
\`\`\`

客户端指南：[Claude Code](docs/claude-code.md) · [Codex CLI](docs/codex.md) · [Cline](docs/cline.md) · [全部客户端](docs/clients.md)。

在八家服务商之间轮换 key、每天都撞 429？一个 OpenAI 兼容端点即可覆盖全部模型。[创建 PekPik API 账号](${HOSTED_CTA_URL})。

Star 本仓库可以收藏这份数据集并跟进更新。Star 不会改变任何服务商的 key、额度或限流，本项目也不会因为 Star 给出任何回报。

![可筛选的 LLM 免费额度状态页](docs/assets/status-page.png)

## 服务商清单

| 服务商 | 免费形式 | 需信用卡 | OpenAI 兼容 | 官方公布限额 | 状态 | 注册 |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

标注为动态或依模型而定的限额，不会用猜测的数字替代。请点开对应链接查看服务商当前的官方额度。

## 探活语义

- \`200\`：这次采样请求成功。
- \`401/403\`：只说明采样用的凭据被拒绝。
- \`429\`：只说明这次采样被限流；原因和剩余额度都是未知的。
- \`5xx\` 或网络错误：采样端点这次连不通，不能据此断定服务商整体故障。

探活必须在 CI 之外显式运行。key 只从对应服务商的环境变量读取：

\`\`\`bash
GROQ_API_KEY=YOUR_API_KEY npm run probe -- --provider groq
\`\`\`

默认且唯一支持的输出是被 gitignore 的 \`data/probe-output.json\`，其中只有分类、状态码、延迟和时间戳，绝不包含 key、响应体或原始异常。CI 只校验静态数据，从不执行带凭据的探活。

## 数据

- \`data/providers.json\` 是经过核验的源数据集。
- \`data/changelog.json\` 记录每周变化，最新一周渲染在上方。
- \`docs/providers.json\`、\`docs/index.html\` 以及本文件由 \`npm run render\` 确定性生成，请勿手改产物。
- 每条记录都带官方来源与 \`source_checked_at\` 日期；写了额度却没有来源时 \`npm run validate\` 会失败。

## 安全

本仓库不含任何可用凭据。探活用的 key 请放在环境变量里，报告中请抹掉 Authorization 头。详见 [SECURITY.md](SECURITY.md)。

## 相关项目

- [Free Tier LLM Router](https://github.com/xyzs996/free-tier-llm-router) 把你自己的多家 key 收敛到一个本地端点，并做受控故障转移。
`;
}
