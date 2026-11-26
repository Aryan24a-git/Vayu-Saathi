// Unit tests for emissions constants & simulator (REQ-016, REQ-020)
import { describe, it, expect } from 'vitest';
import {
  CO2_PER_KM,
  NOX_PER_KM,
  PETROL_CO2_PER_LITRE,
  TREE_ABSORPTION_KG_CO2_YEAR,
  computeDeterministicImpact,
  simulateColonyImpact,
} from '../../src/domain/emissions';
import { calculateCPCBNAQI } from '../../src/domain/naqi';

describe('Emissions & Impact Model', () => {
  it('has documented sources and estimates for transport factors', () => {
    expect(CO2_PER_KM.sourceNote).toBeDefined();
    expect(CO2_PER_KM.value.solo_car).toBe(0.18);
    expect(CO2_PER_KM.value.public_transit).toBe(0.025);
    expect(NOX_PER_KM.isEstimate).toBe(true);
    expect(PETROL_CO2_PER_LITRE.value).toBe(2.31);
    expect(TREE_ABSORPTION_KG_CO2_YEAR.value).toBe(22.0);
  });

  it('computes deterministic impact accurately for household profile', () => {
    const aqi = calculateCPCBNAQI(220, 310, 60);
    const profile = {
      vulnerabilities: ['kids' as const],
      purifier: 'one_room' as const,
      kitchenExhaust: true,
      commuteMode: 'solo_car' as const,
      commuteKm: 20,
      budgetTier: 'diy_2000' as const,
    };

    const impact = computeDeterministicImpact(profile, aqi);
    expect(impact.exposureReductionPercent).toBeGreaterThan(50);
    expect(impact.cigsAvoidedPerDay).toBeGreaterThan(0);
    expect(impact.monthlyCo2SavedKg).toBeCloseTo(20 * 0.18 * 22, 1);
    expect(impact.isEstimate).toBe(true);
  });

  it('simulates colony impact without fabricated certainty', () => {
    const sim = simulateColonyImpact(100, 2, 16);
    expect(sim.families).toBe(100);
    expect(sim.daysPerWeek).toBe(2);
    expect(sim.monthlyCo2Kg).toBeGreaterThan(0);
    expect(sim.monthlyPetrolLitres).toBeGreaterThan(0);
    expect(sim.methodologyNote).toContain('Rough estimate');
    expect(sim.isEstimate).toBe(true);
  });
});
