# Security Policy

This repository publishes provider facts and probe results, never API credentials.

## Report a vulnerability

Do not include credentials or raw Authorization headers in a public issue. Email `support@pekpik.com` with secrets redacted.

## Probe credentials

- Probe keys belong to the maintainer and stay in local environment variables or repository secrets.
- CI validates static data but does not run authenticated probes.
- Probe output contains classifications, status codes, timestamps, and latency only.
- A failed sample credential is not evidence that an entire provider is down.
