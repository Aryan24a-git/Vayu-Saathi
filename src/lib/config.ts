// Satisfies: NFR-003, SEC-002, DEP-003
// 12-factor config: validated env at boot.
// Server-side only — never import in client components.

import { z } from 'zod';

const envSchema = z.object({
  // LLM
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  LLM_DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(1_000_000),
  LLM_MAX_TOKENS_PER_PLAN: z.coerce.number().int().positive().default(2048),

  // Cache
  AQI_CACHE_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  AQI_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
  LLM_CACHE_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  LLM_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(100),
  GEOCODE_CACHE_TTL_HOURS: z.coerce.number().int().positive().default(24),
  GEOCODE_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(200),

  // Rate limits
  RATE_LIMIT_PLAN_PER_MINUTE: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AQI_PER_MINUTE: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_GEOCODE_PER_MINUTE: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_FOLLOWUP_PER_MINUTE: z.coerce.number().int().positive().default(20),

  // Provider timeouts
  AQI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  AQI_PROVIDER_RETRY_COUNT: z.coerce.number().int().min(0).max(5).default(2),
  LLM_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

let _config: AppConfig | null = null;

/** Parse and validate environment. */
export function getConfig(): AppConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }

  _config = result.data;
  return _config;
}

/** Check if Gemini API key is configured */
export function hasLlmKey(): boolean {
  const apiKey = process.env['GEMINI_API_KEY'];
  return Boolean(apiKey && apiKey.trim().length > 0);
}
