// Satisfies: REQ-009, REQ-010, SEC-004, PERF-003, D6
// Grounded plan generator: combines rules engine candidate actions with optional LLM narrative.

import type { Profile } from '../../domain/profile';
import type { AqiBand } from '../../domain/aqi-bands';
import { assemblePlan } from '../../domain/rules-engine';
import catalogData from '../../catalog/catalog.json';
import type { Action } from '../../catalog/catalog.schema';
import { logger } from '../logger';
import { narrate } from '../../server/llm/narrate';
import { buildBasicPlan } from '../../domain/plan';
import type { AirQualitySnapshot } from '../../domain/types';

const catalog = catalogData.actions as readonly Action[];

export interface GeneratedPlan {
  escalationLevel: number;
  effectiveBandLabel: string;
  hasRedFlag: boolean;
  medicalDisclaimer: string;
  narrative: string;
  keyAdvice: string;
  actions: Action[];
  isFallback: boolean;
}

function buildDeterministicNarrative(band: AqiBand, level: number): string {
  if (level >= 5) {
    return `Winter smog has reached ${band.label} levels. Prioritize keeping outdoor air out and protecting vulnerable family members.`;
  }
  if (level >= 3) {
    return `Air quality is ${band.label}. Minimize outdoor exposure during peak morning and evening hours.`;
  }
  return `Air quality is currently ${band.label}. Follow regular air quality precautions and stay informed.`;
}

export async function generatePersonalizedPlan(
  profile: Profile,
  band: AqiBand,
  escalationLevel: number
): Promise<GeneratedPlan> {
  const basePlan = assemblePlan(profile, band, escalationLevel, catalog);
  const candidateIds = basePlan.candidateActions.map((c) => c.actionId);
  const eligibleActions = catalog.filter((a) => candidateIds.includes(a.id));

  let narrative = buildDeterministicNarrative(band, escalationLevel);
  let keyAdvice = 'Stay indoors when possible and check updates regularly.';
  let isFallback = true;
  let finalActions = eligibleActions;

  try {
    const now = new Date();
    const snapshot: AirQualitySnapshot = {
      aqi: band.aqiMin,
      pm25: band.pm25Min,
      timestamp: now.toISOString(),
      provider: 'Deterministic plan',
      isStale: false,
      isFallback: false,
    };
    const basic = buildBasicPlan(profile, snapshot, now);
    const items = [...basic.routine, ...basic.indoors, ...basic.alternatives].map((item) => ({
      id: item.actionId,
      rangeText: item.explanation.impact.rangeText,
    }));
    const result = await narrate(profile, band.label, snapshot.pm25, items);
    if (!result.isFallback) {
      narrative = result.narrative.headline;
      keyAdvice = result.narrative.itemNotes.map((note) => `${note.id}: ${note.tip}`).join(' ');
      isFallback = false;
    } else {
      logger.warn('LLM planning failed, using deterministic fallback', {
        counter: 'fallbackRate',
        fallbackReason: result.fallbackReason,
      });
    }
  } catch (err) {
    logger.warn('LLM planning failed, using deterministic fallback', {
      counter: 'fallbackRate',
      err: String(err),
    });
  }

  return {
    escalationLevel: basePlan.escalationLevel,
    effectiveBandLabel: basePlan.effectiveBandLabel,
    hasRedFlag: basePlan.hasRedFlag,
    medicalDisclaimer: basePlan.medicalDisclaimer,
    narrative,
    keyAdvice,
    actions: finalActions,
    isFallback,
  };
}
