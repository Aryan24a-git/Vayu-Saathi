// Satisfies: REQ-009, REQ-010, SEC-004, PERF-003, D6
// Grounded plan generator: combines rules engine candidate actions with optional LLM narrative.

import type { Profile } from '../../domain/profile';
import type { AqiBand } from '../../domain/aqi-bands';
import { assemblePlan } from '../../domain/rules-engine';
import catalogData from '../../catalog/catalog.json';
import type { Action } from '../../catalog/catalog.schema';
import { generateContent } from './client';
import { PlanOutputSchema, containsPromptInjection } from './guardrails';
import { logger } from '../logger';

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

  const prompt = JSON.stringify({
    aqiBand: band.label,
    escalationLevel,
    vulnerabilities: profile.members.flatMap((m) => m.vulnerabilityFlags),
    housingType: profile.housingType,
    budgetBand: profile.budgetBand,
    allowedActionIds: candidateIds,
  });

  const sysInstruction =
    'You are Clear Air Companion. Select only from allowedActionIds. ' +
    'Provide output JSON with: narrative (string), selectedActionIds (array of strings from allowedActionIds), keyAdvice (string).';

  let narrative = buildDeterministicNarrative(band, escalationLevel);
  let keyAdvice = 'Stay indoors when possible and check updates regularly.';
  let isFallback = true;
  let finalActions = eligibleActions;

  try {
    const rawAi = await generateContent(sysInstruction, prompt);
    if (rawAi && !containsPromptInjection(rawAi)) {
      const parsed = PlanOutputSchema.safeParse(JSON.parse(rawAi));
      if (parsed.success) {
        // Enforce grounding: verify all selected IDs are strictly in allowed candidate IDs
        const validIds = parsed.data.selectedActionIds.filter((id) => candidateIds.includes(id));
        if (validIds.length > 0) {
          narrative = parsed.data.narrative;
          keyAdvice = parsed.data.keyAdvice;
          finalActions = catalog.filter((a) => validIds.includes(a.id));
          isFallback = false;
        }
      }
    }
  } catch (err) {
    logger.warn('LLM planning failed, using deterministic fallback', {
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
