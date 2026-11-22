// Satisfies: DATA-004, D6, REQ-004, REQ-005, REQ-006, REQ-007
// This schema is the build-time guard for the action catalog.
// Every action MUST have a complete impact evidence block.
// Build fails (via catalog-validate.ts) if any action is missing required fields.

import { z } from 'zod';

export const MagnitudeRangeSchema = z.object({
  low: z.number().min(0),
  high: z.number().min(0),
  unit: z.string().min(1),
});

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const BenefitTypeSchema = z.enum([
  'personal_exposure',
  'emissions',
  'both',
]);

export const ImpactSchema = z.object({
  magnitudeRange: MagnitudeRangeSchema,
  magnitudeDescription: z.string().min(10),
  basis: z.string().min(20),
  confidence: ConfidenceSchema,
  benefitType: BenefitTypeSchema,
  sourceNote: z.string().min(10),
});

export const ActionSchema = z.object({
  id: z.string().regex(/^ACT-\d{3}$/, 'Action ID must be ACT-XXX format'),
  category: z.enum(['routine', 'indoor', 'alternative', 'community']),
  subcategory: z.string().min(1),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(500),
  shortDescription: z.string().min(5).max(80),
  budgetTier: z.enum(['free', 'low', 'medium', 'high']),
  minimumEscalationLevel: z.number().int().min(0).max(6),
  maximumEscalationLevel: z.number().int().min(0).max(6),
  targetHousingTypes: z.array(
    z.enum(['well_sealed', 'average', 'poorly_sealed', 'open'])
  ),
  targetVulnerabilityFlags: z.array(
    z.enum([
      'asthma',
      'heart_disease',
      'lung_disease',
      'elderly',
      'infant',
      'pregnant',
    ])
  ),
  requiredVulnerabilityFlags: z.array(
    z.enum([
      'asthma',
      'heart_disease',
      'lung_disease',
      'elderly',
      'infant',
      'pregnant',
    ])
  ),
  cookingFuelRelevance: z.array(
    z.enum(['lpg', 'natural_gas', 'kerosene', 'biomass', 'electric', 'induction'])
  ),
  timeOfDay: z.enum(['morning', 'daytime', 'evening', 'night', 'any']),
  feasibilityNote: z.string().min(10),
  impact: ImpactSchema,
  redFlagTrigger: z.boolean(),
  doNotShowWhen: z.array(z.string()),
  d3Check: z.boolean(),
});

export const CatalogSchema = z.object({
  $schema: z.string(),
  version: z.string(),
  lastUpdated: z.string(),
  actions: z.array(ActionSchema).min(1),
});

export type Action = z.infer<typeof ActionSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type BenefitType = z.infer<typeof BenefitTypeSchema>;
