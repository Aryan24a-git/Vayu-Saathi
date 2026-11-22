// Satisfies: REQ-002, SEC-001, DATA-001, DATA-002
// Profile schema and validation — pure functions, no I/O

import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BudgetBandSchema = z.enum(['none', 'low', 'medium', 'high']);
export type BudgetBand = z.infer<typeof BudgetBandSchema>;

export const HousingTypeSchema = z.enum([
  'well_sealed',
  'average',
  'poorly_sealed',
  'open',
]);
export type HousingType = z.infer<typeof HousingTypeSchema>;

export const CookingFuelSchema = z.enum([
  'lpg',
  'natural_gas',
  'kerosene',
  'biomass',
  'electric',
  'induction',
]);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const HeatingTypeSchema = z.enum([
  'none',
  'electric',
  'gas',
  'kerosene',
  'wood',
  'coal',
  'other',
]);
export type HeatingType = z.infer<typeof HeatingTypeSchema>;

export const CommuteTypeSchema = z.enum([
  'walk',
  'bicycle',
  'motorcycle',
  'car_petrol',
  'car_diesel',
  'car_electric',
  'autorickshaw',
  'bus',
  'metro',
  'work_from_home',
]);
export type CommuteType = z.infer<typeof CommuteTypeSchema>;

export const VulnerabilityFlagSchema = z.enum([
  'asthma',
  'heart_disease',
  'lung_disease',
  'elderly',
  'infant',
  'pregnant',
]);
export type VulnerabilityFlag = z.infer<typeof VulnerabilityFlagSchema>;

// ─── Household Member ─────────────────────────────────────────────────────────

export const AgeBandSchema = z.enum([
  'infant',      // 0–2
  'child',       // 3–12
  'teen',        // 13–17
  'adult',       // 18–64
  'elderly',     // 65+
]);
export type AgeBand = z.infer<typeof AgeBandSchema>;

export const HouseholdMemberSchema = z.object({
  ageBand: AgeBandSchema,
  vulnerabilityFlags: z.array(VulnerabilityFlagSchema).max(6),
});
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;

// ─── Profile ──────────────────────────────────────────────────────────────────

export const PROFILE_SCHEMA_VERSION = 1;

export const ProfileSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  members: z.array(HouseholdMemberSchema).min(1).max(20),
  housingType: HousingTypeSchema,
  hasPurifier: z.boolean(),
  cookingFuel: CookingFuelSchema,
  heatingType: HeatingTypeSchema,
  commuteTypes: z.array(CommuteTypeSchema).min(0).max(5),
  budgetBand: BudgetBandSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns all unique vulnerability flags across all household members */
export function getAllVulnerabilityFlags(profile: Profile): Set<VulnerabilityFlag> {
  const flags = new Set<VulnerabilityFlag>();
  for (const member of profile.members) {
    for (const flag of member.vulnerabilityFlags) {
      flags.add(flag);
    }
  }
  // Infer elderly flag from age band
  if (profile.members.some((m) => m.ageBand === 'elderly')) {
    flags.add('elderly');
  }
  // Infer infant flag
  if (profile.members.some((m) => m.ageBand === 'infant')) {
    flags.add('infant');
  }
  return flags;
}

/** Returns true if the profile has any vulnerability that triggers early escalation */
export function hasEarlyEscalationVulnerability(profile: Profile): boolean {
  const flags = getAllVulnerabilityFlags(profile);
  const earlyEscalationFlags: VulnerabilityFlag[] = [
    'asthma',
    'heart_disease',
    'lung_disease',
    'elderly',
    'infant',
    'pregnant',
  ];
  return earlyEscalationFlags.some((f) => flags.has(f));
}

/** Count vulnerability flags for compounding escalation */
export function countVulnerabilityFlags(profile: Profile): number {
  return getAllVulnerabilityFlags(profile).size;
}

/** Safe profile migration: upgrades from older schema versions */
export function migrateProfile(raw: unknown): Profile | null {
  const result = ProfileSchema.safeParse(raw);
  if (result.success) return result.data;
  return null;
}

/** Create a default profile for first-time users */
export function createDefaultProfile(): Profile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    members: [{ ageBand: 'adult', vulnerabilityFlags: [] }],
    housingType: 'average',
    hasPurifier: false,
    cookingFuel: 'lpg',
    heatingType: 'none',
    commuteTypes: ['car_petrol'],
    budgetBand: 'low',
  };
}
