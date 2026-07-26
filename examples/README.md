# Examples

Three runnable files, filled in for GroqCloud, generated from the same
snippet source as the website and `npx free-llm-api setup`. Do not edit them by
hand: `npm run render` rewrites them and `npm run render:check` fails the build
when they drift.

| File | What it does |
| --- | --- |
| [`curl/verify.sh`](curl/verify.sh) | Lists the models the key can reach. Spends no tokens and generates nothing, so it is safe to run on a quota you care about. |
| [`python/chat.py`](python/chat.py) | One chat completion using the standard library only: no `pip install`, no SDK. |
| [`node/chat.mjs`](node/chat.mjs) | The same request on Node.js 20+ with `fetch`: no dependencies. |

Every one of them reads the key from `GROQ_API_KEY` and from nowhere else. There is
no key in this repository to run them with — create your own at https://console.groq.com/keys:

```bash
export GROQ_API_KEY=YOUR_API_KEY
sh examples/curl/verify.sh
python3 examples/python/chat.py
node examples/node/chat.mjs
```

Each file names its endpoint and its model in the first few lines. To point one
at a different provider, take the base URL and a model id from that provider's
page in the [catalog](https://xyzs996.github.io/free-llm-api/) and change those two values; the key variable
changes with it, since each provider reads its own.

## 简体中文

三个可直接运行的示例，按 GroqCloud 填好，与网页片段、CLI 出自同一份渲染器。
**请勿手改**：`npm run render` 会覆盖，`npm run render:check` 会因为产物漂移而失败。

key 只从 `GROQ_API_KEY` 读取。本仓库不含任何可用 key，请到 https://console.groq.com/keys 自己创建一个。
换服务商时，从[目录](https://xyzs996.github.io/free-llm-api/zh/)里取对应的 base URL 与模型 id，改掉文件开头那两个值即可。
