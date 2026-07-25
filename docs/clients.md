# Client setup details

All generated artifacts are review-only outputs. By default they are written below `.free-llm/<client>/`, which this repository ignores. The CLI does not inspect existing client configuration and uses exclusive file creation to avoid accidental replacement.

## Codex

Run:

```bash
node src/cli.js setup codex
```

The generated `config.toml` contains:

- `model_provider = "pekpik"`
- `[model_providers.pekpik]`
- `env_key = "PEKPIK_API_KEY"`
- `wire_api = "responses"`

Merge the snippet into `~/.codex/config.toml`. Do not copy it to `.codex/config.toml`: current Codex security rules ignore project-level keys that redirect provider authentication, including `model_provider` and `model_providers`.

Official source: [Codex advanced configuration and custom model providers](https://developers.openai.com/codex/config-advanced#custom-model-providers).

## Claude Code

Run:

```bash
node src/cli.js setup claude-code
PEKPIK_API_KEY=YOUR_API_KEY ./.free-llm/claude-code/run-claude-code.sh
```

The POSIX shell wrapper checks that `PEKPIK_API_KEY` exists at runtime, maps the value to `ANTHROPIC_AUTH_TOKEN`, sets `ANTHROPIC_BASE_URL`, and then replaces itself with the installed `claude` executable. The generated file contains the variable name, never its value.

The default Claude Code base URL is `https://aiapiv2.pekpik.com` because Anthropic-compatible clients append their API path. Pass an exact gateway root with `--base-url` when using another provider.

Official source: [Claude Code LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway).

## Continue

Run:

```bash
node src/cli.js setup continue
```

The generated `config.yaml` uses the OpenAI provider and the literal secret reference `${{ secrets.PEKPIK_API_KEY }}`. Copy or merge the model entry into your Continue configuration, then define the secret in a Continue-supported location such as a workspace `.env`, workspace `.continue/.env`, global `~/.continue/.env`, or the process environment.

Continue IDE extensions might not inherit shell environment variables. Prefer one of Continue's documented `.env` locations when the secret is not visible inside the IDE.

Official sources: [Continue config reference](https://docs.continue.dev/reference) and [Continue local secret resolution](https://docs.continue.dev/faqs#managing-local-secrets-and-environment-variables).

## Cursor

Run:

```bash
node src/cli.js setup cursor
```

Open the generated `SETUP.md` and perform each step in Cursor Settings. This project does not read or write Cursor's credential storage. Cursor documents that custom API keys apply to supported chat models while specialized features, including Tab Completion, continue to use built-in models.

Treat Override OpenAI Base URL as a client-wide setting and retest built-in model behavior after changing it. The generated guide calls out this limitation instead of claiming a lossless one-click switch.

Official source: [Cursor API keys](https://docs.cursor.com/settings/api-keys).

## Cline

Run:

```bash
node src/cli.js setup cline
```

Open the generated `SETUP.md`, select **OpenAI Compatible**, and enter the Base URL, API Key, and Model ID manually. This project does not modify VS Code extension storage.

Official source: [Cline OpenAI Compatible provider](https://docs.cline.bot/provider-config/openai-compatible).

## Custom endpoints

`--base-url` accepts only HTTP or HTTPS URLs without user info, query parameters, or fragments. This prevents credentials from being embedded in generated files. `--model` accepts letters, numbers, `.`, `_`, `:`, `/`, and `-` so the value cannot inject TOML, YAML, or Markdown lines.

Use a separate output directory to compare alternatives:

```bash
node src/cli.js setup codex \
  --base-url https://gateway.example/v1 \
  --model provider/model-name \
  --output ./review/codex-example
```
