// Satisfies: REQ-007, DATA-004, D4, EC-001
// Pure calculation of personal exposure reductions and emissions benefits.

import type { ImpactSpec, Confidence, BenefitType } from '../catalog/schema';

export interface ExposureImpactResult {
  readonly isEstimate: true;
  readonly benefitType: 'personal_exposure';
  readonly before: number;
  readonly afterLow: number;
  readonly afterHigh: number;
  readonly reductionFractionLow: number;
  readonly reductionFractionHigh: number;
  readonly unit: string;
  readonly confidence: Confidence;
  readonly sourceNote: string;
  readonly basis: string;
}

export interface EmissionsImpactResult {
  readonly isEstimate: true;
  readonly benefitType: 'emissions';
  readonly amountLow: number;
  readonly amountHigh: number;
  readonly unit: string;
  readonly basis: string;
  readonly confidence: Confidence;
  readonly sourceNote: string;
}

export type ImpactCalculationResult = ExposureImpactResult | EmissionsImpactResult;

/**
 * Pure calculator for personal exposure and community emissions impact.
 * Always produces bounded ranges and labels all outputs as estimates (D4).
 */
export function calculateImpact(currentPm25: number, spec: ImpactSpec): ImpactCalculationResult {
  const safePm25 = Math.max(0, currentPm25);

  if (spec.benefitType === 'personal_exposure' && spec.effectFraction) {
    const { low, high } = spec.effectFraction;
    const boundedLow = Math.min(low, high);
    const boundedHigh = Math.max(low, high);

    // After = before * (1 - fraction)
    const afterLow = Math.round(safePm25 * (1 - boundedHigh) * 10) / 10;
    const afterHigh = Math.round(safePm25 * (1 - boundedLow) * 10) / 10;

    return {
      isEstimate: true,
      benefitType: 'personal_exposure',
      before: Math.round(safePm25 * 10) / 10,
      afterLow,
      afterHigh,
      reductionFractionLow: boundedLow,
      reductionFractionHigh: boundedHigh,
      unit: 'µg/m³ PM2.5',
      confidence: spec.confidence,
      sourceNote: spec.sourceNote,
      basis: spec.basis,
    };
  }

  const amount = spec.amount ?? { low: 0, high: 0, unit: 'units' };
  const lowAmount = Math.min(amount.low, amount.high);
  const highAmount = Math.max(amount.low, amount.high);

  return {
    isEstimate: true,
    benefitType: 'emissions',
    amountLow: lowAmount,
    amountHigh: highAmount,
    unit: amount.unit,
    basis: spec.basis,
    confidence: spec.confidence,
    sourceNote: spec.sourceNote,
  };
}
