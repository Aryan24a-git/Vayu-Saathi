import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  ProfileSchema,
  ProfileV2Schema,
  migrateProfile,
  createDefaultProfile,
} from '@/domain/profile';
import { classifyAqi, computeEffectiveEscalationLevel } from '@/domain/aqi-bands';
import { buildBasicPlan } from '@/domain/plan';
import { generatePersonalizedPlan } from '@/lib/ai/planner';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { readJsonBoundary } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(6, 60_000, new MemoryBucketStore());
const SnapshotSchema = z.object({
  aqi: z.number().min(0).max(1000),
  pm25: z.number().min(0).max(1500).optional(),
  timestamp: z.string().optional(),
  provider: z.string().optional(),
  isStale: z.boolean().optional(),
  isFallback: z.boolean().optional(),
});

const RequestSchema = z.object({
  profile: z.union([ProfileSchema, ProfileV2Schema]).optional(),
  aqi: z.number().min(0).max(1000).optional(),
  pm25: z.number().min(0).max(1500).optional(),
  snapshot: SnapshotSchema.optional(),
  mode: z.enum(['live', 'basic']).optional().default('live'),
});

export async function handlePlan(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);
  const parsed = await readJsonBoundary(req, RequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);

  const profile =
    (parsed.value.profile ? migrateProfile(parsed.value.profile) : null) ?? createDefaultProfile();
  const aqiVal = parsed.value.aqi ?? parsed.value.snapshot?.aqi ?? 200;
  const pm25Val = parsed.value.pm25 ?? parsed.value.snapshot?.pm25;
  const now = new Date();
  const band = classifyAqi(aqiVal);

  if (parsed.value.mode === 'basic') {
    const snapshot = {
      aqi: aqiVal,
      pm25: pm25Val ?? band.pm25Min,
      timestamp: now.toISOString(),
      provider: 'Deterministic rules',
      isStale: false,
      isFallback: false,
    };
    const plan = buildBasicPlan(profile, snapshot, now);
    return securityJson(
      { ...plan, actions: [...plan.routine, ...plan.indoors, ...plan.alternatives] },
      200,
      { [REQUEST_ID_HEADER]: requestId }
    );
  }

  try {
    const escalation = computeEffectiveEscalationLevel(band, profile);
    const plan = await generatePersonalizedPlan(profile, band, escalation);
    return securityJson(plan, 200, { [REQUEST_ID_HEADER]: requestId });
  } catch {
    return apiErrorResponse(internalError(requestId), 503);
  }
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

function internalError(requestId: string) {
  return {
    code: 'INTERNAL_ERROR',
    message: 'Plan generation is temporarily unavailable',
    requestId,
    timestamp: new Date().toISOString(),
  };
}
