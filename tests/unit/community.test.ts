// Unit tests for pure community domain math (REQ-016, REQ-019)
import { describe, it, expect } from 'vitest';
import {
  calculateColonyProjection,
  computePledgeTotals,
  LocalHotspotSchema,
} from '../../src/domain/community';

describe('Community Domain Math & Schema', () => {
  it('validates local hotspot reports strictly', () => {
    const valid = {
      id: 'hs-test-1',
      city: 'New Delhi',
      category: 'Open Waste Burning',
      locality: 'Mayur Vihar Pocket 1',
      description: 'Leaves burning near boundary fence in evening.',
      upvotes: 4,
    };
    const res = LocalHotspotSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid category on local hotspot', () => {
    const invalid = {
      id: 'hs-test-2',
      city: 'Delhi',
      category: 'Nuclear Radiation',
      locality: 'Zone A',
      description: 'Uncovered dust piles.',
      upvotes: 0,
    };
    const res = LocalHotspotSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('calculates colony projection with bounds clamping', () => {
    const proj = calculateColonyProjection(50, 3, 16);
    expect(proj.families).toBe(50);
    expect(proj.daysPerWeek).toBe(3);
    expect(proj.monthlyCo2Kg).toBeGreaterThan(100);
    expect(proj.label).toBe('rough estimate');
  });

  it('computes pledge totals accurately from active pledge action IDs', () => {
    const totals = computePledgeTotals(['pledge-transit', 'pledge-idle-off']);
    expect(totals.pledgeCount).toBe(2);
    expect(totals.co2SavedMonthlyKg).toBeGreaterThan(0);
    expect(totals.petrolSavedMonthlyL).toBeGreaterThan(0);
  });
});
