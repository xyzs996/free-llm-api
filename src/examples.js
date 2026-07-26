// The files in examples/ are generated, not written by hand. Each one comes out
// of src/snippets.js — the same module the website inlines into its provider
// pages and `npx free-llm-api setup` writes to disk — so a reader who copies
// from the repository and a reader who copies from the site get the same bytes.
// Hand-written examples are how a base URL ends up correct in one place and
// stale in another; `npm run render:check` makes that impossible here.
import { sampleProviderFrom } from './pages.js';
import { SITE_URL } from './site.js';
import {
  keyEnvForProvider,
  renderSnippet,
  snippetModelFor,
  snippetProviderName,
} from './snippets.js';

const EXAMPLE_FILES = Object.freeze([
  {
    clientId: 'curl',
    path: 'examples/curl/verify.sh',
    run: 'sh examples/curl/verify.sh',
    purpose: 'Lists the models the key can reach. Spends no tokens and generates nothing, so it is safe to run on a quota you care about.',
  },
  {
    clientId: 'python',
    path: 'examples/python/chat.py',
    run: 'python3 examples/python/chat.py',
    purpose: 'One chat completion using the standard library only: no `pip install`, no SDK.',
  },
  {
    clientId: 'node',
    path: 'examples/node/chat.mjs',
    run: 'node examples/node/chat.mjs',
    purpose: 'The same request on Node.js 20+ with `fetch`: no dependencies.',
  },
]);

function readme({ providerName, keyEnv, signup, files }) {
  const rows = files
    .map(({ path, purpose }) => `| [\`${path.replace('examples/', '')}\`](${path.replace('examples/', '')}) | ${purpose} |`)
    .join('\n');
  const commands = files.map(({ run }) => run).join('\n');

  return `# Examples

Three runnable files, filled in for ${providerName}, generated from the same
snippet source as the website and \`npx free-llm-api setup\`. Do not edit them by
hand: \`npm run render\` rewrites them and \`npm run render:check\` fails the build
when they drift.

| File | What it does |
| --- | --- |
${rows}

Every one of them reads the key from \`${keyEnv}\` and from nowhere else. There is
no key in this repository to run them with — create your own at ${signup}:

\`\`\`bash
export ${keyEnv}=YOUR_API_KEY
${commands}
\`\`\`

Each file names its endpoint and its model in the first few lines. To point one
at a different provider, take the base URL and a model id from that provider's
page in the [catalog](${SITE_URL}) and change those two values; the key variable
changes with it, since each provider reads its own.

## 简体中文

三个可直接运行的示例，按 ${providerName} 填好，与网页片段、CLI 出自同一份渲染器。
**请勿手改**：\`npm run render\` 会覆盖，\`npm run render:check\` 会因为产物漂移而失败。

key 只从 \`${keyEnv}\` 读取。本仓库不含任何可用 key，请到 ${signup} 自己创建一个。
换服务商时，从[目录](${SITE_URL}zh/)里取对应的 base URL 与模型 id，改掉文件开头那两个值即可。
`;
}

export function renderExamples(providers) {
  const sample = sampleProviderFrom(providers);
  const model = snippetModelFor(sample);
  // A guessed model id would make every example fail against the endpoint it
  // names, which is worse than not shipping the examples at all.
  if (!model) {
    throw new Error('No provider publishes a pasteable model id, so examples/ would ship a guess');
  }

  const keyEnv = keyEnvForProvider(sample);
  const providerName = snippetProviderName(sample);
  const options = {
    baseUrl: sample.base_url,
    model,
    keyEnv,
    providerId: sample.id,
    providerName,
  };

  const artifacts = {
    'examples/README.md': readme({
      providerName,
      keyEnv,
      signup: sample.signup_url ?? sample.official_sources[0].url,
      files: EXAMPLE_FILES,
    }),
  };
  for (const { clientId, path } of EXAMPLE_FILES) {
    artifacts[path] = renderSnippet(clientId, options).content;
  }
  return artifacts;
}
