/**
 * Alignment demo — 3 profiles × 3 AQI overrides (V2-17 EC-002 evidence)
 * Uses the actual domain types from src/domain/profile.ts
 */
import { buildBasicPlan } from '../src/domain/plan.js';
import type { Profile } from '../src/domain/profile.js';
import type { AirQualitySnapshot } from '../src/domain/types.js';

const profiles: Array<{ label: string; profile: Profile }> = [
  {
    label: 'P1 — Healthy adult, tight housing, free budget',
    profile: {
      schemaVersion: 1,
      members: [{ ageBand: 'adult', vulnerabilityFlags: [] }],
      housingType: 'well_sealed',
      hasPurifier: false,
      cookingFuel: 'electric',
      heatingType: 'electric',
      commuteTypes: ['work_from_home'],
      budgetBand: 'none',
    },
  },
  {
    label: 'P2 — Child with asthma, leaky housing, low budget',
    profile: {
      schemaVersion: 1,
      members: [{ ageBand: 'child', vulnerabilityFlags: ['asthma'] }],
      housingType: 'poorly_sealed',
      hasPurifier: false,
      cookingFuel: 'lpg',
      heatingType: 'none',
      commuteTypes: ['autorickshaw'],
      budgetBand: 'low',
    },
  },
  {
    label: 'P3 — Senior COPD, average housing, medium budget + purifier',
    profile: {
      schemaVersion: 1,
      members: [{ ageBand: 'elderly', vulnerabilityFlags: ['lung_disease'] }],
      housingType: 'average',
      hasPurifier: true,
      cookingFuel: 'lpg',
      heatingType: 'none',
      commuteTypes: ['work_from_home'],
      budgetBand: 'medium',
    },
  },
];

const aqiValues = [50, 150, 350];
const now = new Date('2026-11-22T06:00:00Z');

for (const { label, profile } of profiles) {
  console.log(`\n=== ${label} ===`);
  for (const aqi of aqiValues) {
    const snapshot: AirQualitySnapshot = {
      aqi,
      pm25: Math.round(aqi * 0.6),
      timestamp: now.toISOString(),
      provider: 'test',
      isStale: false,
      isFallback: false,
    };
    const plan = buildBasicPlan(profile, snapshot, now);
    const allItems = [...plan.routine, ...plan.indoors, ...plan.alternatives];
    const ids = allItems.slice(0, 3).map((a) => a.actionId);
    const totalActions = allItems.length;
    console.log(
      `  AQI=${aqi}: band=${plan.effectiveBand}, escalation=${plan.escalationLevel}, ` +
        `actions=${totalActions}, first3=[${ids.join(', ')}]`
    );
  }
}
