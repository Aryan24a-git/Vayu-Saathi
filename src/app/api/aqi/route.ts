// Satisfies: REQ-003, SEC-001, SEC-003
// GET /api/aqi?lat=...&lon=...

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchCurrentAqi } from '@/lib/providers/aqi';
import { RateLimiter, getClientIp } from '@/lib/rate-limit';

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const aqiRateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = aqiRateLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided' },
      { status: 400 }
    );
  }

  const reading = await fetchCurrentAqi(parsed.data.lat, parsed.data.lon);
  return NextResponse.json(reading);
}
