// Satisfies: TEST-001, REQ-004, REQ-005, REQ-006, REQ-010, D1, D2, D3
import { describe, it, expect } from 'vitest';
import { assemblePlan } from '../../src/domain/rules-engine';
import { createDefaultProfile } from '../../src/domain/profile';
import { classifyAqi } from '../../src/domain/aqi-bands';
import catalogData from '../../src/catalog/catalog.json';
import type { Action } from '../../src/catalog/catalog.schema';

const catalog = catalogData.actions as readonly Action[];

describe('Rules Engine Domain', () => {
  it('assembles a deterministic plan respecting budget and escalation (D2)', () => {
    const profile = createDefaultProfile();
    profile.budgetBand = 'none'; // free tier only
    const band = classifyAqi(75); // moderate, level 1

    const plan = assemblePlan(profile, band, 1, catalog);
    expect(plan.candidateActions.length).toBeGreaterThan(0);
    expect(plan.isFallback).toBe(false);

    // Ensure all candidate actions respect zero budget
    for (const c of plan.candidateActions) {
      const act = catalog.find((a) => a.id === c.actionId);
      expect(act?.budgetTier).toBe('free');
    }
  });

  it('triggers red-flag protocol on severe hazardous smog (D5)', () => {
    const profile = createDefaultProfile();
    profile.members = [{ ageBand: 'child', vulnerabilityFlags: ['asthma'] }];
    const band = classifyAqi(350); // hazardous, level 5

    const plan = assemblePlan(profile, band, 5, catalog);
    expect(plan.hasRedFlag).toBe(true);
    expect(plan.medicalDisclaimer).toContain('not medical advice');
  });

  it('filters out actions excluded by housing type or budget (D2, D3)', () => {
    const profile = createDefaultProfile();
    profile.housingType = 'open';
    const band = classifyAqi(250); // level 4

    const plan = assemblePlan(profile, band, 4, catalog);
    // ACT-002 has doNotShowWhen: ["housing_type:open"]
    const hasAct2 = plan.candidateActions.some((c) => c.actionId === 'ACT-002');
    expect(hasAct2).toBe(false);
  });
});
