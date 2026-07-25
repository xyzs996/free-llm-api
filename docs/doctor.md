# Doctor reference

`doctor` performs explicit, local endpoint checks. It has no telemetry and does not save results.

## Commands

```bash
PEKPIK_API_KEY=YOUR_API_KEY node src/cli.js doctor [options]
```

Options:

```text
--base-url <url>    OpenAI-compatible base URL (default: https://aiapiv2.pekpik.com/v1)
--timeout-ms <ms>   Per-request timeout from 1 to 120000 (default: 10000)
--chat              After /models succeeds, send one minimal chat request
--model <id>        Model for --chat; otherwise the first /models entry is used
```

## Requests

The default check is:

```text
GET <base-url>/models
Authorization: Bearer <value read from PEKPIK_API_KEY>
```

With `--chat`, a successful model check is followed by:

```json
{
  "model": "<selected-model>",
  "messages": [{ "role": "user", "content": "Reply with OK." }],
  "max_tokens": 8,
  "stream": false
}
```

The response content is neither displayed nor persisted.

## Classifications

| Status | Trigger | Exit code |
| --- | --- | ---: |
| `success` | HTTP `2xx` with a JSON response | 0 |
| `authentication_error` | Missing `PEKPIK_API_KEY`, HTTP `401`, or HTTP `403` | 2 |
| `rate_limited` | HTTP `429` | 3 |
| `network_error` | DNS, connection, TLS, timeout, or other fetch failure | 4 |
| `server_error` | HTTP `5xx` | 5 |
| `http_error` | Other non-success HTTP status | 5 |
| `response_error` | Successful HTTP status with a non-JSON body | 5 |
| `configuration_error` | `--chat` has no explicit or discovered model | 5 |

The CLI intentionally suppresses upstream response bodies and low-level network messages because they can contain credentials, request IDs, or private endpoint details.

## Output

Successful model check:

```text
status: success
http_status: 200
latency_ms: 123
models: 42
```

Authentication failure:

```text
status: authentication_error
http_status: 401
latency_ms: 123
```

`doctor` verifies one credential against one endpoint at one point in time. A `429` indicates only that request's rate-limit result; it does not prove that every user or the provider's whole free tier is unavailable.
