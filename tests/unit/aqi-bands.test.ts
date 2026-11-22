// Satisfies: TEST-001, REQ-003, REQ-004, D1
import { describe, it, expect } from 'vitest';
import {
  classifyAqi,
  classifyPm25,
  computeEffectiveEscalationLevel,
  getBandByEscalationLevel,
  isHighRiskCondition,
  isEmergencyCondition,
} from '../../src/domain/aqi-bands';
import { createDefaultProfile } from '../../src/domain/profile';

describe('AQI Bands Domain', () => {
  it('correctly classifies AQI values', () => {
    expect(classifyAqi(25).id).toBe('good');
    expect(classifyAqi(75).id).toBe('moderate');
    expect(classifyAqi(125).id).toBe('usg');
    expect(classifyAqi(175).id).toBe('unhealthy');
    expect(classifyAqi(250).id).toBe('very_unhealthy');
    expect(classifyAqi(350).id).toBe('hazardous');
    expect(classifyAqi(550).id).toBe('severe');
  });

  it('correctly classifies PM2.5 values', () => {
    expect(classifyPm25(10).id).toBe('good');
    expect(classifyPm25(25).id).toBe('moderate');
    expect(classifyPm25(40).id).toBe('usg');
    expect(classifyPm25(75).id).toBe('unhealthy');
    expect(classifyPm25(180).id).toBe('very_unhealthy');
    expect(classifyPm25(300).id).toBe('hazardous');
    expect(classifyPm25(600).id).toBe('severe');
  });

  it('escalates earlier for vulnerable households (D1)', () => {
    const profile = createDefaultProfile();
    const band = classifyAqi(125); // base escalation = 2 (USG)

    // Baseline (no vulnerability flags)
    const baseEscalation = computeEffectiveEscalationLevel(band, profile);
    expect(baseEscalation).toBe(2);

    // With asthma + infant (2 flags -> +2 escalation level, capped at 6)
    profile.members = [
      { ageBand: 'infant', vulnerabilityFlags: ['asthma'] },
    ];
    const adjusted = computeEffectiveEscalationLevel(band, profile);
    expect(adjusted).toBe(4);
  });

  it('checks high risk and emergency conditions', () => {
    expect(isHighRiskCondition(3)).toBe(false);
    expect(isHighRiskCondition(4)).toBe(true);
    expect(isEmergencyCondition(4)).toBe(false);
    expect(isEmergencyCondition(5)).toBe(true);
    expect(getBandByEscalationLevel(5).id).toBe('hazardous');
  });
});
