"""Send one chat completion to an OpenAI-compatible endpoint.

The key is read from GROQ_API_KEY, so it never lives in this file, in your shell
history, or in version control. Standard library only: no pip install, no SDK.
"""

import json
import os
import urllib.error
import urllib.request

BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "llama-3.3-70b-versatile"
KEY_ENV = "GROQ_API_KEY"


def main() -> int:
    key = os.environ.get(KEY_ENV)
    if not key:
        print(f"Set {KEY_ENV} to a key you created yourself at the provider console.")
        return 1

    request = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(
            {
                "model": MODEL,
                "messages": [{"role": "user", "content": "Reply with the single word: ready"}],
            }
        ).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        print(f"HTTP {error.code}: {detail}")
        return 1

    print(body["choices"][0]["message"]["content"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
