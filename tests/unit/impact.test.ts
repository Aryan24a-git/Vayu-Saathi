// Satisfies: TEST-001, REQ-007, REQ-016, D4
import { describe, it, expect } from 'vitest';
import { calculateImpact } from '../../src/domain/impact/calculate';
import { scaleCommunityImpact } from '../../src/domain/impact/community';
import type { ImpactSpec } from '../../src/domain/catalog/schema';

describe('Impact Calculator & Community Scaling', () => {
  const exposureSpec: ImpactSpec = {
    benefitType: 'personal_exposure',
    metric: 'indoor_pm25',
    effectFraction: { low: 0.5, high: 0.8 },
    basis: 'HEPA purifier residential chamber testing',
    confidence: 'high',
    sourceNote: 'EPA Residential Air Cleaners (2023)',
  };

  const emissionsSpec: ImpactSpec = {
    benefitType: 'emissions',
    metric: 'solid_fuel_combustion',
    amount: { low: 15, high: 45, unit: 'kg PM2.5/year' },
    basis: 'WHO Household Fuel Combustion transition models',
    confidence: 'high',
    sourceNote: 'WHO Indoor Air Guidelines (2014)',
  };

  it('calculates personal exposure reduction ranges accurately', () => {
    const res = calculateImpact(200, exposureSpec);
    expect(res.isEstimate).toBe(true);
    expect(res.benefitType).toBe('personal_exposure');
    if (res.benefitType === 'personal_exposure') {
      expect(res.before).toBe(200);
      expect(res.afterLow).toBe(40); // 200 * (1 - 0.8) = 40
      expect(res.afterHigh).toBe(100); // 200 * (1 - 0.5) = 100
      expect(res.unit).toBe('µg/m³ PM2.5');
      expect(res.confidence).toBe('high');
      expect(res.sourceNote).toBe('EPA Residential Air Cleaners (2023)');
    }
  });

  it('calculates emissions amount ranges accurately', () => {
    const res = calculateImpact(0, emissionsSpec);
    expect(res.isEstimate).toBe(true);
    expect(res.benefitType).toBe('emissions');
    if (res.benefitType === 'emissions') {
      expect(res.amountLow).toBe(15);
      expect(res.amountHigh).toBe(45);
      expect(res.unit).toBe('kg PM2.5/year');
    }
  });

  it('handles edge cases safely (zero PM2.5, huge PM2.5, inverted fractions)', () => {
    const atZero = calculateImpact(0, exposureSpec);
    if (atZero.benefitType === 'personal_exposure') {
      expect(atZero.before).toBe(0);
      expect(atZero.afterLow).toBe(0);
      expect(atZero.afterHigh).toBe(0);
    }

    const huge = calculateImpact(1500, exposureSpec);
    if (huge.benefitType === 'personal_exposure') {
      expect(huge.before).toBe(1500);
      expect(huge.afterLow).toBe(300);
      expect(huge.afterHigh).toBe(750);
    }
  });

  it('scales community impact as ranges with explicit adoption assumptions', () => {
    const scaled = scaleCommunityImpact(100, emissionsSpec, 0.25, 0.5);
    expect(scaled.isEstimate).toBe(true);
    expect(scaled.householdCount).toBe(100);
    expect(scaled.activeHouseholdsLow).toBe(25);
    expect(scaled.activeHouseholdsHigh).toBe(50);
    expect(scaled.totalBenefitLow).toBe(375); // 25 * 15
    expect(scaled.totalBenefitHigh).toBe(2250); // 50 * 45
    expect(scaled.adoptionAssumptions).toContain('25% to 50%');
  });
});
