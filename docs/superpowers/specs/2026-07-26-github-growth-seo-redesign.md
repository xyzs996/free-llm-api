# Free LLM API 双引擎增长改版设计规格

## 文档状态

- 状态：待用户审阅
- 日期：2026-07-26
- 目标优先级：GitHub 站内增长第一，Google SEO 第二
- 对标对象：`mnfst/awesome-free-llm-apis`
- 关联任务：`tasks/2026-07-26-GitHub增长与SEO双引擎改版.md`

## 1. 决策摘要

本次不把现有项目改造成对标仓库的复制品，而是构建两个共享同一事实数据源的增长入口：

1. GitHub README 是传播、收藏、Star 和贡献转化入口。
2. GitHub Pages 是筛选、比较、可信详情、工具使用和 Google 长尾承接入口。

产品主承诺调整为：帮助开发者找到真正可申请的免费 LLM API，直接查看是否需要信用卡、支持哪些模型、公开限额是多少，并进入 Provider 官方 API Key 页面。

“来源可追踪”继续作为信任证据，但不再作为首屏需要理解的第一卖点。“Probe 语义”“方法论”“Hosted Access”等内容下沉到用户已经理解核心价值之后。

## 2. 对标仓库增长机制

### 2.1 公开证据

- 仓库创建于 2026-03-21。
- 初始 README 仅 55 行、13 个链接，没有独立站。
- 创建当天完成 Awesome 规范化和品牌 Logo。
- 第二天加入 Agent Skill，把静态清单变成可调用的选择与配置工具。
- 第四天已被社区日报、AI 项目推荐站和 Newsletter 收录。
- 2026-04-17 才加入详细模型表、`data.json`、生成脚本和 GitHub Action。
- 2026-04-22 在 Awesome 总目录申请中披露已有 3.5K Stars。
- 2026-05-04 约 4K，2026-06-03 约 4.7K，当前约 6K。
- 没有 GitHub Pages、独立域名、sitemap 或程序化 SEO 页面。

### 2.2 增长模型

其主要增长不是技术复杂度，而是以下组合：

- 选题：`free`、`LLM`、`API`、`API key` 是高需求且天然可收藏的交叉主题。
- 命名：仓库名、描述、Topics 和 README 标题完全贴合用户词汇。
- 首屏：永久免费、无需信用卡、OpenAI compatible、直达 API Key。
- 信息架构：Provider API 与 Inference Provider 两类，认知成本低。
- 行动力：Base URL、模型、上下文、输出、模态和限额在一个视图内。
- GitHub 原生分发：Awesome Badge、Topics、CC0、Logo、总目录申请、社区推荐。
- 投稿飞轮：Provider 和用户有动力补充清单，PR 又制造新的动态和传播。
- 维护系统：在获得初始关注后，再以结构化数据和生成脚本维持规模。

### 2.3 不应照搬的部分

- 没有独立站和长尾页面，无法充分承接 Google 搜索。
- 多项限额没有逐项来源日期，存在过时风险。
- README 生成与贡献指南一度不一致。
- “永久免费”边界并非所有条目都完全稳定。
- 缺少生命周期、地区、浏览器兼容和安全验证细节。
- 以大表承载所有信息，移动端和深度比较体验有限。

## 3. 目标用户与任务

### 3.1 初学开发者

任务：不绑定信用卡，尽快获得一个可以运行示例的 API Key。

需要看到：申请入口、模型、最小示例、免费限制、是否 OpenAI compatible。

### 3.2 AI 工具与 Coding Agent 用户

任务：为 Claude Code、Codex、Cline 等工具配置一个低成本 Provider。

需要看到：Base URL、Model ID、环境变量、客户端指南、429 和兼容性说明。

### 3.3 有明确模型偏好的开发者

任务：寻找 Gemini、Llama、DeepSeek、Qwen、GLM 等模型的免费 API。

需要看到：哪些 Provider 提供该模型、免费条件、上下文和限额比较。

### 3.4 Provider 与贡献者

任务：提交新 Provider、纠正限额或让自己的服务进入可信清单。

需要看到：清晰准入规则、来源要求、数据格式、验证和贡献入口。

## 4. 核心定位与文案层级

### 4.1 英文主定位

建议标题方向：

> Free LLM APIs — verified limits, direct API key links, no guesswork.

建议辅助说明：

> Compare permanent free tiers, no-card options, OpenAI-compatible endpoints, models and rate limits. Every claim links to an official source.

### 4.2 中文主定位

建议标题方向：

> 免费大模型 API 清单——直接申请 Key，比较模型与限额。

建议辅助说明：

> 筛选永久免费的 API、无需信用卡的 Provider 和 OpenAI 兼容接口；每项限制都附官方来源。

### 4.3 文案原则

- 先说用户能得到什么，再解释我们如何验证。
- 使用 Provider、Model、API Key、Rate Limit 等用户已知词汇。
- 不将所有访问方式统称为 Free Tier。
- 不使用没有数据依据的“最快”“最强”“最佳”；Quick Picks 使用可解释规则。
- 允许有品牌态度，但避免用内部争论式文案作为主标题。

## 5. GitHub README 设计

### 5.1 首屏

- 品牌横幅或高质量社交视觉，使用本项目独立品牌语言。
- H1 或图片 Alt 明确包含 Free LLM APIs。
- 一句话承诺同时覆盖 direct API key links、no-card options、verified limits。
- 保留 CI、License、Providers、Sources Checked 等高信号 Badge，减少低价值 Badge。
- 主要链接：Browse the list、Pick by goal、Check a key、中文。

### 5.2 Quick Picks

以紧凑表格展示：

- Highest published request limit
- Largest documented model selection
- OpenAI-compatible and no card
- Best documented coding setup
- Browser-checkable
- No-signup option（仅当事实数据支持）

每一项必须由数据字段或明确规则派生，并链接到详情页，避免硬编码营销判断。

### 5.3 主清单分层

第一层：Permanent Free / Provider Free Tier，并突出 No Credit Card。

第二层：Free Model Aggregator。

第三层：Trial Credit、Metered Access、Retiring Tier，明确它们为何不属于永久免费主清单。

建议主表字段：

- Provider
- Free access
- Models / notable families
- Published limit
- Card
- OpenAI compatible
- Get API key

详细 Base URL、所有 Model ID、来源和客户端配置放在站点详情页，避免 README 重新变成说明书。

### 5.4 Quick Start

- 提供一个 OpenAI SDK 示例。
- 使用占位符，不包含真实 Key。
- 链接到 Provider 详情页和 Client 页面。
- 明确把 Secret 放入环境变量。

### 5.5 信任与贡献

- 用三条简短规则说明：官方来源、检查日期、不分发 Key。
- Changed this week 下沉，不占据首个价值区块。
- 强化“发现错误即可贡献”的低门槛路径。

## 6. 首页信息架构

### 6.1 Header

- 品牌名称。
- Browse、Models、Use Cases、Clients、Verify、Methodology。
- 中英文切换。
- GitHub/Star 入口。
- 移动端使用可访问的折叠菜单或精简导航。

### 6.2 Hero

- Eyebrow：Updated / verified date。
- H1：Free LLM APIs with direct API key links。
- Supporting copy：免费条件、信用卡、模型、限额、来源。
- Primary CTA：Browse free APIs。
- Secondary CTA：Pick by goal。
- Tertiary link：Already have a key? Verify it。
- Stats：Permanent free count、No-card count、OpenAI-compatible count、last reviewed date。

### 6.3 Pick by Goal

六个可点击入口：

- No credit card
- OpenAI-compatible
- Highest documented limits
- Coding agents
- Multimodal models
- Browser-checkable

入口必须落到带可分享 URL 的筛选结果或静态场景页，不能只改变本地不可索引状态。

### 6.4 Best Free Picks

- 展示 4–6 个满足明确规则的 Provider 卡片。
- 卡片包含 Name、类型、信用卡、兼容性、限额摘要、模型族、检查日期。
- CTA 分为 View details 与 Get API key。
- 推荐标签使用规则名称，不使用主观“Best overall”。

### 6.5 Full Directory

- 保留现有筛选表格，但将核心筛选顺序调整为 Query、Free type、No card、OpenAI compatible、Model/Use case。
- 移除对首次用户价值较低的 Probe 筛选，或下沉到 Advanced filters。
- 表格首列和 CTA 更突出，移动端转为可读卡片。
- 支持 URL 查询参数，便于分享和返回。

### 6.6 Browse and Compare

- Model families。
- Coding clients。
- Comparison/use-case pages。
- Data and methodology。

每个分组显示描述和代表性页面，不只是一组无上下文链接。

### 6.7 Trust Layer

将“Sample facts, not status theater”重构为更直接的信任说明：

- Official sources next to every claim。
- Source review date。
- Lifecycle and retirement notices。
- Sample probe does not equal uptime。

### 6.8 Quick Start 与最终 CTA

- 页面底部提供最小 OpenAI SDK 示例。
- 社区 CTA：Star / Contribute a correction。
- 商业 CTA：需要统一稳定入口时再展示 Hosted Access，避免与免费主承诺抢首屏注意力。

## 7. 视觉系统

### 7.1 设计方向

选择“开发者工具 + 数据可信度”方向，而非复制对标仓库的 Awesome 插画：

- 深色或中性高对比 Hero，正文保持舒适阅读背景。
- 使用网格、终端片段、数据标签和克制的高亮色表达技术感。
- Provider 卡片和表格使用一致的状态标签。
- 通过留白、字号和层级制造专业感，不依赖大量装饰。

### 7.2 组件

- Site header / mobile nav
- Hero and stat chips
- Goal cards
- Provider pick cards
- Filter toolbar
- Responsive provider table/cards
- Trust strip
- Code example
- Contribution and hosted CTA
- Footer link groups

### 7.3 品牌资源

- 更新 README 横幅或 Logo Lockup。
- 更新 `social-preview.png`，确保 1280×640 分享预览可读。
- 中英文共享图形品牌，不在图片中塞入难以本地化的大段文字。

## 8. SEO 策略

### 8.1 原则

- Google 流量是第二引擎，不牺牲 GitHub 首屏转化来堆关键词。
- 关键词体现在用户可见的有用内容中，不添加 `meta keywords`。
- 每个页面服务一种主要搜索意图，避免页面互相竞争。
- 程序化页面必须有真实差异化数据和内部链接，避免薄内容。

### 8.2 页面关键词映射

| 页面 | 主搜索意图 | 示例关键词 |
| --- | --- | --- |
| 首页 | 找免费 LLM API 清单 | free llm api, free ai api key |
| No-card 对比页 | 不绑卡获取 API | free llm api without credit card |
| OpenAI-compatible 对比页 | 替代 OpenAI Endpoint | openai compatible free api |
| Provider 页 | 获取某 Provider Key 和限制 | groq free api, groq rate limits |
| Model 页 | 找某模型的免费入口 | free llama api, free deepseek api |
| Client 页 | 给工具配置免费接口 | free llm api for claude code |

### 8.3 On-page SEO

- 唯一 title、meta description 和 H1。
- 开头可见段落自然覆盖主要意图。
- 面包屑和相关 Provider/Model/Client 链接。
- FAQ 仅在页面确实展示对应问答时输出 FAQPage JSON-LD。
- Dataset/WebSite/BreadcrumbList 等结构化数据与可见内容一致。
- Canonical、hreflang、OG、Twitter Card 和 sitemap 使用同一 URL 生成函数。

### 8.4 技术 SEO

- 保持纯静态 HTML 可抓取。
- URL 稳定、描述性强、避免 query-only 内容成为唯一入口。
- sitemap 包含所有目标索引页并排除工具状态页中的非规范变体。
- `robots.txt` 指向 sitemap。
- 重要内部链接使用标准 `<a href>`。
- 页面体积、渲染阻塞和图片尺寸纳入验收。

## 9. GitHub 站内增长策略

### 9.1 Repository surface

- 仓库描述直接覆盖 Free LLM API、API Keys、No Credit Card、Verified Limits。
- Topics 聚焦 `free-llm-api`、`free-ai-api`、`llm-api`、`api-key`、`openai-compatible`、`awesome-list` 等真实主题。
- README 首屏避免冗长免责声明和内部实现细节。
- 社交图片在 GitHub、X、Reddit、Discord 等预览中可读。

### 9.2 GitHub discovery

- 评估遵循 Awesome List 规范，但不为入选而牺牲我们的生成架构和产品站。
- 准备可单独审阅的列表入口或 Awesome-compatible 视图。
- 发布稳定 Release 和 changelog，让 Watchers 获得更新信号。
- 使用 Issues/PR 模板降低 Provider 提交和纠错成本。

### 9.3 贡献飞轮

- 首页和 README 明确“Submit a provider / Correct a limit”。
- 每条数据要求官方来源，防止清单规模增长导致可信度下降。
- 对 Provider 投稿给出结构化模板，减少维护者来回沟通。
- Changed this week 形成持续更新信号，但不抢主清单位置。

### 9.4 发布传播

远程发布阶段另行执行并记录：

- GitHub Release。
- Awesome 生态申请或更新。
- GitHub Topics 与 Description。
- 社区目录、Newsletter、Reddit/Hacker News/开发者社区发布清单。

这些属于外部状态变更，必须在代码严格验收、用户确认后进行。

## 10. 数据与渲染设计

### 10.1 单一事实源

- Provider 的免费类型、信用卡、模型、限额、Base URL、来源和检查日期继续来自 `data/providers.json`。
- Quick Picks 和场景集合优先通过纯函数派生。
- 若需要人工策展，只新增最小、可校验、含理由的展示配置，不能复制事实字段。

### 10.2 生成架构

- `src/render.js` 负责 README 与首页组合。
- `src/pages.js` 负责 Provider/Model/Client/Comparison 页面正文。
- `src/seo.js` 负责 head、JSON-LD、sitemap 和 robots。
- `src/i18n.js` 覆盖所有新增标签和可见文案。
- 所有生成产物由 `npm run render` 写入，并由 `render:check` 验证。

### 10.3 URL 与筛选状态

- 静态场景页承接核心可索引意图。
- 首页筛选器可以使用 query parameters 恢复状态和分享，但 canonical 指向规范页面。
- 不为每种筛选组合生成无限页面。

## 11. 测试策略

### 11.1 测试优先顺序

1. 先为首屏结构、分类边界、Quick Picks 派生和 SEO 唯一性编写失败测试。
2. 实现最小生成逻辑使测试通过。
3. 补充样式和交互。
4. 执行全量生成、静态检查和多视口浏览器验收。

### 11.2 自动化检查

- README 关键区块顺序、链接和双语对等。
- 主清单不混入错误类别。
- Quick Picks 只使用满足规则的 Provider。
- 新页面 title/description/H1 唯一。
- canonical/hreflang/sitemap 对齐。
- JSON-LD 可解析且与页面可见内容匹配。
- i18n 双语键完整。
- 筛选状态、无 JS 回退和移动表格结构。
- 生成确定性和顶层产物白名单。

### 11.3 浏览器验收

- 360×800、768×1024、1280×800。
- 首页、中文首页、代表性 Provider、Model、Client、Comparison、Verify。
- 键盘导航、焦点、筛选、链接、语言切换。
- Console error、网络失败、布局溢出、图片加载和基础性能。

## 12. 实施顺序

1. 建立任务文档与设计规格。
2. 用户审阅设计规格。
3. 编写逐文件实施计划和测试矩阵。
4. 先写失败测试，锁定增长与 SEO 契约。
5. 重构 README 生成和双语文案。
6. 重构首页结构、组件和样式。
7. 新增/优化场景页与内部链接。
8. 更新 SEO、sitemap 和结构化数据。
9. 生成全部产物并执行严格验收。
10. 报告完成度、测试、跳过项和风险，等待用户确认。
11. 更新最终文档，检查 Git 状态，仅提交本次改动并推送。
12. 经授权更新远程仓库元数据和发布材料。

## 13. 验收与发布闸门

- 设计规格未确认：不修改产品代码。
- 自动化测试未通过：不进入浏览器验收。
- 浏览器验收存在关键缺陷：不请求用户最终确认。
- 用户未确认严格验收结果：不更新最终发布记录、不提交、不推送。
- 工作区存在无法隔离的无关改动：停止 Git 收尾并报告。
- Remote、权限或分支异常：停止推送并报告。

## 14. 自审结论

- 规格将 GitHub 获客置于第一优先级，同时保留 Google 长尾优势。
- 规格借鉴对标项目的机制而非复制其资产，版权和品牌边界清晰。
- 规格保留项目现有安全、来源、生命周期和双语优势。
- 最大不确定性是外部平台分发，因此将 Star 超越目标与工程验收条件分开。
- 实施前仍需把本规格拆为逐文件、逐测试的小步计划。
