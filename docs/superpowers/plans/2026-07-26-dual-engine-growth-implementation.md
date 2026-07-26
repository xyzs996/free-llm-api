# Dual-Engine GitHub Growth and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the repository README and static landing site into a GitHub-first acquisition product with a secondary Google SEO engine, while preserving source-backed data, bilingual rendering, deterministic generation, and credential safety.

**Architecture:** Add a small pure `growth.js` policy module that derives permanent-free collections, no-card counts, and explainable quick picks from `data/providers.json`. Keep README, home page, comparison pages, structured data, sitemap, and translations generated from the same provider records; static HTML remains functional without JavaScript, while `app.js` adds shareable filter query parameters.

**Tech Stack:** Node.js 20 ESM, built-in `node:test`, deterministic string renderers, static HTML/CSS/JavaScript, GitHub Pages.

---

## Execution constraints

- Execute inline in the current session because the user did not request subagent delegation.
- Follow red-green-refactor for every production behavior change.
- Do not add runtime dependencies, backend services, databases, credentials, or analytics to the key checker.
- Do not perform Git commits, pushes, deployments, Releases, Topics, or repository-description changes until strict acceptance has passed and the user confirms the results.
- Generated files are updated only after their renderer tests pass.

## File responsibility map

- Create `src/growth.js`: pure selection and presentation policy derived from provider facts.
- Create `test/growth.test.js`: unit contract for permanent-free grouping, no-card statistics, and quick-pick explanations.
- Modify `src/render.js`: GitHub README and home-page composition only.
- Modify `src/readme-zh.js`: Chinese README composition using the same growth policy.
- Modify `src/pages.js`: static comparison/use-case pages and links into the existing page matrix.
- Modify `src/i18n.js`: all new visible English and Chinese strings.
- Modify `docs/filter.js`: filtering logic only.
- Modify `docs/app.js`: query-string hydration and shareable filter state only.
- Modify `docs/styles.css`: shared visual system and responsive components.
- Modify `src/seo.js`: structured data and sitemap behavior only when a new page type requires it.
- Modify tests under `test/`: contracts for rendered structure, SEO uniqueness, i18n parity, assets, and filters.
- Regenerate `README.md`, `README_zh.md`, and `docs/` only through `npm run render`.

### Task 1: Growth policy as a single source of presentation truth

**Files:**
- Create: `src/growth.js`
- Create: `test/growth.test.js`

- [x] **Step 1: Write failing tests for access groups and summary counts**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { accessGroups, catalogSummary } from '../src/growth.js';

const providers = JSON.parse(await readFile(new URL('../data/providers.json', import.meta.url)));

test('growth groups keep provider free tiers separate from other access types', () => {
  const groups = accessGroups(providers);
  assert.ok(groups.permanent.length > 0);
  assert.ok(groups.permanent.every(({ category }) => category === 'provider-free-tier'));
  assert.ok(groups.other.every(({ category }) => category !== 'provider-free-tier'));
  assert.equal(groups.permanent.length + groups.other.length, providers.length);
});

test('catalog summary reports actionable free-tier counts', () => {
  const summary = catalogSummary(providers);
  assert.equal(summary.permanentFree, 15);
  assert.equal(summary.noCardPermanentFree, 15);
  assert.equal(summary.openAiCompatiblePermanentFree, 15);
  assert.equal(summary.latestReview, '2026-07-25');
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test test/growth.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/growth.js`.

- [x] **Step 3: Implement the minimal access policy**

```js
export function accessGroups(providers) {
  return {
    permanent: providers.filter(({ category }) => category === 'provider-free-tier'),
    other: providers.filter(({ category }) => category !== 'provider-free-tier'),
  };
}

export function catalogSummary(providers) {
  const { permanent } = accessGroups(providers);
  return {
    permanentFree: permanent.length,
    noCardPermanentFree: permanent.filter(({ credit_card_required: required }) => !required).length,
    openAiCompatiblePermanentFree: permanent.filter(({ openai_compatible: compatible }) => compatible).length,
    latestReview: providers.map(({ source_checked_at: date }) => date).sort().at(-1),
  };
}
```

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `node --test test/growth.test.js`

Expected: 2 tests pass.

- [x] **Step 5: Write a failing test for explainable quick picks**

```js
import { quickPicks } from '../src/growth.js';

test('quick picks are deterministic and explain their selection rule', () => {
  const picks = quickPicks(providers);
  assert.deepEqual(picks.map(({ id }) => id), ['highest-daily-limit', 'highest-rpm', 'browser-ready', 'coding-agents']);
  assert.equal(picks[0].provider.id, 'groq');
  assert.match(picks[0].reason, /1,000 requests\/day/);
  assert.ok(picks.every(({ provider }) => provider.category === 'provider-free-tier'));
});
```

- [x] **Step 6: Run the focused test and verify RED**

Run: `node --test test/growth.test.js`

Expected: FAIL because `quickPicks` is not exported.

- [x] **Step 7: Implement deterministic quick-pick rules**

Implement `quickPicks(providers)` in `src/growth.js` with four explicit rules: highest published daily request count, highest published RPM, first browser-supported permanent tier in source order, and Groq as the catalog's documented coding-agent example. Return `{ id, provider, reason }` for each rule and exclude missing results.

- [x] **Step 8: Run the focused test and full unit suite**

Run: `node --test test/growth.test.js && npm test`

Expected: focused tests and all existing tests pass.

### Task 2: GitHub README acquisition structure

**Files:**
- Modify: `test/render.test.js`
- Modify: `src/render.js`
- Modify: `src/readme-zh.js`
- Test: `test/i18n.test.js`

- [x] **Step 1: Replace the old README expectation with a failing growth-first contract**

Add assertions that the English README:

```js
assert.match(readme, /^# Free LLM APIs/m);
assert.match(readme, /Permanent free tiers, no-card options, direct API key links/);
assert.ok(readme.indexOf('## Pick a free API by goal') < readme.indexOf('## Permanent free tiers'));
assert.ok(readme.indexOf('## Permanent free tiers') < readme.indexOf('## Other access options'));
assert.match(readme, /\| Provider \| Models \| Published limits \| Card \| OpenAI compatible \| Get API key \|/);
assert.match(readme, /## Quick start/);
assert.match(readme, /from openai import OpenAI/);
assert.match(readme, /## Why trust this list/);
```

Keep existing assertions for official sources, probe caution, generated data, no credentials, client setup, hosted fallback, security, and related projects.

- [x] **Step 2: Run the README test and verify RED**

Run: `node --test --test-name-pattern="README" test/render.test.js`

Expected: FAIL because the old README title and section order remain.

- [x] **Step 3: Implement English README grouping and quick picks**

In `src/render.js`, import `accessGroups`, `catalogSummary`, and `quickPicks`. Replace the opening and catalog composition so the rendered order is:

1. `# Free LLM APIs`
2. language switch and badges
3. direct value statement and source-review note
4. status-page image
5. `## Pick a free API by goal`
6. `## Permanent free tiers`
7. `## Other access options`
8. `## Quick start`
9. key checker and coding-client links
10. `## Why trust this list`
11. changelog, contribution, security, local development, Star history, related project, hosted fallback

Build all table rows from the two access groups. Model summaries use the first three `models` values joined with `<br>`, limits use published RPM/RPD values or `Dynamic / model-dependent`, and signup links come only from `signup_url`.

- [x] **Step 4: Run the README test and verify GREEN**

Run: `node --test --test-name-pattern="README" test/render.test.js`

Expected: all matching tests pass.

- [x] **Step 5: Write a failing Chinese parity test**

```js
test('Chinese README mirrors the growth-first information architecture', () => {
  const readme = artifacts['README_zh.md'];
  assert.match(readme, /^# 免费大模型 API 清单/m);
  assert.ok(readme.indexOf('## 按需求选择免费 API') < readme.indexOf('## 永久免费额度'));
  assert.ok(readme.indexOf('## 永久免费额度') < readme.indexOf('## 其他访问方式'));
  assert.match(readme, /## 快速开始/);
  assert.match(readme, /## 为什么可以信任这份清单/);
});
```

- [x] **Step 6: Run the Chinese test and verify RED**

Run: `node --test --test-name-pattern="Chinese README mirrors" test/i18n.test.js`

Expected: FAIL on the first missing heading.

- [x] **Step 7: Implement the Chinese README with the same data policy**

Update `src/readme-zh.js` to import the growth helpers and emit the same section order, tables, Quick Start, trust rules, changelog, contribution, security, local development, Star history, related project, and hosted fallback in natural Simplified Chinese.

- [x] **Step 8: Run focused and full render tests**

Run: `node --test test/render.test.js test/i18n.test.js`

Expected: all tests pass.

### Task 3: Growth-first home page structure and navigation

**Files:**
- Modify: `test/render.test.js`
- Modify: `src/render.js`
- Modify: `src/i18n.js`

- [x] **Step 1: Write a failing home-page structure test**

```js
test('home page leads with acquisition paths before the full directory', async () => {
  const html = renderer.renderArtifacts(providers)['docs/index.html'];
  assert.match(html, /<nav class="site-nav"/);
  assert.match(html, /<h1>Free LLM APIs with direct API key links<\/h1>/);
  assert.match(html, /class="hero-actions"/);
  assert.match(html, /id="pick-by-goal"/);
  assert.match(html, /id="best-free-picks"/);
  assert.match(html, /id="directory"/);
  assert.match(html, /id="quick-start"/);
  assert.match(html, /id="trust"/);
  assert.ok(html.indexOf('id="pick-by-goal"') < html.indexOf('id="directory"'));
  assert.ok(html.indexOf('id="best-free-picks"') < html.indexOf('id="directory"'));
});
```

- [x] **Step 2: Run the home-page test and verify RED**

Run: `node --test --test-name-pattern="home page leads" test/render.test.js`

Expected: FAIL because the navigation and acquisition sections do not exist.

- [x] **Step 3: Add matching English and Chinese translation keys**

Add paired keys for navigation, Hero actions, goal cards, quick-pick cards, directory copy, trust points, Quick Start, contribution CTA, and hosted CTA. Change the English title to `Free LLM APIs: No-Card Options & Verified Limits` and the Chinese title to `免费大模型 API 清单：无需信用卡、模型与限额对比`.

- [x] **Step 4: Implement the new home-page composition**

Use the growth summary and quick picks in `renderPage()`. Render standard `<a href>` navigation and goal links such as `./?creditCard=not-required#directory`, `./?openaiCompatible=yes#directory`, `./client/claude-code.html`, and model-family pages. Preserve the full pre-rendered provider table and embedded provider JSON.

- [x] **Step 5: Run home-page and i18n tests**

Run: `node --test test/render.test.js test/i18n.test.js`

Expected: all tests pass and both locale string tables still have identical keys.

### Task 4: Shareable filter state and acquisition links

**Files:**
- Modify: `test/site-assets.test.js`
- Modify: `test/filter.test.js`
- Modify: `docs/app.js`
- Modify: `docs/filter.js`

- [x] **Step 1: Write failing tests for query-string parsing**

```js
import { buildFilterState, filterStateFromSearch, filterStateToSearch } from '../docs/app.js';

test('filter state round-trips through a shareable query string', () => {
  const state = filterStateFromSearch('?creditCard=not-required&openaiCompatible=yes&query=Groq');
  assert.deepEqual(state, {
    query: 'Groq',
    category: 'all',
    creditCard: 'not-required',
    openaiCompatible: 'yes',
    probe: 'all',
  });
  assert.equal(filterStateToSearch(state), '?query=Groq&creditCard=not-required&openaiCompatible=yes');
});
```

- [x] **Step 2: Run the asset test and verify RED**

Run: `node --test test/site-assets.test.js`

Expected: FAIL because the two query-string functions are missing.

- [x] **Step 3: Implement pure query-string helpers and DOM hydration**

Export `filterStateFromSearch(search)` and `filterStateToSearch(state)` from `docs/app.js`. On initialization, populate form controls from `window.location.search`; after every filter change, call `history.replaceState` with the canonical set of non-default parameters and retain the current hash.

- [x] **Step 4: Run filter and asset tests**

Run: `node --test test/filter.test.js test/site-assets.test.js`

Expected: all tests pass.

### Task 5: Static comparison pages for high-intent searches

**Files:**
- Modify: `test/pages.test.js`
- Modify: `src/pages.js`
- Modify: `src/page-layout.js` only if the existing layout cannot express the comparison page
- Modify: `src/i18n.js`

- [x] **Step 1: Write a failing page-matrix test**

```js
for (const slug of ['no-credit-card', 'openai-compatible', 'coding-agents']) {
  assert.ok(Object.hasOwn(pages, `docs/compare/${slug}.html`), `${slug} has no comparison page`);
  assert.ok(Object.hasOwn(pages, `docs/zh/compare/${slug}.html`), `${slug} has no Chinese page`);
}
```

Also assert that the homepage links to all three English comparison pages and each comparison page links to at least three eligible Provider pages.

- [x] **Step 2: Run the page-matrix test and verify RED**

Run: `node --test --test-name-pattern="page matrix" test/pages.test.js`

Expected: FAIL because `docs/compare/*.html` is not generated.

- [x] **Step 3: Implement three finite comparison definitions**

Add an immutable `COMPARISONS` definition in `src/pages.js`:

```js
const COMPARISONS = Object.freeze([
  { id: 'no-credit-card', predicate: (provider) => !provider.credit_card_required },
  { id: 'openai-compatible', predicate: (provider) => provider.openai_compatible },
  { id: 'coding-agents', predicate: (provider) => provider.openai_compatible && provider.models.some((model) => /coder|code|gpt-oss|llama|qwen/i.test(model)) },
]);
```

Render each page through the existing `renderDetailPage` layout with localized title, description, visible introduction, provider comparison table, selection explanation, official-source note, related models/clients, and FAQ derived from visible content.

- [x] **Step 4: Add localized comparison strings and links**

Add exact English and Chinese titles, descriptions, H1 text, selection explanations, table labels, and FAQ questions/answers. Add comparison links to the homepage Browse section and related sidebars.

- [x] **Step 5: Run page, SEO, and i18n tests**

Run: `node --test test/pages.test.js test/seo.test.js test/i18n.test.js`

Expected: all tests pass with unique titles/descriptions and no orphan pages.

### Task 6: Visual system and responsive acquisition components

**Files:**
- Modify: `test/site-assets.test.js`
- Modify: `docs/styles.css`
- Modify: `docs/assets/social-preview.png` only if a reproducible image-generation path is available; otherwise preserve the current valid asset and record the skip

- [x] **Step 1: Write failing structural CSS assertions**

```js
for (const selector of [
  '.site-nav', '.hero-actions', '.goal-grid', '.goal-card',
  '.pick-grid', '.pick-card', '.trust-grid', '.quick-start-grid',
]) {
  assert.match(styles, new RegExp(selector.replace('.', '\\.')));
}
assert.match(styles, /:focus-visible/);
assert.match(styles, /@media\s*\(max-width:\s*760px\)/);
```

- [x] **Step 2: Run the style test and verify RED**

Run: `node --test --test-name-pattern="styles" test/site-assets.test.js`

Expected: FAIL on the first missing component selector.

- [x] **Step 3: Implement the visual components**

Update CSS variables and add styles for the site navigation, Hero CTA hierarchy, stat chips, goal cards, pick cards, trust strip, Quick Start code panel, contribution CTA, responsive layout, hover states, and `:focus-visible`. Preserve all existing Verify and detail-page selectors.

- [x] **Step 4: Run style and full asset tests**

Run: `node --test test/site-assets.test.js`

Expected: all tests pass.

### Task 7: SEO consistency and structured data

**Files:**
- Modify: `test/seo.test.js`
- Modify: `test/pages.test.js`
- Modify: `src/seo.js`
- Modify: `src/page-layout.js`
- Modify: `src/render.js`

- [x] **Step 1: Add failing SEO assertions for the new positioning**

Assert that the home page title and description contain `Free LLM APIs`, `no-card`, and `verified limits`; every comparison page has canonical/hreflang pairs, visible H1, BreadcrumbList data, and appears in the sitemap; no output contains `<meta name="keywords">`.

- [x] **Step 2: Run SEO tests and verify RED**

Run: `node --test test/seo.test.js test/pages.test.js`

Expected: FAIL for missing comparison canonical/sitemap entries or the old home metadata.

- [x] **Step 3: Implement only the missing SEO wiring**

Reuse `renderHead`, `pageUrl`, `alternateLinks`, breadcrumb JSON-LD, and artifact-derived sitemap generation. Do not introduce a second URL builder or hard-coded production host.

- [x] **Step 4: Run SEO, page, and i18n tests**

Run: `node --test test/seo.test.js test/pages.test.js test/i18n.test.js`

Expected: all tests pass.

### Task 8: Generate deterministic artifacts

**Files:**
- Regenerate: `README.md`
- Regenerate: `README_zh.md`
- Regenerate: `docs/index.html`, `docs/zh/index.html`
- Regenerate: `docs/provider/**`, `docs/model/**`, `docs/client/**`, `docs/compare/**`
- Regenerate: `docs/sitemap.xml`, `docs/providers.json`, badges, examples
- Modify: `test/render.test.js` expected artifact whitelist if required by the comparison pages

- [x] **Step 1: Verify render-check fails before generation**

Run: `npm run render:check`

Expected: non-zero exit listing the stale generated artifacts created by source changes.

- [x] **Step 2: Generate all artifacts**

Run: `npm run render`

Expected: renderer completes with no error.

- [x] **Step 3: Verify deterministic output**

Run: `npm run render:check`

Expected: exit code 0 and all generated artifacts current.

- [x] **Step 4: Run the complete automated acceptance suite**

Run: `npm test && npm run validate && npm run check && npm run render:check`

Expected: all commands exit 0 with no related skipped tests.

### Task 9: Local HTTP, link, safety, and browser acceptance

**Files:**
- Modify: task record with actual evidence only

- [x] **Step 1: Start the project static server**

Run: `npm run serve`

Expected: server listens on `127.0.0.1:4173`.

- [x] **Step 2: Verify representative HTTP endpoints**

Check `/`, `/zh/`, `/provider/groq.html`, `/model/llama.html`, `/client/claude-code.html`, `/compare/no-credit-card.html`, `/zh/compare/no-credit-card.html`, `/verify.html`, `/sitemap.xml`, and `/robots.txt`.

Expected: every path returns HTTP 200 with the correct content type.

- [x] **Step 3: Run internal-link and credential safety checks**

Use the existing page-matrix tests and `npm run check`; additionally inspect rendered links for missing local targets and confirm no generated output contains a credential candidate.

- [x] **Step 4: Perform browser checks at three viewports**

Inspect 360×800, 768×1024, and 1280×800 for the English and Chinese home pages plus representative detail and comparison pages. Verify no horizontal overflow, no overlapping CTA, visible keyboard focus, working filter hydration, language switching, and zero console errors.

- [x] **Step 5: Record results, skipped checks, and remaining risks**

Update `tasks/2026-07-26-GitHub增长与SEO双引擎改版.md` with exact commands, result counts, browser evidence, skipped items, and remaining external-growth risks.

### Task 10: Review and user acceptance gate

**Files:**
- Modify: `tasks/2026-07-26-GitHub增长与SEO双引擎改版.md`
- Modify: this plan's checkbox status and evidence notes

- [x] **Step 1: Inspect the full non-Git file diff and changed-file scope**

Use read-only filesystem comparisons available in the workspace. Do not stage, commit, or push.

- [x] **Step 2: Perform code review and fresh verification**

Use the `code-review` and `verification-before-completion` workflows. Reopen any task with a Critical or Important finding and fix it through a new failing test.

- [x] **Step 3: Report completion and wait for user confirmation**

Report implemented behavior, exact test results, failed/skipped checks, remaining risks, and completion percentage. Do not perform final documentation/Git/deployment work until the user says the result is acceptable.

- [x] **Step 4: After user confirmation, update final records and perform Git/deployment checks**

Re-read global rules, inspect repository status, branch, remote, and unrelated changes. Only then create Chinese commit messages, push the isolated task changes, verify the public repository, and update authorized repository metadata or release materials.

## Plan self-review

- Spec coverage: README, home page, visual system, permanent-free separation, Quick Picks, shareable filters, comparison pages, bilingual content, SEO, sitemap, trust layer, security, generation, browser acceptance, and post-acceptance Git gates all map to explicit tasks.
- Placeholder scan: no `TBD`, `TODO`, “implement later,” or undefined follow-up is present.
- Interface consistency: `accessGroups`, `catalogSummary`, and `quickPicks` are introduced in Task 1 and reused consistently; comparison IDs are identical in pages, tests, links, and acceptance paths.
- Scope control: Agent Skill packaging, dependency additions, backend services, databases, paid promotion, and remote community posting remain outside implementation until separately authorized.

## Execution result

- Completed all 10 tasks in the approved scope without adding runtime dependencies, backend services, databases, credentials, or analytics.
- Fresh final acceptance passed: 166/166 tests, 26 providers, 7 model families, 101 deterministic artifacts, 10/10 representative HTTP endpoints, and responsive browser checks at 360px, 768px, and 1280px.
- The user accepted the implementation on 2026-07-26. Final documentation and authorized Git/remote handoff then proceeded on `main`.
- The existing social preview image was preserved because no reproducible brand-image generation path was introduced; external ranking and Star growth remain post-publication observation metrics.
