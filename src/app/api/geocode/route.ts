// Satisfies: REQ-001, SEC-001, SEC-003
// GET /api/geocode?q=...

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchCities } from '@/lib/providers/geocoding';
import { RateLimiter, getClientIp } from '@/lib/rate-limit';

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
});

const geocodeLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = geocodeLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ q: searchParams.get('q') });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Query must be between 2 and 100 characters' },
      { status: 400 }
    );
  }

  const results = await searchCities(parsed.data.q);
  return NextResponse.json(results);
}
