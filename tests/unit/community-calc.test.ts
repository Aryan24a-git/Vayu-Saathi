// Satisfies: TEST-001, REQ-016
import { describe, it, expect } from 'vitest';
import { calculateWhatIf, validateHouseholdCount } from '../../src/domain/community-calc';
import type { Impact } from '../../src/catalog/catalog.schema';

const sampleImpact: Impact = {
  magnitudeRange: { low: 15, high: 35, unit: '%' },
  magnitudeDescription: '15–35% reduction in personal exposure',
  basis: 'Field studies and modeling',
  confidence: 'medium',
  benefitType: 'both',
  sourceNote: 'CPCB 2022',
};

describe('Community Calc Domain', () => {
  it('calculates what-if scenario with participants and ranges', () => {
    const res = calculateWhatIf({
      householdCount: 1000,
      actionId: 'ACT-001',
      impact: sampleImpact,
    });

    expect(res.householdCount).toBe(1000);
    expect(res.estimatedParticipants.low).toBe(200);
    expect(res.estimatedParticipants.high).toBe(400);
    expect(res.projectedEffect.low).toBeGreaterThan(0);
    expect(res.narrative).toContain('1,000 households');
  });

  it('validates household count input cleanly', () => {
    expect(validateHouseholdCount(0)).toBe('Must be at least 1 household');
    expect(validateHouseholdCount(10.5)).toBe('Must be a whole number');
    expect(validateHouseholdCount(2000000)).toBe('Maximum 1,000,000 households');
    expect(validateHouseholdCount(500)).toBeNull();
  });
});
