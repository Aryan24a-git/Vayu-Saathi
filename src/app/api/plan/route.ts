// Satisfies: REQ-004, REQ-005, REQ-007, REQ-009, REQ-010, SEC-001, SEC-003, D1, D6
// POST /api/plan

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProfileSchema } from '@/domain/profile';
import { classifyAqi, computeEffectiveEscalationLevel } from '@/domain/aqi-bands';
import { generatePersonalizedPlan } from '@/lib/ai/planner';
import { RateLimiter, getClientIp } from '@/lib/rate-limit';

const RequestSchema = z.object({
  profile: ProfileSchema,
  aqi: z.number().min(0).max(1000),
});

const planRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = planRateLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { profile, aqi } = parsed.data;
  const band = classifyAqi(aqi);
  const escalation = computeEffectiveEscalationLevel(band, profile);

  const plan = await generatePersonalizedPlan(profile, band, escalation);
  return NextResponse.json(plan);
}
