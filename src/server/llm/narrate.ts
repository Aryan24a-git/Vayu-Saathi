import { createHash } from 'node:crypto';
import type { Profile } from '../../domain/profile';
import { LruCache } from '../cache/lru';
import { createLlmClient, stripMarkdownCodeFences, type LlmClient } from './client';
import { DailyCallBudget } from './budget';
import { NARRATION_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts';
import { NarrativeSchema, type NarrativeOutput } from './schema';
import { validateNarrative } from './guardrails';
import { logger } from '../../lib/logger';

const cache = new LruCache<string, NarrativeOutput>({ maxEntries: 100, ttlMs: 60 * 60 * 1000 });
const budget = new DailyCallBudget();

export interface NarrateResult {
  narrative: NarrativeOutput;
  isFallback: boolean;
  fallbackReason?: string;
}

export interface NarrativeItem {
  id: string;
  rangeText: string;
}

export async function narrate(
  profile: Profile,
  band: string,
  pm25: number,
  items: readonly NarrativeItem[],
  client: LlmClient = createLlmClient(),
  now: Date = new Date()
): Promise<NarrateResult> {
  const key = narrativeCacheKey(band, pm25, profile, items);
  const cached = cache.get(key);
  if (cached) return { narrative: cached, isFallback: false };

  if (!budget.tryReserve(now)) {
    return fallback(items, band, 'daily_budget');
  }
  const impacts = new Map<string, readonly string[]>();
  for (const item of items) {
    impacts.set(item.id, extractNumbers(item.rangeText));
  }
  const prompt = JSON.stringify({
    band,
    pm25RoundedTo10: Math.round(pm25 / 10) * 10,
    profileShape: profileShape(profile),
    selectedActions: items,
  });
  const raw = await client.complete({
    system: NARRATION_SYSTEM_PROMPT,
    prompt: `<grounded_data>${prompt}</grounded_data>`,
    maxTokens: 700,
    timeoutMs: 12_000,
    jsonMode: true,
  });
  if (!raw) return fallback(items, band, 'client_failure');
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownCodeFences(raw));
  } catch {
    return fallback(items, band, 'invalid_json');
  }
  const result = validateNarrative(parsed, {
    selectedIds: items.map((item) => item.id),
    impacts,
  });
  if (!result.ok) return fallback(items, band, result.reason);
  cache.set(key, result.value);
  return { narrative: result.value, isFallback: false };
}

export function narrativeCacheKey(
  band: string,
  pm25: number,
  profile: Profile,
  items: readonly NarrativeItem[]
): string {
  const payload = JSON.stringify({
    band,
    pm25: Math.round(pm25 / 10) * 10,
    profileShape: profileShape(profile),
    actionIds: items.map((item) => item.id),
    promptVersion: PROMPT_VERSION,
  });
  return createHash('sha256').update(payload).digest('hex');
}

export function clearNarrativeCache(): void {
  cache.clear();
}

function profileShape(profile: Profile): object {
  return {
    memberCount: profile.members.length,
    ageBands: profile.members.map((member) => member.ageBand).sort(),
    sensitivityFlags: [
      ...new Set(profile.members.flatMap((member) => member.vulnerabilityFlags)),
    ].sort(),
    housing: profile.housingType,
    cookingFuel: profile.cookingFuel,
    heating: profile.heatingType,
    budget: profile.budgetBand,
  };
}

function extractNumbers(text: string): readonly string[] {
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

function fallback(items: readonly NarrativeItem[], band: string, reason: string): NarrateResult {
  logger.warn('llmFallback', { fallbackReason: reason });
  const narrative: NarrativeOutput = {
    headline: `Protective plan for ${band}`,
    itemNotes: items.map((item) => ({
      id: item.id,
      why: 'This action was selected for the current air-quality risk.',
      tip: 'Follow the catalog feasibility guidance.',
    })),
    closing: 'Check official local guidance and seek medical care for severe symptoms.',
  };
  return { narrative, isFallback: true, fallbackReason: reason };
}
