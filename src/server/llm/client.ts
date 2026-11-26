import { DEFAULT_GEMINI_MODEL, getEnv } from '../config/env';
import { logger } from '../../lib/logger';

export interface LlmRequest {
  system: string;
  prompt: string;
  maxTokens: number;
  timeoutMs: number;
}

export interface LlmClient {
  complete(request: LlmRequest): Promise<string | null>;
}

let modelNotFoundLogged = false;
let modelUnavailable = false;

export function isLlmModelUnavailable(): boolean {
  return modelUnavailable;
}

export function resetLlmAvailabilityForTests(): void {
  modelNotFoundLogged = false;
  modelUnavailable = false;
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
        maxOutputTokens: Math.min(request.maxTokens, 700),
        temperature: 0.2,
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
          return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        }

        const errText = await res.text().catch(() => '');
        if (handleGeminiModelError(res.status, this.model, errText)) {
          return null;
        }

        const retryable = res.status === 429 || res.status >= 500;
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
