import { normalizeBaseUrl } from './setup.js';

const DEFAULT_BASE_URL = 'https://aiapiv2.pekpik.com/v1';
const DEFAULT_TIMEOUT_MS = 10_000;

const exitCodes = {
  success: 0,
  authentication_error: 2,
  rate_limited: 3,
  network_error: 4,
  server_error: 5,
  http_error: 5,
  response_error: 5,
  configuration_error: 5,
};

function classificationForStatus(status) {
  if (status >= 200 && status < 300) return 'success';
  if (status === 401 || status === 403) return 'authentication_error';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'http_error';
}

async function request(url, options, timeoutMs) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const result = {
      status: classificationForStatus(response.status),
      httpStatus: response.status,
      latencyMs: Math.round(performance.now() - startedAt),
    };

    if (result.status === 'success') {
      try {
        result.payload = await response.json();
      } catch {
        result.status = 'response_error';
      }
    }
    return result;
  } catch {
    return {
      status: 'network_error',
      httpStatus: 'unavailable',
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

function timeoutFrom(value) {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  const timeoutMs = Number(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new Error('--timeout-ms must be an integer between 1 and 120000');
  }
  return timeoutMs;
}

export async function runDoctor(options = {}) {
  const apiKey = process.env.PEKPIK_API_KEY;
  if (!apiKey) {
    return {
      models: {
        status: 'authentication_error',
        httpStatus: 'unavailable',
        latencyMs: 0,
      },
      exitCode: exitCodes.authentication_error,
      errorMessage: 'PEKPIK_API_KEY is not set',
    };
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
  const timeoutMs = timeoutFrom(options.timeoutMs);
  const headers = { Authorization: `Bearer ${apiKey}` };
  const models = await request(`${baseUrl}/models`, { headers }, timeoutMs);
  const modelData = Array.isArray(models.payload?.data) ? models.payload.data : [];
  models.modelCount = modelData.length;

  if (models.status !== 'success' || !options.chat) {
    return { models, exitCode: exitCodes[models.status] };
  }

  const model = options.model ?? modelData.find((entry) => typeof entry?.id === 'string')?.id;
  if (!model) {
    return {
      models,
      chat: {
        status: 'configuration_error',
        httpStatus: 'unavailable',
        latencyMs: 0,
      },
      exitCode: exitCodes.configuration_error,
      errorMessage: 'No model is available; pass --model explicitly',
    };
  }

  const chat = await request(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 8,
      stream: false,
    }),
  }, timeoutMs);

  return { models, chat, exitCode: exitCodes[chat.status] };
}

export function formatDoctorResult(result) {
  const lines = [
    `status: ${result.models.status}`,
    `http_status: ${result.models.httpStatus}`,
    `latency_ms: ${result.models.latencyMs}`,
  ];
  if (result.models.status === 'success') {
    lines.push(`models: ${result.models.modelCount}`);
  }
  if (result.chat) {
    lines.push(
      `chat_status: ${result.chat.status}`,
      `chat_http_status: ${result.chat.httpStatus}`,
      `chat_latency_ms: ${result.chat.latencyMs}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
