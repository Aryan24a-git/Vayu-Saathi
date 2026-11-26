import { DEFAULT_GEMINI_MODEL, getEnv } from '../config/env';
import { logger } from '../../lib/logger';

export interface LlmRequest {
  system: string;
  prompt: string;
  maxTokens: number;
  timeoutMs: number;
  jsonMode?: boolean;
}

export interface LlmClient {
  complete(request: LlmRequest): Promise<string | null>;
}

let modelNotFoundLogged = false;
let modelUnavailable = false;
let modelSucceeded = false;
let cachedReadyProbe: { ok: boolean; checkedAt: number } | null = null;

export function isLlmModelUnavailable(): boolean {
  return modelUnavailable;
}

export function recordLlmSuccess(): void {
  modelSucceeded = true;
  cachedReadyProbe = { ok: true, checkedAt: Date.now() };
}

export function resetLlmAvailabilityForTests(): void {
  modelNotFoundLogged = false;
  modelUnavailable = false;
  modelSucceeded = false;
  cachedReadyProbe = null;
}

export function stripMarkdownCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function handleGeminiModelError(status: number, model: string, bodyText = ''): boolean {
  const isNotFound =
    status === 404 || /not found|not supported for generateContent|NOT_FOUND/i.test(bodyText);
  if (!isNotFound) return false;
  modelUnavailable = true;
  if (!modelNotFoundLogged) {
    modelNotFoundLogged = true;
    logger.error('llmModelNotFound', { model, status, fallback: 'basic_mode' });
  }
  return true;
}

export class NullClient implements LlmClient {
  async complete(_request: LlmRequest): Promise<null> {
    return null;
  }
}

export class GeminiClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_GEMINI_MODEL
  ) {}

  async complete(request: LlmRequest): Promise<string | null> {
    if (modelUnavailable) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const body = JSON.stringify({
      system_instruction: { parts: [{ text: request.system }] },
      contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
      generationConfig: {
        maxOutputTokens: Math.min(Math.max(request.maxTokens, 400), 1000),
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 },
        ...(request.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), request.timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: controller.signal,
        });

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          if (text) recordLlmSuccess();
          return text;
        }

        const errText = await res.text().catch(() => '');
        if (handleGeminiModelError(res.status, this.model, errText)) {
          return null;
        }

        const retryable = res.status === 429 || res.status >= 500;
        if (res.status === 429) {
          cachedReadyProbe = { ok: false, checkedAt: Date.now() };
        }
        if (!retryable || attempt === 1) {
          logger.warn('llmRequestFailed', { fallbackReason: `HTTP_${res.status}` });
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 100));
      } catch (error) {
        if (attempt === 1) {
          logger.warn('llmRequestFailed', {
            fallbackReason: error instanceof Error ? error.name : 'unknown',
          });
          return null;
        }
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }
}

export function createLlmClient(): LlmClient {
  const env = getEnv();
  const apiKey = env.GEMINI_API_KEY;
  if (!env.LLM_ENABLED || !apiKey || modelUnavailable) return new NullClient();
  return new GeminiClient(apiKey, env.GEMINI_MODEL);
}

export async function checkLlmReadiness(): Promise<boolean> {
  const env = getEnv();
  if (!env.LLM_ENABLED || !env.GEMINI_API_KEY || modelUnavailable) return false;
  if (modelSucceeded) return true;
  if (cachedReadyProbe && Date.now() - cachedProbeTime(cachedReadyProbe) < 300_000) {
    return cachedReadyProbe.ok;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ok' }] }],
        generationConfig: {
          maxOutputTokens: 5,
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      handleGeminiModelError(res.status, env.GEMINI_MODEL, body);
      cachedReadyProbe = { ok: false, checkedAt: Date.now() };
      return false;
    }
    recordLlmSuccess();
    return true;
  } catch {
    cachedReadyProbe = { ok: false, checkedAt: Date.now() };
    return false;
  }
}

function cachedProbeTime(probe: { checkedAt: number }): number {
  return probe.checkedAt;
}
