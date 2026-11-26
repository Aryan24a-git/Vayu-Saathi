import { NextRequest } from 'next/server';
import { z } from 'zod';
import { searchOpenMeteo } from '@/server/providers/geocoding';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { boundaryError, MAX_QUERY_LENGTH, RATE_LIMITS } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.geocodePerMinute,
  60_000,
  new MemoryBucketStore()
);
const QuerySchema = z.object({ q: z.string().trim().min(2).max(MAX_QUERY_LENGTH) });

export async function handleGeocode(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) {
    return rateLimited(requestId, limit.retryAfterSeconds);
  }
  const parsed = QuerySchema.safeParse({ q: new URL(req.url).searchParams.get('q') });
  if (!parsed.success) {
    return apiErrorResponse(
      boundaryError('VALIDATION_ERROR', 'Invalid city query', requestId, 400).error,
      400
    );
  }
  const results = await searchOpenMeteo(parsed.data.q).catch(() => []);
  return securityJson(results, 200, { [REQUEST_ID_HEADER]: requestId });
}

function rateLimited(requestId: string, seconds: number) {
  const error = boundaryError('RATE_LIMITED', 'Rate limit exceeded', requestId, 429).error;
  return apiErrorResponse(error, 429, { 'Retry-After': String(seconds) });
}
