// Satisfies: REQ-011, SEC-001, SEC-003, SEC-004, D5
// POST /api/followup (Bounded air quality Q&A)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { containsPromptInjection, isAirQualityRelated, sanitizeInput } from '@/lib/ai/guardrails';
import { generateContent } from '@/lib/ai/client';
import { RateLimiter, getClientIp } from '@/lib/rate-limit';

const RequestSchema = z.object({
  question: z.string().min(3).max(300),
});

const followupLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000,
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = followupLimiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
  }

  const rawQ = parsed.data.question;
  if (containsPromptInjection(rawQ)) {
    return NextResponse.json(
      { answer: 'I can only assist with air quality and pollution safety questions.' },
      { status: 200 }
    );
  }

  if (!isAirQualityRelated(rawQ)) {
    return NextResponse.json(
      {
        answer:
          'This assistant only answers questions regarding winter smog, air pollution, and indoor air safety.',
      },
      { status: 200 }
    );
  }

  const cleanQ = sanitizeInput(rawQ);
  const sysPrompt =
    'You are Clear Air Companion. Answer user question about air pollution concisely (under 3 sentences). ' +
    'Never provide medical diagnosis or medication prescription. Remind them to seek emergency care for severe symptoms.';

  let answer =
    'During high pollution days, keep windows sealed during peak smog, run purifiers in closed rooms, and wear an N95 mask outdoors.';

  const aiResp = await generateContent(sysPrompt, cleanQ);
  if (aiResp && typeof aiResp === 'string') {
    answer = aiResp;
  }

  return NextResponse.json({
    answer,
    disclaimer: 'Informational only. Not medical advice.',
  });
}
