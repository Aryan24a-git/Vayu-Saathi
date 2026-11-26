'use client';

import { useEffect, useRef, useState } from 'react';
import catalogData from '@/catalog/catalog.json';
import type { Action } from '@/catalog/catalog.schema';
import type { Profile } from '@/domain/profile';
import type { AqiReading } from '@/domain/aqi-bands';

export type PlanState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'validation'
  | 'rate_limited'
  | 'provider_down'
  | 'llm_down'
  | 'offline';

export interface NormalizedPlanItem {
  action: Action;
  priority: number;
  optional: boolean;
  explanationRange: string;
  timeOfDay: string;
}

export interface NormalizedPlan {
  headline: string;
  effectiveBandLabel: string;
  isFallback: boolean;
  isOfflineCache: boolean;
  generatedAt: string;
  source: string;
  routineWindow: string | null;
  routine: readonly NormalizedPlanItem[];
  indoors: readonly NormalizedPlanItem[];
  alternatives: readonly NormalizedPlanItem[];
  redFlagCopy: string;
  candidateActionIds: readonly string[];
  medicalDisclaimerText?: string;
}

const actions = catalogData.actions as readonly Action[];
const CACHE_KEY = 'cac_last_plan_v1';

export function usePlan(profile: Profile, reading: AqiReading) {
  const [state, setState] = useState<PlanState>('idle');
  const [plan, setPlan] = useState<NormalizedPlan | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState('offline');
      setPlan(readCachedPlan());
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('loading');
    void fetchPlan(profile, reading, controller.signal).then((result) => {
      setRetryAfter(result.retryAfter);
      setPlan(result.plan);
      setState(result.state);
      if (result.plan) writeCachedPlan(result.plan);
    });
    return () => controller.abort();
  }, [profile, reading]);

  return { state, plan, retryAfter, abort: () => abortRef.current?.abort() };
}

async function fetchPlan(
  profile: Profile,
  reading: AqiReading,
  signal: AbortSignal
): Promise<{ state: PlanState; plan: NormalizedPlan | null; retryAfter: number }> {
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, aqi: reading.aqi, pm25: reading.pm25, mode: 'live' }),
      signal,
    });
    if (response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After') ?? '60');
      return { state: 'rate_limited', plan: readCachedPlan(), retryAfter: seconds };
    }
    if (response.status === 503) {
      return { state: 'provider_down', plan: readCachedPlan(), retryAfter: 0 };
    }
    if (response.status === 400) {
      return { state: 'validation', plan: readCachedPlan(), retryAfter: 0 };
    }
    if (!response.ok) {
      return { state: 'llm_down', plan: readCachedPlan(), retryAfter: 0 };
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw)) throw new Error('Invalid plan response');
    const plan = normalizePlan(raw, reading);
    return { state: plan.isFallback ? 'llm_down' : 'success', plan, retryAfter: 0 };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { state: 'idle', plan: null, retryAfter: 0 };
    }
    return { state: 'offline', plan: readCachedPlan(), retryAfter: 0 };
  }
}

function normalizePlan(raw: Record<string, unknown>, reading: AqiReading): NormalizedPlan {
  const catalogIds = Array.isArray(raw['candidateActionIds'])
    ? raw['candidateActionIds'].filter((id): id is string => typeof id === 'string')
    : Array.isArray(raw['actions'])
      ? raw['actions']
          .filter(isRecord)
          .map((action) => String(action['id']))
          .filter(Boolean)
      : [];
  const routineIds = Array.isArray(raw['routine'])
    ? raw['routine'].filter(isRecord).map((item) => String(item['actionId']))
    : [];
  const indoorIds = Array.isArray(raw['indoors'])
    ? raw['indoors'].filter(isRecord).map((item) => String(item['actionId']))
    : [];
  const alternativeIds = Array.isArray(raw['alternatives'])
    ? raw['alternatives'].filter(isRecord).map((item) => String(item['actionId']))
    : [];
  const groupIds = {
    routine: routineIds.length
      ? routineIds
      : catalogIds.filter((id) => findAction(id)?.category === 'routine'),
    indoors: indoorIds.length
      ? indoorIds
      : catalogIds.filter((id) => findAction(id)?.category === 'indoor'),
    alternatives: alternativeIds.length
      ? alternativeIds
      : catalogIds.filter((id) => findAction(id)?.category === 'alternative'),
  };
  return {
    headline:
      typeof raw['headline'] === 'string'
        ? raw['headline']
        : typeof raw['narrative'] === 'string'
          ? raw['narrative']
          : `Protective plan for ${reading.aqi} AQI`,
    effectiveBandLabel:
      typeof raw['effectiveBandLabel'] === 'string'
        ? raw['effectiveBandLabel']
        : 'Current air quality',
    isFallback: raw['isFallback'] === true,
    isOfflineCache: false,
    generatedAt: typeof raw['generatedAt'] === 'string' ? raw['generatedAt'] : reading.timestamp,
    source: reading.source,
    routineWindow: typeof raw['routineWindow'] === 'string' ? raw['routineWindow'] : null,
    routine: toItems(groupIds.routine, raw),
    indoors: toItems(groupIds.indoors, raw),
    alternatives: toItems(groupIds.alternatives, raw),
    redFlagCopy:
      typeof raw['redFlagCopy'] === 'string'
        ? raw['redFlagCopy']
        : 'Seek immediate medical care for severe breathlessness or chest pain.',
    candidateActionIds: catalogIds,
    medicalDisclaimerText:
      typeof raw['medicalDisclaimer'] === 'string'
        ? raw['medicalDisclaimer']
        : 'Informational only. Not medical advice.',
  };
}

function toItems(
  ids: readonly string[],
  raw: Record<string, unknown>
): readonly NormalizedPlanItem[] {
  return ids
    .map((id, index) => {
      const action = findAction(id);
      if (!action) return null;
      const section = findSectionItem(raw, id);
      return {
        action,
        priority: typeof section?.priority === 'number' ? section.priority : index + 1,
        optional: section?.optional === true,
        explanationRange:
          section?.explanation && isRecord(section.explanation)
            ? String(
                isRecord(section.explanation['impact'])
                  ? (section.explanation['impact']['rangeText'] ?? '')
                  : ''
              )
            : `${action.impact.magnitudeRange.low}–${action.impact.magnitudeRange.high} ${action.impact.magnitudeRange.unit}`,
        timeOfDay: typeof section?.timeOfDay === 'string' ? section.timeOfDay : action.timeOfDay,
      };
    })
    .filter((item): item is NormalizedPlanItem => item !== null);
}

function findSectionItem(raw: Record<string, unknown>, id: string): Record<string, unknown> | null {
  for (const key of ['routine', 'indoors', 'alternatives']) {
    if (!Array.isArray(raw[key])) continue;
    const item = raw[key].filter(isRecord).find((candidate) => candidate['actionId'] === id);
    if (item) return item;
  }
  return null;
}

function findAction(id: string): Action | undefined {
  return actions.find((action) => action.id === id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readCachedPlan(): NormalizedPlan | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as unknown;
    if (!isRecord(raw)) return null;
    return { ...raw, isOfflineCache: true } as NormalizedPlan;
  } catch {
    return null;
  }
}

function writeCachedPlan(plan: NormalizedPlan): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(plan));
  } catch {
    // Private browsing may disable storage.
  }
}
