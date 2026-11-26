// Satisfies: TEST-001, NFR-003, DEP-003, SEC-002
import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../src/server/config/env';

describe('Server Environment Configuration', () => {
  it('validates environment with defaults and no LLM key provided', () => {
    const raw = {
      NODE_ENV: 'test',
      APP_ORIGIN: 'http://localhost:3000',
    };
    const env = validateEnv(raw);
    expect(env.NODE_ENV).toBe('test');
    expect(env.RATE_LIMIT_PLAN).toBe(10);
    expect(env.GEMINI_API_KEY).toBeUndefined();
    expect(env.GEMINI_MODEL).toBe('gemini-1.5-flash');
  });

  it('fails fast on invalid values with clear diagnostics', () => {
    const raw = {
      RATE_LIMIT_PLAN: '-5', // invalid: must be positive
    };
    expect(() => validateEnv(raw)).toThrowError(/Environment validation failed/);
  });

  it('correctly accepts optional LLM keys', () => {
    const raw = {
      GEMINI_API_KEY: 'test-gemini-key',
      GEMINI_MODEL: 'gemini-1.5-pro',
      LLM_DAILY_CALL_CAP: '500',
    };
    const env = validateEnv(raw);
    expect(env.GEMINI_API_KEY).toBe('test-gemini-key');
    expect(env.GEMINI_MODEL).toBe('gemini-1.5-pro');
    expect(env.LLM_DAILY_CALL_CAP).toBe(500);
  });
});
