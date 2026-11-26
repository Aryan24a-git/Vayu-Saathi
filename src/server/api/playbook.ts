import { NextRequest } from 'next/server';
import { z } from 'zod';
import { buildDeterministicPlaybook, type PlaybookData } from '@/domain/playbookEngine';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { RATE_LIMITS, readJsonBoundary } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';
import { createLlmClient, stripMarkdownCodeFences } from '@/server/llm/client';

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
    hourlyPM25: z.array(z.number()),
    hourlyWind: z.array(z.number()),
    hourlyError: z.string().optional(),
  }),
  profile: z.object({
    vulnerabilities: z.array(z.enum(['kids', 'seniors', 'asthma', 'none'])),
    purifier: z.enum(['none', 'one_room', 'whole_home']),
    kitchenExhaust: z.boolean(),
    commuteMode: z.enum(['solo_car', 'two_wheeler', 'public_transit', 'wfh']),
    commuteKm: z.number(),
    budgetTier: z.enum(['zero_cost', 'diy_2000', 'paid_upgrades']),
  }),
  vent: z
    .object({
      startHour: z.number(),
      endHour: z.number(),
      windowLabel: z.string(),
      sealHour: z.number(),
      sealLabel: z.string(),
      avgWindowPM: z.number(),
      avgWindowWind: z.number(),
    })
    .nullable()
    .optional()
    .default(null),
  impact: CalculatedImpactSchema,
});

const AiPlaybookResponseSchema = z.object({
  aiSummary: z.string().min(10).max(350).optional(),
  explainer: z.object({
    healthWhy: z.string().min(10).max(450),
    emissionWhy: z.string().min(10).max(450),
    vulnerabilityNote: z.string().min(10).max(450),
  }),
  customizedHacks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(120),
        detail: z.string().min(10).max(350),
        tag: z.string().min(2).max(40),
      })
    )
    .optional(),
});

type CustomHack = { id: string; title: string; detail: string; tag: string };

function applyCustomHacks(playbook: PlaybookData, hacks: CustomHack[]): void {
  const map = new Map(hacks.map((h) => [h.id, h]));
  const patch = (item: (typeof playbook.iaqHacks)[number]) => {
    const c = map.get(item.id);
    if (!c) return item;
    return {
      ...item,
      title: c.title,
      detail: c.detail,
      tag: c.tag.startsWith('AI') ? c.tag : `AI · ${c.tag}`,
    };
  };
  playbook.iaqHacks = playbook.iaqHacks.map(patch);
  playbook.emissionSwaps = playbook.emissionSwaps.map(patch);
}

async function enhancePlaybookWithAi(
  playbook: PlaybookData,
  location: { city: string; pm25: number; pm10: number },
  profile: { vulnerabilities: string[]; budgetTier: string; commuteMode: string }
): Promise<'ai' | 'basic'> {
  const actions = [...playbook.iaqHacks, ...playbook.emissionSwaps].map((h) => ({
    id: h.id,
    title: h.title,
    detail: h.detail,
    tag: h.tag,
  }));
  const raw = await createLlmClient().complete({
    system:
      'Personalize the user daily smog playbook in supportive English/Hinglish-friendly tone. Customize the action item details and tags with practical advice tailored to their city air conditions, family vulnerabilities, and budget. Provide a 1-sentence aiSummary and the 3 explainer fields. Keep all numeric values unchanged, give zero medical diagnosis/prescriptions, and include no URLs or HTML. Return strictly JSON: {"aiSummary": string, "explainer": {"healthWhy", "emissionWhy", "vulnerabilityNote"}, "customizedHacks": [{"id", "title", "detail", "tag"}]}.',
    prompt: `<context>City: ${location.city}, PM2.5: ${location.pm25}, PM10: ${location.pm10}. Vulnerabilities: ${profile.vulnerabilities.join(', ')}. Budget: ${profile.budgetTier}. Commute: ${profile.commuteMode}.</context><actions>${JSON.stringify(actions)}</actions><explainer>${JSON.stringify(playbook.explainer)}</explainer>`,
    maxTokens: 750,
    timeoutMs: 12_000,
    jsonMode: true,
  });
  if (!raw) return 'basic';
  try {
    const parsed = AiPlaybookResponseSchema.safeParse(JSON.parse(stripMarkdownCodeFences(raw)));
    if (!parsed.success) return 'basic';
    const joined = JSON.stringify(parsed.data).toLowerCase();
    if (/https?:\/\/|www\.|<[^>]+>|prescrib|diagnos|aspirin|dosage/.test(joined)) return 'basic';
    if (parsed.data.aiSummary) playbook.aiSummary = parsed.data.aiSummary;
    playbook.explainer = parsed.data.explainer;
    playbook.generatedAt = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (parsed.data.customizedHacks) applyCustomHacks(playbook, parsed.data.customizedHacks);
    return 'ai';
  } catch {
    return 'basic';
  }
}

export async function handlePlaybook(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) return rateLimited(requestId, limit.retryAfterSeconds);

  const parsed = await readJsonBoundary(req, PlaybookRequestSchema, requestId);
  if (!parsed.ok) return apiErrorResponse(parsed.error, parsed.status);

  const { location, profile, vent, impact } = parsed.value;
  const playbook = buildDeterministicPlaybook(location, profile, vent ?? null, impact);
  const source = await enhancePlaybookWithAi(playbook, location, profile);

  return securityJson(
    {
      playbook,
      source,
      sourceLabel: source === 'ai' ? 'Gemini Grounded AI' : 'Smart Local Engine (Basic mode)',
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
