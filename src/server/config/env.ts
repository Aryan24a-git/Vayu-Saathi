// Satisfies: NFR-003, SEC-002, DEP-003, EC-001
// Server configuration with strict Zod validation and fail-fast behavior.
// LLM keys are completely optional (enabling deterministic fallback).

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { RATE_LIMITS } from '../security/limits';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_ORIGIN: z.string().default('http://localhost:3000'),

  AQ_PROVIDER: z.string().default('open-meteo'),

  RATE_LIMIT_PLAN: z.coerce.number().int().positive().default(RATE_LIMITS.planPerMinute),
  RATE_LIMIT_AQI: z.coerce.number().int().positive().default(RATE_LIMITS.airQualityPerMinute),
  RATE_LIMIT_GEOCODE: z.coerce.number().int().positive().default(RATE_LIMITS.geocodePerMinute),
  TRUSTED_PROXY_HEADER: z.string().min(1).max(100).default('x-forwarded-for'),
  CLIENT_IP_SALT: z.string().min(16).default(randomUUID()),

  // Optional LLM configuration (Gemini)
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default(DEFAULT_GEMINI_MODEL),
  LLM_ENABLED: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .or(z.boolean())
    .default(true),
  LLM_DAILY_CALL_CAP: z.coerce.number().int().positive().default(1000),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(raw: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}
