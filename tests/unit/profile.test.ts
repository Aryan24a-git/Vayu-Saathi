// Satisfies: TEST-001, REQ-002, DATA-001, CR-01
import { describe, it, expect } from 'vitest';
import {
  ProfileSchema,
  ProfileV2Schema,
  createDefaultProfile,
  createDefaultProfileV2,
  getAllVulnerabilityFlags,
  hasEarlyEscalationVulnerability,
  countVulnerabilityFlags,
  migrateProfile,
  migrateProfileV1ToV2,
  migrateProfileV2ToV1,
} from '../../src/domain/profile';

describe('Profile Domain V1', () => {
  it('creates valid default profile', () => {
    const profile = createDefaultProfile();
    const result = ProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it('detects vulnerability flags correctly', () => {
    const profile = createDefaultProfile();
    profile.members = [
      { ageBand: 'child', vulnerabilityFlags: ['asthma'] },
      { ageBand: 'elderly', vulnerabilityFlags: ['heart_disease'] },
    ];
    const flags = getAllVulnerabilityFlags(profile);
    expect(flags.has('asthma')).toBe(true);
    expect(flags.has('heart_disease')).toBe(true);
    expect(flags.has('elderly')).toBe(true);
    expect(hasEarlyEscalationVulnerability(profile)).toBe(true);
    expect(countVulnerabilityFlags(profile)).toBe(3);
  });

  it('safely migrates valid profile objects', () => {
    const profile = createDefaultProfile();
    const migrated = migrateProfile(profile);
    expect(migrated).not.toBeNull();
    expect(migrated?.housingType).toBe('average');
  });

  it('rejects invalid profile objects', () => {
    const invalid = { schemaVersion: 99 };
    expect(migrateProfile(invalid)).toBeNull();
  });
});

describe('Profile Domain V2 & Migration (REQ-002)', () => {
  it('creates valid default v2 profile', () => {
    const p2 = createDefaultProfileV2();
    const res = ProfileV2Schema.safeParse(p2);
    expect(res.success).toBe(true);
    expect(p2.schemaVersion).toBe(2);
    expect(p2.vulnerabilities).toContain('kids');
  });

  it("enforces that 'none' cannot be combined with specific vulnerabilities", () => {
    const invalid = {
      schemaVersion: 2,
      vulnerabilities: ['none', 'asthma'],
      purifier: 'none',
      kitchenExhaust: false,
      commuteMode: 'wfh',
      commuteKm: 10,
      budgetTier: 'zero_cost',
    };
    const res = ProfileV2Schema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('migrates legacy v1 profile to v2 schema cleanly', () => {
    const v1 = {
      schemaVersion: 1,
      members: [
        { ageBand: 'child', vulnerabilityFlags: ['asthma'] },
        { ageBand: 'elderly', vulnerabilityFlags: [] },
      ],
      housingType: 'well_sealed',
      hasPurifier: true,
      cookingFuel: 'induction',
      heatingType: 'none',
      commuteTypes: ['metro'],
      budgetBand: 'medium',
    };

    const v2 = migrateProfileV1ToV2(v1);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.vulnerabilities).toContain('kids');
    expect(v2.vulnerabilities).toContain('seniors');
    expect(v2.vulnerabilities).toContain('asthma');
    expect(v2.purifier).toBe('one_room');
    expect(v2.kitchenExhaust).toBe(true);
    expect(v2.commuteMode).toBe('public_transit');
    expect(v2.budgetTier).toBe('paid_upgrades');
  });

  it('falls back to default v2 on completely invalid input', () => {
    const v2 = migrateProfileV1ToV2({ nonsense: true });
    expect(v2.schemaVersion).toBe(2);
    expect(v2.budgetTier).toBe('zero_cost');
  });

  it('migrates v2 profile back to v1 across purifier, commute, and budget variants', () => {
    const v1a = migrateProfileV2ToV1({
      schemaVersion: 2,
      vulnerabilities: ['kids', 'seniors', 'asthma'],
      purifier: 'whole_home',
      kitchenExhaust: false,
      commuteMode: 'wfh',
      commuteKm: 0,
      budgetTier: 'paid_upgrades',
    });
    expect(v1a.hasPurifier).toBe(true);
    expect(v1a.commuteTypes).toContain('work_from_home');
    expect(v1a.budgetBand).toBe('medium');

    const v1b = migrateProfileV2ToV1({
      schemaVersion: 2,
      vulnerabilities: ['none'],
      purifier: 'none',
      kitchenExhaust: true,
      commuteMode: 'two_wheeler',
      commuteKm: 12,
      budgetTier: 'diy_2000',
    });
    expect(v1b.hasPurifier).toBe(false);
    expect(v1b.budgetBand).toBe('low');
    expect(v1b.commuteTypes).toContain('motorcycle');
  });
});
