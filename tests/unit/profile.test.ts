// Satisfies: TEST-001, REQ-002, DATA-001
import { describe, it, expect } from 'vitest';
import {
  ProfileSchema,
  createDefaultProfile,
  getAllVulnerabilityFlags,
  hasEarlyEscalationVulnerability,
  countVulnerabilityFlags,
  migrateProfile,
} from '../../src/domain/profile';

describe('Profile Domain', () => {
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
