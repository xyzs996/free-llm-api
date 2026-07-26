# Contributing

The catalog is only worth reading while it is correct, and it goes stale the
moment a provider edits a docs page. Corrections are therefore the contribution
this project runs on. English or 简体中文 are both fine in issues and pull
requests — 中文说明见文末。

## What belongs here

- **An official free tier.** A provider that documents, on its own site, what
  you can call without paying. Trial credit that expires counts; it is labelled
  as trial credit rather than as a free tier.
- **A correction with a source.** A limit that moved, a signup that closed, a
  model that was withdrawn, a link that died.
- **Nothing that is a credential.** No API keys, no tokens, no shared accounts,
  no "working key" in an issue. This repository distributes none, and a pull
  request that adds one is closed rather than edited.
- **Nothing reverse-engineered.** Endpoints extracted from a consumer app, keys
  scraped from someone else's page, and unofficial proxies are out of scope
  regardless of whether they currently work.

## Correcting a fact

1. Find the entry in [`data/providers.json`](data/providers.json). Nothing in
   `README.md`, `docs/`, or `examples/` is edited by hand — those files are
   generated, and a change there is overwritten by the next render.
2. Change the value, and change `source_checked_at` to the date **you** read the
   official page. That field is a claim about your own reading, not a copy of
   the previous editor's.
3. Make sure `official_sources` contains the page the number comes from. If the
   number moved to a different page, replace the link too.
4. Add a line to [`data/changelog.json`](data/changelog.json) under the newest
   week. Set `provider_id` to the affected provider; `type` is one of `added`,
   `limit-changed`, `lifecycle`, `correction`, or `removed`; and `detail` says
   what changed in one sentence. `detail_zh` is optional.
5. Run the checks below and commit the regenerated files together with the data
   change, in one commit.

## Adding a provider

Copy the shape of an existing entry. The fields that decide how a provider is
presented:

| Field | What it means |
| --- | --- |
| `category` | One of `provider-free-tier`, `trial-credit`, `free-model-aggregator`, `retiring-free-tier`, `metered-access`. This is what the catalog filters on, so it has to match what the provider actually offers. |
| `credit_card_required` | `true` when a verified payment method is a precondition for API access, even if the tier itself is free. |
| `openai_compatible` | `true` only when the provider documents an OpenAI-compatible endpoint; a wrapper someone else maintains does not count. |
| `browser_check` | `supported` when the CORS preflight lets a browser send an `Authorization` header, `blocked` when it refuses the origin, and `unverified` when the result is inconclusive. Record the observed reason in `browser_check_note`, the review date in `browser_checked_at`, and use `npm run cors:check` to measure it. |
| `limits.status` | A short slug for *how* the provider publishes its limits — `documented-per-model`, `documented-per-tier`, `dynamic-no-fixed-numbers`, and so on. A provider that publishes no fixed number keeps `null` in `requests_per_minute` and `requests_per_day`; a guessed number is worse than an honest gap. |
| `limits.summary` | The provider's own wording, condensed. This sentence appears on the provider page and nowhere else, so it should say what is specific to this provider rather than what is true of every free tier. |
| `availability` | `status`, whether new signups are open, a retirement date when one is announced, and a `note` that explains the state. |
| `models` | Use model ids exactly as the API accepts them when naming a specific model. A documented dynamic set or catalog-wide range can be described in plain text; generated examples and client configs only select values that match the model-id pattern in `src/snippets.js`. |
| `probe` | Leave `classification` as `not-checked`, keep the seven measurement fields `null`, and explain that no authenticated probe has been published. Probe results come from an explicit maintainer run, never from CI. |

Chinese copy is optional and lives beside the English field: `summary_zh`,
`note_zh`, `detail_zh`. An entry without one falls back to English rather than
to an empty page, so a partial translation is a normal state and not a bug.

Short values the site prints as a label — a category, an availability state, a
`limits.status` — are different: they are looked up in `src/i18n.js`, and a new
one needs a line in **both** string tables. A missing label fails the build
instead of printing the raw slug at a reader, which is what `npm test` is
checking when it complains that `zh` has no label for something.

A provider needs enough documented detail to fill a page of its own. One that
does not stays a catalog row instead — that gate is in `src/validate.js`, not in
anyone's judgement on the day.

## Checks

```bash
npm run validate      # data rules: sources present, dates real, numbers sourced
npm test              # the full suite, including the anti-doorway measurements
npm run render        # regenerate README.md, README_zh.md, docs/, examples/
npm run render:check  # fails if a generated file no longer matches data/
npm run check         # required files present, no credential-shaped strings
```

After a data change, `npm run render` writes the generated files and
`npm run render:check` proves that they now match. CI runs the other four
commands (`test`, `validate`, `render:check`, and `check`) without the
write-producing render step. It never runs a network CORS check or an
authenticated probe, and any workflow that would print a credential is a bug
rather than a feature.

## Reviews

A pull request that changes a number without a source link cannot be merged,
because there is nothing to re-check it against later. That is the only hard
review rule; everything else is a conversation.

---

## 简体中文

这份目录只有在准确的时候才有价值，而服务商改一次文档它就过期了，所以**纠错是这里最需要的贡献**。
提 issue 和 PR 用中文完全可以。

- 只收录**官方公开的免费额度**；逆向出来的接口、别人页面上抓来的 key、非官方代理，一律不收。
- **任何真实凭据都不要提交**，也不要贴在 issue 里。本仓库不分发 key。
- 改事实：改 [`data/providers.json`](data/providers.json)，把 `source_checked_at` 改成**你本人**读官方页面的日期，
  确认 `official_sources` 里就是这个数字的出处，再到 [`data/changelog.json`](data/changelog.json) 最新一周补一条。
- `README.md`、`docs/`、`examples/` 全是渲染产物，**不要手改**，下一次 `npm run render` 会覆盖。
- 提交前跑上面那五条命令，把重新生成的产物和数据改动放在同一个 commit 里。
- CI 会复跑其中四项只读检查，不会执行会写入产物的 `npm run render`。
- 中文文案是可选字段（`summary_zh` / `note_zh` / `detail_zh`），没有就回退英文，属于正常状态。

唯一的硬性评审规则：**改了数字却没有官方来源链接的 PR 不能合并**——否则以后没人能复核它。
