import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { readJsonBoundary } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';

const limiter = new TokenBucketLimiter(20, 60_000, new MemoryBucketStore());

const BulletinRequestSchema = z.object({
  lang: z.enum(['en', 'hi']),
  rwaName: z.string().trim().max(120),
  city: z.string().trim().min(1).max(120),
  shortCity: z.string().trim().min(1).max(120),
  wind: z.number().min(0).max(150),
  pm25: z.number().min(0).max(1500),
  naqi: z.number().min(0).max(1000),
  bandLabel: z.string().min(1).max(60),
  cigsPerDay: z.number().min(0).max(100),
  windowLabel: z.string().min(1).max(60),
  sealLabel: z.string().min(1).max(60),
});

type BulletinRequest = z.infer<typeof BulletinRequestSchema>;

function formatBulletin(req: BulletinRequest): string {
  const name = req.rwaName || `${req.shortCity} Residents Welfare Group`;
  if (req.lang === 'hi') {
    return (
      `🌿 *${name} — आज का वायु स्वास्थ्य अलर्ट (VayuSaathi)*\n\n` +
      `📍 *क्षेत्र:* ${req.city}\n` +
      `📊 *CPCB NAQI:* *${req.naqi} (${req.bandLabel})* | PM2.5: ${req.pm25} µg/m³\n` +
      `💨 *सुरक्षित वेंटिलेशन समय:* केवल *${req.windowLabel}* के बीच खिड़कियाँ खोलें। शाम *${req.sealLabel}* तक बंद रखें।\n\n` +
      `✅ *आज के 2 सामुदायिक संकल्प:*\n` +
      `1️⃣ *खुले में आग न जलाएँ:* कृपया गार्ड्स व सफाई कर्मियों से अनुरोध करें कि सूखे पत्ते या कचरा न जलाएँ — शांत हवा (${req.wind} km/h) में धुआँ यहीं फँस जाता है।\n` +
      `2️⃣ *कम-उत्सर्जन आवागमन:* आज अकेले कार निकालने के बजाय मेट्रो/कारपूल अपनाएँ और सूखे झाड़ू की जगह गीला पोछा लगाएँ।\n\n` +
      `🤝 आइए मिलकर अपनी कॉलोनी की हवा सुरक्षित रखें!`
    );
  }
  return (
    `🌿 *${name} — Daily Smog & Clean Air Bulletin (VayuSaathi)*\n\n` +
    `📍 *Area:* ${req.city}\n` +
    `📊 *CPCB NAQI:* *${req.naqi} (${req.bandLabel})* | PM2.5: ${req.pm25} µg/m³ (~${req.cigsPerDay} cigs/day eq.)\n` +
    `🪟 *Safe Ventilation Window:* Open windows only during *${req.windowLabel}*. Seal doors/windows by *${req.sealLabel}*.\n\n` +
    `✅ *Today's 2 Community Pledges:*\n` +
    `1️⃣ *Zero Biomass / Leaf Burning:* Please remind society night guards & sweepers not to burn dry leaves or waste tonight — calm ${req.wind} km/h winds trap smoke at breathing level.\n` +
    `2️⃣ *Smarter Commute & Wet Mopping:* Swap solo car runs for Metro/carpool where possible, avoid engine idling at our main gate, and switch from dry sweeping to wet mopping today.\n\n` +
    `🤝 Small coordinated habits cut our colony's local smog together!`
  );
}

export async function handleBulletin(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);

  const parsed = await readJsonBoundary(req, BulletinRequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);

  const bulletinText = formatBulletin(parsed.value);
  return securityJson(
    {
      bulletinText,
      lang: parsed.value.lang,
      source: 'VayuSaathi Community Advisory Engine',
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
