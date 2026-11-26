import { NextRequest } from 'next/server';
import { z } from 'zod';
import { buildDeterministicPlaybook } from '@/domain/playbookEngine';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { RATE_LIMITS, readJsonBoundary } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.playbookPerMinute,
  60_000,
  new MemoryBucketStore()
);

const CpcbBandSchema = z.object({
  max: z.number(),
  label: z.string(),
  color: z.string(),
  softBg: z.string(),
  border: z.string(),
  note: z.string(),
});

const NaqiResultSchema = z.object({
  naqi: z.number(),
  dominant: z.enum(['PM2.5', 'PM10', 'NO₂']),
  band: CpcbBandSchema,
  cigsPerDay: z.number(),
  subIndices: z.object({
    subPM25: z.number(),
    subPM10: z.number(),
    subNO2: z.number(),
  }),
});

const CalculatedImpactSchema = z.object({
  aqi: NaqiResultSchema,
  km: z.number(),
  commuteCo2Kg: z.number(),
  totalCo2Kg: z.number(),
  totalNoxG: z.number(),
  commuteSwapLabel: z.string(),
  maxExposureDropPct: z.number(),
  maxCigsAvoided: z.number(),
});

const PlaybookRequestSchema = z.object({
  location: z.object({
    id: z.string(),
    city: z.string(),
    shortCity: z.string(),
    subtitle: z.string(),
    sourceLabel: z.string(),
    pm25: z.number(),
    pm10: z.number(),
    no2: z.number(),
    wind: z.number(),
    basePledges: z.number(),
    baseCo2Kg: z.number(),
    hourlyPM25: z.array(z.number()),
    hourlyWind: z.array(z.number()),
  }),
  profile: z.object({
    vulnerabilities: z.array(z.enum(['kids', 'seniors', 'asthma', 'none'])),
    purifier: z.enum(['none', 'one_room', 'whole_home']),
    kitchenExhaust: z.boolean(),
    commuteMode: z.enum(['solo_car', 'two_wheeler', 'public_transit', 'wfh']),
    commuteKm: z.number(),
    budgetTier: z.enum(['zero_cost', 'diy_2000', 'paid_upgrades']),
  }),
  vent: z.object({
    startHour: z.number(),
    endHour: z.number(),
    windowLabel: z.string(),
    sealHour: z.number(),
    sealLabel: z.string(),
    avgWindowPM: z.number(),
    avgWindowWind: z.number(),
  }),
  impact: CalculatedImpactSchema,
});

export async function handlePlaybook(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);

  const parsed = await readJsonBoundary(req, PlaybookRequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);

  const { location, profile, vent, impact } = parsed.value;
  const playbook = buildDeterministicPlaybook(location, profile, vent, impact);

  return securityJson(
    {
      playbook,
      source: 'Grounded VayuSaathi AI Engine',
      generatedAt: new Date().toISOString(),
    },
    200,
    { [REQUEST_ID_HEADER]: requestId }
  );
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
