// Satisfies: REQ-007, D4, DATA-004
// Impact model: personal exposure vs emissions, ranges, confidence — pure functions

import type { Impact, Confidence, BenefitType } from '../catalog/catalog.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImpactDisplay {
  rangeText: string;
  confidenceLabel: string;
  benefitTypeLabel: string;
  basisSummary: string;
  sourceNote: string;
  disclaimer: string;
}

export interface CommunityImpact {
  householdCount: number;
  actionId: string;
  projectedRangeLow: number;
  projectedRangeHigh: number;
  unit: string;
  description: string;
  confidence: Confidence;
}

// ─── Confidence Labels ────────────────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High confidence (clinical or controlled study)',
  medium: 'Medium confidence (observational study or model)',
  low: 'Low confidence (expert opinion or extrapolation)',
};

const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  personal_exposure: 'Reduces your personal exposure',
  emissions: 'Reduces air pollution in your area',
  both: 'Reduces your exposure AND area pollution',
};

// ─── Pure Functions ───────────────────────────────────────────────────────────

/**
 * Format an impact block for display in the UI.
 * Always shows ranges, never point estimates (D4).
 */
export function formatImpactForDisplay(impact: Impact): ImpactDisplay {
  const { magnitudeRange, confidence, benefitType, basis, sourceNote } = impact;

  const rangeText = `${magnitudeRange.low}–${magnitudeRange.high} ${magnitudeRange.unit}`;
  const confidenceLabel = CONFIDENCE_LABELS[confidence];
  const benefitTypeLabel = BENEFIT_TYPE_LABELS[benefitType];

  // Truncate basis to first sentence for display
  const basisSummary = basis.split(/[.;]/)[0]?.trim() ?? basis;

  const disclaimer =
    confidence === 'low'
      ? 'This is an estimate with significant uncertainty. Treat as a rough guide.'
      : confidence === 'medium'
      ? 'This is based on observational evidence. Individual results may vary.'
      : 'This is based on controlled study evidence.';

  return {
    rangeText,
    confidenceLabel,
    benefitTypeLabel,
    basisSummary,
    sourceNote,
    disclaimer,
  };
}

/**
 * Calculate projected community impact if N households take an action.
 * Returns ranges, not point estimates (D4).
 */
export function calculateCommunityImpact(
  impact: Impact,
  householdCount: number,
  adoptionRateLow = 0.2,
  adoptionRateHigh = 0.4
): CommunityImpact {
  if (householdCount < 1) {
    throw new RangeError('householdCount must be at least 1');
  }

  const effectiveHouseholdsLow = Math.floor(householdCount * adoptionRateLow);
  const effectiveHouseholdsHigh = Math.ceil(householdCount * adoptionRateHigh);

  const projectedLow = impact.magnitudeRange.low * effectiveHouseholdsLow;
  const projectedHigh = impact.magnitudeRange.high * effectiveHouseholdsHigh;

  const description =
    `If ${householdCount} households see this, an estimated ` +
    `${effectiveHouseholdsLow}–${effectiveHouseholdsHigh} may act. ` +
    `Combined effect: ${projectedLow}–${projectedHigh} ${impact.magnitudeRange.unit} ` +
    `(${Math.round(adoptionRateLow * 100)}–${Math.round(adoptionRateHigh * 100)}% adoption assumed).`;

  return {
    householdCount,
    actionId: '',
    projectedRangeLow: projectedLow,
    projectedRangeHigh: projectedHigh,
    unit: impact.magnitudeRange.unit,
    description,
    confidence: impact.confidence === 'high' ? 'medium' : 'low',
  };
}

/** Returns a plain-language confidence summary for plain-language copy (A11Y-006) */
export function getPlainLanguageConfidence(confidence: Confidence): string {
  switch (confidence) {
    case 'high':
      return 'Well proven by research';
    case 'medium':
      return 'Supported by studies';
    case 'low':
      return 'Estimated — not yet fully proven';
  }
}
