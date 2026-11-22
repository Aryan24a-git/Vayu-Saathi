// Satisfies: REQ-004, REQ-005, REQ-006, REQ-007, DATA-004, D4, D6
// Schema and types for the curated, evidence-backed action catalog.

import { z } from 'zod';
import {
  SensitivityEnum,
  HousingSealingEnum,
  CookingFuelEnum,
  HeatingEnum,
  BudgetEnum,
} from '../types';

export const CatalogSectionEnum = z.enum(['today', 'indoors', 'alternatives']);
export type CatalogSection = z.infer<typeof CatalogSectionEnum>;

export const CostTierEnum = z.enum(['free', 'low', 'medium', 'high']);
export type CostTier = z.infer<typeof CostTierEnum>;

export const ConfidenceEnum = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof ConfidenceEnum>;

export const BenefitTypeEnum = z.enum(['personal_exposure', 'emissions']);
export type BenefitType = z.infer<typeof BenefitTypeEnum>;

export const ImpactSpecSchema = z
  .object({
    benefitType: BenefitTypeEnum,
    metric: z.string().min(1),
    effectFraction: z
      .object({
        low: z.number().min(0).max(1),
        high: z.number().min(0).max(1),
      })
      .optional(),
    amount: z
      .object({
        low: z.number().min(0),
        high: z.number().min(0),
        unit: z.string().min(1),
      })
      .optional(),
    basis: z.string().min(10),
    confidence: ConfidenceEnum,
    sourceNote: z.string().min(5),
  })
  .refine(
    (spec) => {
      if (spec.effectFraction) {
        return spec.effectFraction.low <= spec.effectFraction.high;
      }
      if (spec.amount) {
        return spec.amount.low <= spec.amount.high;
      }
      return false;
    },
    {
      message:
        'Impact low must be less than or equal to high, and either effectFraction or amount must be set',
    }
  );
export type ImpactSpec = z.infer<typeof ImpactSpecSchema>;

export const PredicateSchema = z.object({
  minBandOrdinal: z.number().int().min(0).max(5).optional(),
  maxBandOrdinal: z.number().int().min(0).max(5).optional(),
  requiredSensitivities: z.array(SensitivityEnum).optional(),
  targetHousing: z.array(HousingSealingEnum).optional(),
  targetCooking: z.array(CookingFuelEnum).optional(),
  targetHeating: z.array(HeatingEnum).optional(),
  maxCostTier: CostTierEnum.optional(),
  hasPurifier: z.boolean().optional(),
});
export type ActionPredicate = z.infer<typeof PredicateSchema>;

export const ActionEntrySchema = z.object({
  id: z.string().regex(/^ACT-\d{3}$/, 'Action ID must be in format ACT-XXX'),
  section: CatalogSectionEnum,
  titleKey: z.string().min(3),
  bodyKey: z.string().min(3),
  applicableIf: PredicateSchema,
  cost: CostTierEnum,
  effort: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  risks: z.array(z.string()),
  impact: ImpactSpecSchema,
});
export type ActionEntry = z.infer<typeof ActionEntrySchema>;
