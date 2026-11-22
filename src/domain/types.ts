// Satisfies: REQ-002, REQ-003, SEC-001, DATA-001, DATA-002
// Core domain types, Zod schemas, and coordinate rounding helpers.

import { z } from 'zod';
import { COORD_DECIMAL_PLACES, MIN_PROFILE_MEMBERS, MAX_PROFILE_MEMBERS } from './constants';

// ─── Enums (Strict, no free-text) ─────────────────────────────────────────────

export const AgeBandEnum = z.enum(['under5', 'child5to12', 'teen', 'adult', 'senior65plus']);
export type AgeBand = z.infer<typeof AgeBandEnum>;

export const SensitivityEnum = z.enum(['asthma', 'copd', 'heart', 'pregnancy', 'other']);
export type Sensitivity = z.infer<typeof SensitivityEnum>;

export const HousingSealingEnum = z.enum(['leaky', 'average', 'tight']);
export type HousingSealing = z.infer<typeof HousingSealingEnum>;

export const CookingFuelEnum = z.enum([
  'lpg',
  'png',
  'induction',
  'electric',
  'biomass',
  'kerosene',
  'other',
]);
export type CookingFuel = z.infer<typeof CookingFuelEnum>;

export const HeatingEnum = z.enum(['none', 'electric', 'gas', 'biomass', 'other']);
export type Heating = z.infer<typeof HeatingEnum>;

export const CommuteModeEnum = z.enum([
  'walk',
  'cycle',
  'bus',
  'metro',
  'car_petrol',
  'car_diesel',
  'car_ev',
  'two_wheeler',
  'wfh',
  'auto_rickshaw',
]);
export type CommuteMode = z.infer<typeof CommuteModeEnum>;

export const BudgetEnum = z.enum(['free', 'low', 'medium', 'flexible']);
export type Budget = z.infer<typeof BudgetEnum>;

// ─── Household Member & Profile ───────────────────────────────────────────────

export const MemberSchema = z.object({
  ageBand: AgeBandEnum,
  sensitivities: z.array(SensitivityEnum).max(5),
});
export type Member = z.infer<typeof MemberSchema>;

export const CURRENT_PROFILE_SCHEMA_VERSION = 1;

export const HouseholdProfileSchema = z.object({
  schemaVersion: z.literal(CURRENT_PROFILE_SCHEMA_VERSION),
  members: z.array(MemberSchema).min(MIN_PROFILE_MEMBERS).max(MAX_PROFILE_MEMBERS),
  housingSealing: HousingSealingEnum,
  hasPurifier: z.boolean(),
  cookingFuel: CookingFuelEnum,
  heating: HeatingEnum,
  commuteModes: z.array(CommuteModeEnum).max(5),
  budget: BudgetEnum,
});
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

// ─── Location & Coordinate Rounding (DATA-001) ────────────────────────────────

export function roundCoordinate(val: number): number {
  const factor = Math.pow(10, COORD_DECIMAL_PLACES);
  return Math.round(val * factor) / factor;
}

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  cityName: z.string().max(100).optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export function roundLocation(loc: Location): Location {
  return {
    latitude: roundCoordinate(loc.latitude),
    longitude: roundCoordinate(loc.longitude),
    ...(loc.cityName ? { cityName: loc.cityName } : {}),
  };
}

// ─── Air Quality Snapshot ─────────────────────────────────────────────────────

export const AirQualitySnapshotSchema = z.object({
  aqi: z.number().min(0).max(1000),
  pm25: z.number().min(0).max(1500),
  timestamp: z.string().datetime(),
  provider: z.string().min(1),
  isStale: z.boolean(),
  isFallback: z.boolean(),
});
export type AirQualitySnapshot = z.infer<typeof AirQualitySnapshotSchema>;

// ─── Plan & ApiError ──────────────────────────────────────────────────────────

export const PlanSchema = z.object({
  id: z.string().min(1),
  profileHash: z.string().min(1),
  effectiveBand: z.string().min(1),
  escalationLevel: z.number().int().min(0).max(5),
  candidateActionIds: z.array(z.string()),
  generatedAt: z.string().datetime(),
  isFallback: z.boolean(),
});
export type Plan = z.infer<typeof PlanSchema>;

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.string().min(1),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
