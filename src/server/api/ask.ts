import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createDefaultProfile, ProfileSchema } from '@/domain/profile';
import { buildBasicPlan } from '@/domain/plan';
import { ask } from '@/server/llm/ask';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { RATE_LIMITS, readJsonBoundary, MAX_QUESTION_LENGTH } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(RATE_LIMITS.askPerMinute, 60_000, new MemoryBucketStore());
const RequestSchema = z.object({
  question: z.string().trim().min(3).max(MAX_QUESTION_LENGTH),
  profile: ProfileSchema.optional(),
  aqi: z.number().min(0).max(1000).optional().default(175),
  pm25: z.number().min(0).max(1500).optional().default(72),
});

export async function handleAsk(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);
  const parsed = await readJsonBoundary(req, RequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);
  const now = new Date();
  const profile = parsed.value.profile ?? createDefaultProfile();
  const snapshot = {
    aqi: parsed.value.aqi ?? 175,
    pm25: parsed.value.pm25 ?? 72,
    timestamp: now.toISOString(),
    provider: 'Basic context',
    isStale: false,
    isFallback: false,
  };
  const plan = buildBasicPlan(profile, snapshot, now);
  const answer = await ask(parsed.value.question, profile, plan);
  return securityJson(answer, 200, { [REQUEST_ID_HEADER]: requestId });
}

function rateLimited(requestId: string, seconds: number) {
  return apiErrorResponse(
    {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded',
      requestId,
      timestamp: new Date().toISOString(),
    },
    429,
    { 'Retry-After': String(seconds) }
  );
}
