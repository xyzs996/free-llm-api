// Send one chat completion to an OpenAI-compatible endpoint.
//
// The key is read from GROQ_API_KEY, so it never lives in this file, in your shell
// history, or in version control. Node 20+ only: no dependencies, no SDK.

const BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile";
const KEY_ENV = "GROQ_API_KEY";

const key = process.env[KEY_ENV];
if (!key) {
  process.stderr.write(`Set ${KEY_ENV} to a key you created yourself at the provider console.\n`);
  process.exit(1);
}

const response = await fetch(`${BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
  }),
});

const body = await response.text();
if (!response.ok) {
  process.stderr.write(`HTTP ${response.status}: ${body}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.parse(body).choices[0].message.content}\n`);
