# GitHub 增长与 SEO 双引擎改版任务记录

## 基本信息

- 任务名称：GitHub 站内增长为主、Google SEO 为辅的双引擎改版
- 日期：2026-07-26
- 项目/仓库：`/home/azureuser/free-llm-api`
- 负责人：Codex
- 当前状态：已验收
- 当前完成度：100%
- 设计规格：`docs/superpowers/specs/2026-07-26-github-growth-seo-redesign.md`
- 实施计划：`docs/superpowers/plans/2026-07-26-dual-engine-growth-implementation.md`

## 背景

当前项目已经具备 26 个 Provider 的来源追踪、双语静态站、Provider/Model/Client 长尾页、浏览器 Key Checker、结构化数据、canonical、hreflang 与 sitemap，但首页和 README 更接近数据工程说明书，没有把“免费 LLM API”这个高需求主题包装成可以在 GitHub 内快速理解、收藏和传播的产品。

对标仓库 `mnfst/awesome-free-llm-apis` 于 2026-03-21 创建，约一个月达到 3.5K Stars，当前约 6K Stars、574 Forks。公开证据表明其增长主要来自 GitHub Trending、Awesome 生态、社区推荐、Newsletter 与 Provider 投稿形成的 GitHub 原生传播飞轮，而非独立站 Google SEO。其首版 README 只有 55 行，先以“永久免费、无需信用卡、直达 API Key”建立极短价值路径，之后才补充模型表、`data.json` 与自动生成。

本任务将在不复制对方品牌、文案或不可靠数据的前提下，借鉴其经过验证的 GitHub 获客机制，并叠加本项目已有的可信数据与程序化页面优势，形成更完整的双引擎增长产品。

## 目标

### 业务目标

- 以 GitHub 站内发现、Star 转化、Fork、引用和社区投稿为第一增长引擎。
- 以 Google 的高意图关键词、Provider/Model/Client 长尾页为第二增长引擎。
- 中长期目标为公开 Star 数超过对标仓库；该结果受平台分发和外部传播影响，不作为代码验收通过与否的唯一条件。

### 产品目标

- 让首次访问者在 5 秒内理解：这里提供什么、哪些服务真正免费、是否需要信用卡、如何获得自己的 API Key。
- 让用户从 README 或首页最多一次主要点击即可进入 Provider 官方申请入口或项目内详细页面。
- 将“永久免费且无需信用卡”的高价值集合与 Trial、Metered Access、Retiring Tier 清晰分层。
- 提供按用途、限额、模型、兼容性和客户端选择 Provider 的快捷路径。
- 保留并强化官方来源、检查日期、生命周期、双语和安全边界。

### 工程目标

- README、首页、长尾页、sitemap 和结构化数据继续由统一数据确定性生成。
- 新增内容具备双语、移动端、无障碍、SEO 和回归测试覆盖。
- 不引入运行时框架、数据库、Secret 或不必要的第三方脚本。

## 范围

### 包含

- 英文及中文 README 的 GitHub 获客型首屏、快速选择与主清单重构。
- 首页视觉、内容层级、导航、用途入口、热门选择、信任模块与 CTA 重构。
- Provider 列表的信息密度和操作路径优化。
- Provider、Model、Client 和新增对比/场景页面的关键词及内部链接优化。
- GitHub Topics、仓库描述、Awesome 生态与发布传播所需的仓库内材料和最终执行清单。
- 社交分享图、品牌视觉规则、移动端与可访问性优化。
- 数据、渲染、SEO、i18n 和测试的必要扩展。

### 非目标

- 不公开、共享或托管任何可用 API Key。
- 不复制对标仓库的 Logo、插画、文案或完整视觉风格。
- 不伪造 Provider 限额，不以第三方传言替代官方来源。
- 不承诺具体 Google 排名、Star 数或完成时间内必然超过对标仓库。
- 不在本轮引入后端服务、用户系统、数据库或付费投放。
- 不在严格验收和用户确认前执行 Git 提交、推送、部署或远程仓库元数据修改。

## 关键假设

- GitHub 是首要访问场景，README 首屏的理解成本直接影响 Star 和转发转化。
- 用户搜索“free LLM API”时，最关心免费条件、信用卡、模型、限额、兼容性和申请入口。
- Google 不使用 `meta keywords` 作为排名信号；关键词必须体现在可见且有帮助的页面内容、标题、内部链接和结构化数据中。
- 当前 `docs/` 仍作为 GitHub Pages 发布目录，Node.js 20+ 和零运行时依赖约束保持不变。
- 现有 Provider 数据是事实源；展示层可以派生“精选”“无需信用卡”“OpenAI Compatible”等集合，但不重复维护事实。

## 成功指标

### 可在发布前验收的领先指标

- README 与首页首屏同时明确包含 Free LLM API、No Credit Card、Direct API Key Links、Verified/Source-backed 四类价值信息。
- 首页主导航在首屏提供按 Provider、Model、Use Case、Client 浏览的入口。
- 永久免费集合与 Trial/Metered/Retiring 集合在视觉和语义上分离。
- 每个主推 Provider 至少展示申请入口、Base URL、OpenAI 兼容性、信用卡要求、限额摘要、检查日期和官方来源。
- 首页和 README 均包含可直接执行的 Quick Start 或选择路径。
- 所有可索引页面具有唯一 title、description、canonical、hreflang 和可见 H1。
- sitemap、JSON-LD、内部链接和页面可见内容保持一致。

### 发布后观察指标

- GitHub Traffic：repository views、unique visitors、referring sites、Popular content。
- GitHub 转化：Stars、Forks、Watchers、Issues/PRs、Star/unique visitor 比率。
- Google Search Console：impressions、clicks、CTR、average position、indexed pages。
- 重点查询：`free llm api`、`free ai api key`、`free llm api without credit card`、`openai compatible free api` 及 Provider/Model 长尾词。
- 30/60/90 天复盘对标仓库 Star 差距、增长斜率和来源结构。

## 修改方案

### 方案摘要

采用“双引擎增长产品”方案：GitHub README 负责快速传播和收藏，GitHub Pages 负责深度筛选、可信详情和 Google 长尾承接。两端使用同一份 Provider 数据与统一渲染逻辑，避免事实分叉。

### 预计涉及文件与目录

- 任务与设计：`tasks/2026-07-26-GitHub增长与SEO双引擎改版.md`、`docs/superpowers/specs/2026-07-26-github-growth-seo-redesign.md`
- 数据：`data/providers.json`、`data/model-families.json`、必要时新增受校验的展示配置文件
- 渲染：`src/render.js`、`src/readme-zh.js`、`src/pages.js`、`src/page-layout.js`
- SEO：`src/seo.js`、`src/site.js`、`data/site.json`
- 国际化：`src/i18n.js`
- 浏览器行为与样式：`docs/app.js`、`docs/filter.js`、`docs/styles.css`
- 生成产物：`README.md`、`README_zh.md`、`docs/**/*.html`、`docs/sitemap.xml`、社交图资源
- 测试：`test/render.test.js`、`test/seo.test.js`、`test/pages.test.js`、`test/i18n.test.js`、`test/site-assets.test.js` 及新增聚焦测试
- GitHub 社区文件：必要时新增或更新 `.github/` 下的模板和传播材料

### 服务、部署与配置

- 服务：不新增后端服务。
- 部署：仍由 GitHub Pages 托管 `docs/`；本轮不在用户验收前部署。
- 数据库/迁移：不涉及。
- 环境变量/Secret：不新增。
- 依赖：默认不新增；若视觉验收工具确需依赖，必须重新说明并确认。

## 信息架构

### GitHub README

1. 品牌 Hero、价值主张、语言切换与关键 Badge。
2. 三个直接行动：浏览免费 API、按需求选择、检查已有 Key。
3. 快速选择矩阵：最高限额、最快推理、最多模型、无需信用卡、适合编程。
4. 永久免费且无需信用卡的主清单。
5. 其他免费访问方式：聚合器、Trial、Metered、Retiring。
6. 三步 Quick Start 与 OpenAI-compatible 示例。
7. 数据可信度、更新方式和贡献入口。
8. 完整目录、站点、方法论和安全说明。

### 首页

1. 首屏 Hero：明确承诺、主 CTA、次 CTA、可信统计。
2. Pick by Goal：按用户任务快速选择。
3. Best Free Picks：精选 Provider 卡片。
4. Filterable Directory：完整目录与筛选。
5. Browse by Model / Client / Comparison：长尾入口。
6. Why Trust This List：来源、检查日期、生命周期和边界。
7. Quick Start：复制即可运行的最小示例。
8. Contribution / Hosted Access：分别面向社区和稳定商业访问。

### SEO 页面簇

- 首页：`free llm api`、`free ai api key`、`free llm api list`。
- 对比页：`best free llm api`、`free llm api without credit card`、`openai compatible free api`。
- Provider 页：`{provider} free api`、`{provider} api key`、`{provider} rate limits`。
- Model 页：`free {model} api`、`{model} api providers`。
- Client 页：`free llm api for {client}`、`configure {client} openai compatible api`。
- 中文页：免费大模型 API、免费 AI API Key、无需信用卡的大模型 API 等自然中文查询。

## 风险

- 视觉和文案过度借鉴会造成品牌混淆或版权风险。
- 把所有访问类型都称为“永久免费”会降低可信度。
- 为增加信息密度扩展数据字段可能导致校验、生成和翻译范围扩大。
- 大量新增长尾页若内容重复，会形成薄内容或关键词堆砌。
- GitHub Star 和 Google 排名均受外部平台影响，技术实现不能保证结果。
- 当前样式文件位于部署目录，必须明确区分源文件和生成产物，避免渲染覆盖。
- 远程仓库 Topics、Description、Awesome 提交和社区发布属于外部状态变更，只能在严格验收及用户确认后执行。

## 回滚方案

- 所有实现保持在单一功能范围内，最终通过普通反向提交恢复，不使用 `git reset --hard` 或强制推送。
- 数据字段新增保持向后可验证；若展示方案失败，可保留事实字段并移除新模块。
- 新增页面由渲染清单管理，回滚渲染入口后同步移除其生成产物和 sitemap 条目。
- GitHub Pages 仍为静态文件；远程发布失败时不改变现有线上页面。
- 仓库 Topics、Description 等远程元数据在变更前记录旧值，必要时恢复旧值。

## 任务拆解

| 任务 | 状态 | 完成说明 | 验证证据 | 剩余风险 |
| --- | --- | --- | --- | --- |
| 深度分析对标仓库与增长来源 | 已完成 | 已确认 GitHub 原生传播为主、Google 为辅 | 仓库 API、提交历史、Awesome PR、社区推荐 Issue | 无法访问对方私有 Traffic 数据 |
| 固化设计规格和任务文档 | 已完成 | 用户已确认设计规格 | 设计规格与本任务文档 | 外部增长结果仍不可保证 |
| 编写实施计划与测试清单 | 已完成 | 已拆成 10 个可验证任务并完成自审 | `docs/superpowers/plans/2026-07-26-dual-engine-growth-implementation.md` | 执行时需保持单一任务进行中 |
| 建立增长展示策略 | 已完成 | 已建立永久免费分组、核心统计和四类可解释 Quick Picks | `node --test test/growth.test.js` 3/3；`npm test` 159/159 | 当前规则依赖已核验数据，数据变化会由测试提示 |
| README 获客结构重构 | 已完成 | 中英文均按快速选择、永久免费、其他访问方式、Quick Start 和信任层重构 | `npm test` 160/160；`npm run render:check` 95 个产物一致 | Star 转化需发布后观察 |
| 首页视觉与信息架构重构 | 已验收 | 已加入首屏导航、双 CTA、目标入口、数据推荐、目录、Quick Start、信任层和贡献入口；筛选条件可写入 URL | 结构和资源测试通过；360/768/1280 多视口浏览器验收通过 | 转化效果需发布后观察 |
| Provider/Model/Client/Comparison 页面优化 | 已完成 | 新增无需信用卡、OpenAI 兼容、编码 Agent 三组中英对比页，并与现有页面矩阵互链 | 页面矩阵 11/11；内容质量 7/7 | Provider/Model/Client 既有正文未大改，依靠新增对比入口增强发现 |
| SEO、内部链接和结构化数据优化 | 已完成 | 首页定位元数据更新；对比页包含 canonical、hreflang、BreadcrumbList、ItemList、FAQPage 并自动进入 sitemap | SEO 15/15；无断链、孤儿页或 meta keywords | Google 收录与排名需发布后观察 |
| 数据、i18n 和测试扩展 | 已完成 | 中英新增字符串保持键集合一致；推荐、页面与筛选规则均有自动测试 | i18n 11/11；增长策略 3/3 | 后续新增枚举仍需同步两种语言 |
| 严格自动化与浏览器验收 | 已验收 | 完成全量自动化、确定性生成、HTTP、多视口浏览器、键盘、控制台和关键外链检查 | 166/166 测试通过；101 个产物一致；10/10 HTTP 路径为 200；360/768/1280 视口无横向溢出 | 外部站点的 403/307 属于反爬或跳转，未据此判定链接失效 |
| 用户确认验收结果 | 已验收 | 用户于 2026-07-26 明确回复“没问题” | 对话验收记录 | 无 |
| 更新最终文档 | 已验收 | 已记录实现、验收、部署、配置、回滚、Git 与线上发布结果 | 本任务文档及实施计划 | 无 |
| Git 提交、推送与远程元数据更新 | 已验收 | 实现提交已推送至 `origin/main`；Description、Homepage、Topics 已更新；CI 和 Pages 均成功 | commit `19cf6f8`；CI run `30195164708`；Pages run `30195164347` | 平台流量增长需发布后持续观察 |

## 严格验收条件

### 内容与增长

- 首屏价值主张清晰，不使用需要用户解释的内部术语作为主卖点。
- 主清单只把满足条件的项目标为永久免费；Trial、Metered、Retiring 清晰分区。
- 所有 Direct API Key/Signup 链接来自数据源，不手写重复事实。
- Quick Pick 推荐可以由数据规则解释，不出现无来源的“最快”“最佳”等绝对声明。
- README 在 GitHub 渲染下目录、表格、图片、锚点和双语链接有效。

### 页面与视觉

- 360px、768px、1280px 三类视口无横向溢出、重叠、截断或不可点击控件。
- 键盘可以访问导航、筛选器、CTA 和主要内容；焦点样式可见。
- 配色满足正文和关键控件的 WCAG AA 对比度目标。
- 无 JavaScript 时仍可浏览核心目录和链接。

### SEO

- 每个索引页只有一个可见 H1，并具有唯一 title 和 description。
- canonical、hreflang、OG、Twitter Card、JSON-LD 和 sitemap URL 一致。
- JSON-LD 声明与页面可见内容一致，不制造不可见关键词。
- 页面间存在可抓取的 `<a href>` 内部链接，不依赖 JavaScript 导航。
- `robots.txt` 和 sitemap 可访问且不阻止目标页面。
- 不新增无效的 `meta keywords`。

### 工程与安全

- `npm test` 全部通过，无跳过的相关测试。
- `npm run validate`、`npm run check`、`npm run render:check` 全部退出码为 0。
- 执行 `npm run render` 后再次运行 `npm run render:check` 仍通过，证明生成确定性。
- 本地静态服务返回首页、中文首页、代表性 Provider/Model/Client/Comparison 页和 sitemap HTTP 200。
- 内部链接检查无断链；外部关键申请链接记录网络验证结果。
- 仓库扫描不包含 API Key、Token、Cookie、私钥或认证文件。
- Key Checker 页面继续排除第三方分析脚本并维持 CSP 安全承诺。

## 验收记录

### 自动化与生成验收

- `npm test`：166 个测试全部通过，0 失败、0 跳过、0 待办。
- `npm run validate`：26 个 Provider、1 个 changelog week、7 个模型家族通过校验；25/26 个 Provider 具备独立落地页，符合既有详情门槛。
- `npm run check`：仓库完整性、内部链接和安全检查通过。
- `npm run render`：成功生成中英文 README、首页、详情页、比较页、sitemap 等产物。
- `npm run render:check`：101 个生成产物与源数据、渲染逻辑完全一致。
- `git diff --check`：通过，无空白错误。

### HTTP 与浏览器验收

- 本地服务：`npm run serve`，监听 `127.0.0.1:4173`；验收后已停止，无常驻进程。
- 代表性路径 `/`、`/zh/`、`/provider/groq.html`、`/model/llama.html`、`/client/claude-code.html`、`/compare/no-credit-card.html`、`/zh/compare/no-credit-card.html`、`/verify.html`、`/sitemap.xml`、`/robots.txt` 共 10/10 返回 HTTP 200 且内容类型正确。
- 英文首页、中文首页、Provider 页和中英文比较页在 360×800、768×1024、1280×800 视口均无横向溢出、CTA 重叠或内容截断。
- 查询参数筛选可恢复并保留 URL；中英文切换正常；键盘焦点为 3px 可见轮廓；浏览器控制台无错误。
- 初次验收发现中文区块标题、Quick Start 网格及 Provider 页移动端溢出，均已修复并增加回归测试。

### 外部链接与跳过项

- 25 个 Provider 注册地址完成网络检查：22 个最终返回 HTTP 200；Mistral 返回 307 跳转；Cloudflare 与 Perplexity 因登录/反爬保护返回 403；无超时。
- 未重新设计 `docs/assets/social-preview.png`，原因是本轮没有可复现的品牌图生成链路；保留现有有效的 1280×640 社交分享图。
- 未跳过任何自动化测试。Google 收录、搜索排名、GitHub Trending 和 Star 增长属于发布后外部指标，不伪装成本地验收结果。

## 最终实施记录

### 完成内容

- 新增 `src/growth.js`，从 Provider 事实数据确定性派生永久免费分组、统计和四类可解释 Quick Picks。
- 重构中英文 README 首屏、快速选择、永久免费与其他访问方式分层、Quick Start、信任层和贡献入口。
- 重构中英文首页视觉系统、主导航、Hero、目标入口、精选卡片、筛选目录、Quick Start、信任与贡献 CTA。
- 在 `docs/app.js` 中实现可分享、可恢复且枚举受校验的筛选查询参数。
- 新增无需信用卡、OpenAI Compatible、Coding Agents 三组中英文比较页，并接入 canonical、hreflang、BreadcrumbList、ItemList、FAQPage 和 sitemap。
- 修复本地服务 `/zh/` 目录路由、移动端布局和遗留未使用渲染函数，并增加对应回归测试。

### 部署与服务信息

- 生产托管：GitHub Pages，公开站点 `https://xyzs996.github.io/free-llm-api/`。
- 发布源：`main` 分支的 `/docs` 目录，Pages 类型为 `legacy`，HTTPS 强制开启。
- 项目目录：`/home/azureuser/free-llm-api`。
- 本地运行：`npm run serve`，默认 `http://127.0.0.1:4173/`。
- 生成命令：`npm run render`；发布前校验：`npm test && npm run validate && npm run check && npm run render:check`。
- 不新增后端服务、进程管理器、定时任务或服务重启步骤；推送到 `main` 后由 GitHub Pages 自动构建。

### 配置、依赖与数据变更

- 环境变量/Secret：无新增、无修改。
- 数据库/迁移：不涉及。
- 项目运行时依赖：未新增，仍为 Node.js 20+ 和零运行时依赖。
- Provider 事实数据：本轮未修改 `data/providers.json`；新增展示均从既有数据派生。
- 本地验收工具：用户授权后安装 Bun、GStack 浏览器工具和 Playwright Chromium 缓存，仅存在于用户工具目录，不进入项目依赖或仓库。
- 远程元数据：Homepage 已设置为 `https://xyzs996.github.io/free-llm-api/`；Description 已更新为强调 verified、no-card、direct API key links、rate limits、OpenAI-compatible 和 coding-agent guides；Topics 在原有集合上新增 `ai-api`、`free-llm-api`、`gemini-api`、`github-pages`、`groq-api`。

### 回滚方式

- 代码与静态站：对本次发布提交执行普通 `git revert <commit>` 后推送；禁止使用强制推送或 `git reset --hard`。
- 远程 Description、Homepage、Topics：已在修改前记录原值，可通过 `gh repo edit` 恢复。
- Pages：回滚提交进入 `main` 后自动重新发布 `/docs`；无数据库或缓存需要恢复。

### Git 交接信息

- 分支：`main`。
- 远程：`origin` → `https://github.com/xyzs996/free-llm-api.git`。
- 公共仓库：`https://github.com/xyzs996/free-llm-api`。
- 发布前基线：`30edd203dea2dea5a5c2053b26404965e26bf15a`，本地、`origin/main` 与远程 HEAD 一致。
- 实现提交：`19cf6f888b1d219d7ae290e26e8e8d9f31b07344`，提交说明 `feat: 完成 GitHub 增长与 SEO 双引擎改版`。
- 推送结果：`main -> origin/main` 成功，未使用 force push。
- GitHub CI：run `30195164708`，结论 `success`，对应 head 为 `19cf6f8`。
- GitHub Pages：run `30195164347`，结论 `success`，对应 head 为 `19cf6f8`。
- 线上验证：公开首页、中文首页、中英文无需信用卡比较页、Groq Provider 页及 sitemap 共 6/6 返回 HTTP 200；线上正文已包含新版 Hero，比较页已包含 `FAQPage` 结构化数据。
- 发布记录：本文件通过紧随实现提交的 `docs: 记录双引擎改版发布结果` 文档提交发布，具体 hash 以仓库 Git 历史为准。

## 用户确认

- 2026-07-26：用户确认“按双引擎增长方案实施”，并将优先级明确为 GitHub 站内流量为主、Google SEO 为辅，目标是超过对标仓库。
- 2026-07-26：用户确认书面设计规格并授权进入实施。
- 2026-07-26：严格验收结果已汇报，用户明确回复“没问题”，授权更新最终文档并进行 Git 提交、推送与已确认的远程元数据收尾。
