// Satisfies: REQ-016
// Community what-if calculator — pure functions, no I/O

import type { Impact } from '../catalog/catalog.schema';
import { calculateCommunityImpact } from './impact-model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityCalcInput {
  householdCount: number;
  actionId: string;
  impact: Impact;
  adoptionRateLow?: number;
  adoptionRateHigh?: number;
}

export interface CommunityCalcResult {
  actionId: string;
  householdCount: number;
  estimatedParticipants: { low: number; high: number };
  projectedEffect: { low: number; high: number; unit: string };
  narrative: string;
  confidence: 'high' | 'medium' | 'low';
  caveat: string;
}

// ─── Pure Functions ───────────────────────────────────────────────────────────

const CAVEAT =
  'Community projections use modeled adoption rates (20–40%) and may not reflect actual uptake. ' +
  'Results are illustrative, not predictive.';

/**
 * Calculate the projected impact if N households take an action.
 * Always returns ranges, never point estimates (D4).
 */
export function calculateWhatIf(input: CommunityCalcInput): CommunityCalcResult {
  const { householdCount, actionId, impact, adoptionRateLow = 0.2, adoptionRateHigh = 0.4 } = input;

  if (householdCount < 1 || householdCount > 1_000_000) {
    throw new RangeError('householdCount must be between 1 and 1,000,000');
  }

  const communityImpact = calculateCommunityImpact(
    impact,
    householdCount,
    adoptionRateLow,
    adoptionRateHigh
  );

  const participantsLow = Math.floor(householdCount * adoptionRateLow);
  const participantsHigh = Math.ceil(householdCount * adoptionRateHigh);

  const narrative =
    `If ${householdCount.toLocaleString()} households take this action, ` +
    `an estimated ${participantsLow}–${participantsHigh} are likely to act ` +
    `(based on typical adoption rates of ${Math.round(adoptionRateLow * 100)}–` +
    `${Math.round(adoptionRateHigh * 100)}%). ` +
    communityImpact.description;

  return {
    actionId,
    householdCount,
    estimatedParticipants: { low: participantsLow, high: participantsHigh },
    projectedEffect: {
      low: communityImpact.projectedRangeLow,
      high: communityImpact.projectedRangeHigh,
      unit: communityImpact.unit,
    },
    narrative,
    confidence: communityImpact.confidence,
    caveat: CAVEAT,
  };
}

/** Validate household count for the UI input */
export function validateHouseholdCount(value: number): string | null {
  if (!Number.isInteger(value)) return 'Must be a whole number';
  if (value < 1) return 'Must be at least 1 household';
  if (value > 1_000_000) return 'Maximum 1,000,000 households';
  return null;
}
