import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fetchOpenMeteoSnapshot } from '@/server/providers/openMeteoAirQuality';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { boundaryError, RATE_LIMITS } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.airQualityPerMinute,
  60_000,
  new MemoryBucketStore()
);
const QuerySchema = z.object({
  lat: z
    .string()
    .regex(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/)
    .transform(Number)
    .pipe(z.number().min(-90).max(90)),
  lon: z
    .string()
    .regex(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/)
    .transform(Number)
    .pipe(z.number().min(-180).max(180)),
});

export async function handleAirQuality(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    lat: url.searchParams.get('lat'),
    lon: url.searchParams.get('lon'),
  });
  if (!parsed.success) {
    return apiErrorResponse(
      boundaryError('VALIDATION_ERROR', 'Invalid coordinates', requestId, 400).error,
      400
    );
  }
  try {
    const snapshot = await fetchOpenMeteoSnapshot(parsed.data.lat, parsed.data.lon);
    return securityJson(
      {
        aqi: snapshot.aqi,
        pm25: snapshot.pm25,
        timestamp: snapshot.timestamp,
        source: snapshot.provider,
        isFallback: snapshot.isFallback,
        isStale: snapshot.isStale,
        band: snapshot.band,
      },
      200,
      { [REQUEST_ID_HEADER]: requestId }
    );
  } catch {
    return apiErrorResponse(
      boundaryError('PROVIDER_UNAVAILABLE', 'Live air-quality data is unavailable', requestId, 503)
        .error,
      503
    );
  }
}

function rateLimited(requestId: string, seconds: number) {
  const error = boundaryError('RATE_LIMITED', 'Rate limit exceeded', requestId, 429).error;
  return apiErrorResponse(error, 429, { 'Retry-After': String(seconds) });
}
