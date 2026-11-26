import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  TokenBucketLimiter,
  MemoryBucketStore,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { RATE_LIMITS, readJsonBoundary } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';
import { narrate, type NarrativeItem } from '@/server/llm/narrate';
import { ProfileSchema, createDefaultProfile } from '@/domain/profile';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.planNarratePerMinute,
  60_000,
  new MemoryBucketStore()
);

const NarrateRequestSchema = z.object({
  profile: ProfileSchema.optional(),
  band: z.string().min(2).max(50),
  pm25: z.number().min(0).max(1500),
  items: z
    .array(
      z.object({
        id: z.string().min(2).max(50),
        rangeText: z.string().min(1).max(200),
      })
    )
    .min(1)
    .max(20),
});

export async function handlePlanNarrate(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) {
    return apiErrorResponse(
      {
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Please wait before requesting new AI plan narration.',
        requestId,
        timestamp: new Date().toISOString(),
      },
      429,
      { 'Retry-After': String(limit.retryAfterSeconds) }
    );
  }

  const parsed = await readJsonBoundary(req, NarrateRequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);

  const profile = parsed.value.profile ?? createDefaultProfile();
  const result = await narrate(
    profile,
    parsed.value.band,
    parsed.value.pm25,
    parsed.value.items as readonly NarrativeItem[]
  );

  return securityJson(
    {
      status: 'success',
      narrative: result.narrative,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason,
      source: result.isFallback ? ('basic' as const) : ('ai' as const),
      sourceLabel: result.isFallback
        ? 'Deterministic Plan Copy (Basic Mode)'
        : 'Gemini Grounded Narration',
    },
    200,
    { [REQUEST_ID_HEADER]: requestId }
  );
}
