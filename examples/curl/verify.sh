#!/usr/bin/env sh
set -eu

: "${GROQ_API_KEY:?Set GROQ_API_KEY to a key you created yourself at the provider console}"

# Prints the models this key can reach, then the HTTP status on its own line so
# 200, 401, and 429 stay distinguishable.
curl --silent --show-error \
  --write-out '\nHTTP %{http_code}\n' \
  --header "Authorization: Bearer $GROQ_API_KEY" \
  'https://api.groq.com/openai/v1/models'
