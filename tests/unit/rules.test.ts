import { describe, expect, it } from 'vitest';
import { buildBasicPlan } from '../../src/domain/plan';
import { BudgetBandSchema, createDefaultProfile, type Profile } from '../../src/domain/profile';
import type { AirQualitySnapshot } from '../../src/domain/types';
import goldenInputs from '../fixtures/plans/matrix.json';

const now = new Date('2026-11-22T12:00:00Z');

function makeSnapshot(aqi: number, pm25: number): AirQualitySnapshot {
  return {
    aqi,
    pm25,
    timestamp: '2026-11-22T12:00:00Z',
    provider: 'Open-Meteo',
    isStale: false,
    isFallback: false,
  };
}

function makeProfile(budget: 'none' | 'low' | 'medium' | 'high', sensitive: boolean): Profile {
  const profile = createDefaultProfile();
  profile.budgetBand = budget;
  if (sensitive) {
    profile.members = [{ ageBand: 'child', vulnerabilityFlags: ['asthma'] }];
  }
  return profile;
}

describe('basic deterministic plan', () => {
  it('changes across the full band, sensitivity and budget golden matrix', () => {
    const signatures = new Set<string>();
    for (const fixture of goldenInputs.cases) {
      const profile = makeProfile(BudgetBandSchema.parse(fixture.budget), fixture.sensitive);
      const plan = buildBasicPlan(profile, makeSnapshot(fixture.aqi, fixture.pm25), now);
      expect(plan.generatedAt).toBe(now.toISOString());
      expect(plan.candidateActionIds.length).toBeGreaterThan(0);
      expect(plan.candidateActionIds).toEqual(fixture.actionIds);
      signatures.add(plan.candidateActionIds.join(','));
    }
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('is deterministic when now is injected', () => {
    const profile = makeProfile('medium', true);
    const snapshot = makeSnapshot(175, 72);
    expect(buildBasicPlan(profile, snapshot, now)).toEqual(buildBasicPlan(profile, snapshot, now));
  });

  it('does not recommend a purifier to a tight-sealed household with one', () => {
    const profile = makeProfile('medium', false);
    profile.housingType = 'well_sealed';
    profile.hasPurifier = true;
    const plan = buildBasicPlan(profile, makeSnapshot(175, 72), now);
    expect(plan.candidateActionIds).not.toContain('ACT-006');
  });

  it('ranks biomass cooking switch first among alternatives', () => {
    const profile = makeProfile('low', false);
    profile.cookingFuel = 'biomass';
    const plan = buildBasicPlan(profile, makeSnapshot(175, 72), now);
    expect(plan.alternatives[0]?.actionId).toBe('ACT-012');
  });

  it('never suggests outdoor exercise to sensitive people on Unhealthy or worse days', () => {
    const profile = makeProfile('medium', true);
    const plan = buildBasicPlan(profile, makeSnapshot(175, 72), now);
    expect(plan.candidateActionIds).not.toContain('ACT-003');
  });

  it('uses only free actions for zero budget and marks paid items optional', () => {
    const profile = makeProfile('none', false);
    const plan = buildBasicPlan(profile, makeSnapshot(175, 72), now);
    const allItems = [...plan.routine, ...plan.indoors, ...plan.alternatives];
    expect(allItems.every((item) => !item.optional)).toBe(true);

    const medium = makeProfile('medium', false);
    const mediumPlan = buildBasicPlan(medium, makeSnapshot(175, 72), now);
    expect(mediumPlan.indoors.some((item) => item.optional)).toBe(true);
  });
});
