// Satisfies: REQ-016, D4, EC-001
// Pure community scaling calculator for emissions and collective action impact.

import type { ImpactSpec, Confidence } from '../catalog/schema';

export interface CommunityScalingResult {
  readonly isEstimate: true;
  readonly householdCount: number;
  readonly activeHouseholdsLow: number;
  readonly activeHouseholdsHigh: number;
  readonly totalBenefitLow: number;
  readonly totalBenefitHigh: number;
  readonly unit: string;
  readonly adoptionAssumptions: string;
  readonly confidence: Confidence;
  readonly sourceNote: string;
}

export function scaleCommunityImpact(
  households: number,
  spec: ImpactSpec,
  adoptionLow = 0.2,
  adoptionHigh = 0.4
): CommunityScalingResult {
  const safeCount = Math.max(1, Math.floor(households));
  const boundedAdoptionLow = Math.max(0.01, Math.min(adoptionLow, adoptionHigh));
  const boundedAdoptionHigh = Math.min(1.0, Math.max(adoptionLow, adoptionHigh));

  const activeLow = Math.floor(safeCount * boundedAdoptionLow);
  const activeHigh = Math.ceil(safeCount * boundedAdoptionHigh);

  const baseLow = spec.amount?.low ?? (spec.effectFraction ? spec.effectFraction.low * 100 : 0);
  const baseHigh = spec.amount?.high ?? (spec.effectFraction ? spec.effectFraction.high * 100 : 0);
  const unit = spec.amount?.unit ?? '% cumulative reduction';

  const totalBenefitLow = Math.round(activeLow * baseLow * 10) / 10;
  const totalBenefitHigh = Math.round(activeHigh * baseHigh * 10) / 10;

  const pctLow = Math.round(boundedAdoptionLow * 100);
  const pctHigh = Math.round(boundedAdoptionHigh * 100);

  return {
    isEstimate: true,
    householdCount: safeCount,
    activeHouseholdsLow: activeLow,
    activeHouseholdsHigh: activeHigh,
    totalBenefitLow,
    totalBenefitHigh,
    unit,
    adoptionAssumptions: `Assumes ${pctLow}% to ${pctHigh}% local neighborhood adoption rate.`,
    confidence: spec.confidence === 'high' ? 'medium' : 'low',
    sourceNote: spec.sourceNote,
  };
}
