// Tests Gemini model-not-found (404) fallback: logs once, falls back to Basic mode,
// and causes /api/ready to report llm: false. Satisfies: V2-31 step 4, REL-001
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GeminiClient,
  isLlmModelUnavailable,
  resetLlmAvailabilityForTests,
} from '../../src/server/llm/client';
import { logger } from '../../src/lib/logger';
import { GET as readyGet } from '../../src/app/api/ready/route';

describe('Gemini model-not-found fallback & /api/ready health', () => {
  beforeEach(() => {
    resetLlmAvailabilityForTests();
    vi.stubEnv('GEMINI_API_KEY', 'test-dummy-key-value');
    vi.stubEnv('LLM_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetLlmAvailabilityForTests();
  });

  it('logs model-not-found once, returns null for Basic fallback, and sets /api/ready llm: false', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 404,
      text: async () =>
        JSON.stringify({ error: { status: 'NOT_FOUND', message: 'models/old not found' } }),
    }));

    const client = new GeminiClient('test-dummy-key-value', 'gemini-retired-model');

    // First call triggers 404 -> logs once & marks model unavailable
    const res1 = await client.complete({
      system: 'system',
      prompt: 'hello',
      maxTokens: 100,
      timeoutMs: 2000,
    });
    expect(res1).toBeNull();
    expect(isLlmModelUnavailable()).toBe(true);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // Second call skips fetch and does NOT log again
    const res2 = await client.complete({
      system: 'system',
      prompt: 'hello again',
      maxTokens: 100,
      timeoutMs: 2000,
    });
    expect(res2).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    // /api/ready must now report llm: false
    const readyRes = readyGet(new NextRequest('http://localhost/api/ready'));
    expect(readyRes.status).toBe(200);
    const body = (await readyRes.json()) as { status: string; llm: boolean };
    expect(body.llm).toBe(false);
  });
});
