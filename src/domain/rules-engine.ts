// Satisfies: REQ-004, REQ-005, REQ-006, REQ-008, REQ-010, D1, D2, D3
// Rules engine: plan assembly, escalation, budget filter — pure functions, no I/O

import type { Profile } from './profile';
import { getAllVulnerabilityFlags } from './profile';
import type { AqiBand } from './aqi-bands';
import { isEmergencyCondition, isHighRiskCondition } from './aqi-bands';
import type { Action } from '../catalog/catalog.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'daytime' | 'evening' | 'night';

export interface PlanAction {
  actionId: string;
  priority: number;
  timeOfDay: string;
  isRedFlag: boolean;
}

export interface Plan {
  escalationLevel: number;
  effectiveBandLabel: string;
  candidateActions: PlanAction[];
  hasRedFlag: boolean;
  medicalDisclaimer: string;
  generatedAt: string;
  isFallback: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_TIER_ORDER = ['free', 'low', 'medium', 'high'] as const;
type BudgetTier = (typeof BUDGET_TIER_ORDER)[number];

const MAX_ACTIONS_PER_PLAN = 10;

const MEDICAL_DISCLAIMER =
  'This app provides information only, not medical advice. ' +
  'Consult a healthcare provider for medical concerns. ' +
  'For breathing difficulties or chest pain, call emergency services immediately.';

// ─── Budget Filtering ─────────────────────────────────────────────────────────

const BUDGET_MAP: Record<Profile['budgetBand'], number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const ACTION_TIER_MAP: Record<Action['budgetTier'], number> = {
  free: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function isAffordable(action: Action, budgetBand: Profile['budgetBand']): boolean {
  return ACTION_TIER_MAP[action.budgetTier] <= BUDGET_MAP[budgetBand];
}

// ─── Relevance Scoring ────────────────────────────────────────────────────────

function scoreAction(action: Action, profile: Profile, escalationLevel: number): number {
  let score = 0;

  // High priority for red flags at high escalation
  if (action.redFlagTrigger && escalationLevel >= 4) score += 100;

  // Escalation match
  if (escalationLevel >= action.minimumEscalationLevel) score += 20;

  // Vulnerability match
  const profileFlags = getAllVulnerabilityFlags(profile);
  for (const flag of action.targetVulnerabilityFlags) {
    if (profileFlags.has(flag)) score += 15;
  }

  // Cooking fuel relevance
  if (action.cookingFuelRelevance.includes(profile.cookingFuel)) score += 10;

  // Housing type relevance
  if (action.targetHousingTypes.includes(profile.housingType)) score += 10;

  return score;
}

// ─── Exclusion Checks ─────────────────────────────────────────────────────────

function isExcluded(action: Action, profile: Profile): boolean {
  for (const condition of action.doNotShowWhen) {
    if (condition === `housing_type:${profile.housingType}`) return true;
    if (condition === `budget:${profile.budgetBand}`) return true;
    if (condition === `cooking_fuel:${profile.cookingFuel}`) return true;
  }
  return false;
}

// ─── Main Plan Assembly ───────────────────────────────────────────────────────

/**
 * Assemble a candidate action list for a given profile + AQI reading.
 * This is the deterministic fallback and the basis for LLM grounding.
 * Pure function — no I/O.
 */
export function assemblePlan(
  profile: Profile,
  effectiveBand: AqiBand,
  escalationLevel: number,
  catalog: readonly Action[],
  now: Date = new Date()
): Plan {
  const profileFlags = getAllVulnerabilityFlags(profile);

  // Filter: escalation range, housing type, budget, exclusions
  const eligible = catalog.filter((action) => {
    if (escalationLevel < action.minimumEscalationLevel) return false;
    if (escalationLevel > action.maximumEscalationLevel) return false;
    if (!action.targetHousingTypes.includes(profile.housingType)) return false;
    if (!isAffordable(action, profile.budgetBand)) return false;
    if (isExcluded(action, profile)) return false;

    // Required vulnerability flags: only show if profile has them
    if (action.requiredVulnerabilityFlags.length > 0) {
      const hasRequired = action.requiredVulnerabilityFlags.every((f) => profileFlags.has(f));
      if (!hasRequired) return false;
    }

    return true;
  });

  // Score and sort
  const scored = eligible
    .map((action) => ({
      action,
      score: scoreAction(action, profile, escalationLevel),
    }))
    .sort((a, b) => b.score - a.score);

  // Red flags always first
  const redFlags = scored.filter((s) => s.action.redFlagTrigger);
  const regular = scored.filter((s) => !s.action.redFlagTrigger);

  const selected = [...redFlags, ...regular.slice(0, MAX_ACTIONS_PER_PLAN - redFlags.length)];

  const candidateActions: PlanAction[] = selected.map((s, index) => ({
    actionId: s.action.id,
    priority: index + 1,
    timeOfDay: s.action.timeOfDay,
    isRedFlag: s.action.redFlagTrigger,
  }));

  return {
    escalationLevel,
    effectiveBandLabel: effectiveBand.label,
    candidateActions,
    hasRedFlag:
      redFlags.length > 0 ||
      isEmergencyCondition(escalationLevel) ||
      (isHighRiskCondition(escalationLevel) && profileFlags.size > 0),
    medicalDisclaimer: MEDICAL_DISCLAIMER,
    generatedAt: now.toISOString(),
    isFallback: false,
  };
}
