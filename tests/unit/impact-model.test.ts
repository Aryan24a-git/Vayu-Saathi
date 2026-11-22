// Satisfies: TEST-001, REQ-007, D4, DATA-004
import { describe, it, expect } from 'vitest';
import {
  formatImpactForDisplay,
  calculateCommunityImpact,
  getPlainLanguageConfidence,
} from '../../src/domain/impact-model';
import type { Impact } from '../../src/catalog/catalog.schema';

const sampleImpact: Impact = {
  magnitudeRange: { low: 20, high: 50, unit: '%' },
  magnitudeDescription: '20-50% reduction in personal exposure',
  basis: 'Controlled laboratory and chamber infiltration tests',
  confidence: 'high',
  benefitType: 'personal_exposure',
  sourceNote: 'EPA 2023 Indoor Air Guidelines',
};

describe('Impact Model Domain', () => {
  it('formats impact displaying ranges and confidence (D4)', () => {
    const formatted = formatImpactForDisplay(sampleImpact);
    expect(formatted.rangeText).toBe('20–50 %');
    expect(formatted.confidenceLabel).toContain('High confidence');
    expect(formatted.sourceNote).toBe('EPA 2023 Indoor Air Guidelines');
  });

  it('calculates community projections with ranges', () => {
    const proj = calculateCommunityImpact(sampleImpact, 100);
    expect(proj.householdCount).toBe(100);
    expect(proj.projectedRangeLow).toBeGreaterThan(0);
    expect(proj.projectedRangeHigh).toBeGreaterThan(proj.projectedRangeLow);
    expect(proj.unit).toBe('%');
  });

  it('throws on invalid household count', () => {
    expect(() => calculateCommunityImpact(sampleImpact, 0)).toThrow();
  });

  it('provides plain language confidence labels', () => {
    expect(getPlainLanguageConfidence('high')).toBe('Well proven by research');
    expect(getPlainLanguageConfidence('medium')).toBe('Supported by studies');
    expect(getPlainLanguageConfidence('low')).toBe('Estimated — not yet fully proven');
  });
});
