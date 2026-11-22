// Satisfies: REQ-003, REQ-004, REQ-008, D1
// AQI band classification and escalation logic — pure functions, no I/O

import type { Profile } from './profile';
import { hasEarlyEscalationVulnerability, countVulnerabilityFlags } from './profile';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AqiBandId =
  'good' | 'moderate' | 'usg' | 'unhealthy' | 'very_unhealthy' | 'hazardous' | 'severe';

export interface AqiBand {
  id: AqiBandId;
  label: string;
  aqiMin: number;
  aqiMax: number;
  pm25Min: number;
  pm25Max: number;
  escalationLevel: number;
  colorToken: string;
  icon: string;
  ariaLabel: string;
}

export interface AqiReading {
  aqi: number;
  pm25: number;
  timestamp: string;
  source: string;
  isFallback: boolean;
}

// ─── AQI Band Table ───────────────────────────────────────────────────────────

export const AQI_BANDS: readonly AqiBand[] = [
  {
    id: 'good',
    label: 'Good',
    aqiMin: 0,
    aqiMax: 50,
    pm25Min: 0,
    pm25Max: 12.0,
    escalationLevel: 0,
    colorToken: 'aqi-good',
    icon: '✓',
    ariaLabel: 'Good air quality',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    aqiMin: 51,
    aqiMax: 100,
    pm25Min: 12.1,
    pm25Max: 35.4,
    escalationLevel: 1,
    colorToken: 'aqi-moderate',
    icon: '!',
    ariaLabel: 'Moderate air quality',
  },
  {
    id: 'usg',
    label: 'Unhealthy for Sensitive Groups',
    aqiMin: 101,
    aqiMax: 150,
    pm25Min: 35.5,
    pm25Max: 55.4,
    escalationLevel: 2,
    colorToken: 'aqi-usg',
    icon: '⚠',
    ariaLabel: 'Unhealthy for sensitive groups',
  },
  {
    id: 'unhealthy',
    label: 'Unhealthy',
    aqiMin: 151,
    aqiMax: 200,
    pm25Min: 55.5,
    pm25Max: 150.4,
    escalationLevel: 3,
    colorToken: 'aqi-unhealthy',
    icon: '⚠⚠',
    ariaLabel: 'Unhealthy air quality',
  },
  {
    id: 'very_unhealthy',
    label: 'Very Unhealthy',
    aqiMin: 201,
    aqiMax: 300,
    pm25Min: 150.5,
    pm25Max: 250.4,
    escalationLevel: 4,
    colorToken: 'aqi-very-unhealthy',
    icon: '✕',
    ariaLabel: 'Very unhealthy air quality',
  },
  {
    id: 'hazardous',
    label: 'Hazardous',
    aqiMin: 301,
    aqiMax: 500,
    pm25Min: 250.5,
    pm25Max: 500.0,
    escalationLevel: 5,
    colorToken: 'aqi-hazardous',
    icon: '✕✕',
    ariaLabel: 'Hazardous air quality',
  },
  {
    id: 'severe',
    label: 'Severe (Winter Smog)',
    aqiMin: 501,
    aqiMax: Infinity,
    pm25Min: 500.1,
    pm25Max: Infinity,
    escalationLevel: 6,
    colorToken: 'aqi-severe',
    icon: '🚨',
    ariaLabel: 'Severe air quality — winter smog emergency',
  },
] as const;

// ─── Pure Functions ───────────────────────────────────────────────────────────

/** Classify an AQI value into the corresponding band */
export function classifyAqi(aqi: number): AqiBand {
  const band = AQI_BANDS.find((b) => aqi >= b.aqiMin && aqi <= b.aqiMax);
  return band ?? AQI_BANDS[AQI_BANDS.length - 1]!;
}

/** Classify using PM2.5 µg/m³ when AQI is unavailable */
export function classifyPm25(pm25: number): AqiBand {
  const band = AQI_BANDS.find((b) => pm25 >= b.pm25Min && pm25 <= b.pm25Max);
  return band ?? AQI_BANDS[AQI_BANDS.length - 1]!;
}

/**
 * Compute effective escalation level for a profile + AQI reading.
 * Vulnerable households get escalation applied earlier (D1).
 */
export function computeEffectiveEscalationLevel(baseBand: AqiBand, profile: Profile): number {
  if (!hasEarlyEscalationVulnerability(profile)) {
    return baseBand.escalationLevel;
  }
  const vulnCount = countVulnerabilityFlags(profile);
  const earlyBy = Math.min(vulnCount, 2); // max 2 bands earlier
  const adjusted = baseBand.escalationLevel + earlyBy;
  return Math.min(adjusted, 6);
}

/** Get the AqiBand for a given escalation level */
export function getBandByEscalationLevel(level: number): AqiBand {
  const clamped = Math.min(Math.max(level, 0), 6);
  return AQI_BANDS.find((b) => b.escalationLevel === clamped) ?? AQI_BANDS[6]!;
}

/** Returns true when escalation level is >= 4 (Very Unhealthy or above) */
export function isHighRiskCondition(escalationLevel: number): boolean {
  return escalationLevel >= 4;
}

/** Returns true when escalation level is >= 5 (Hazardous or above) */
export function isEmergencyCondition(escalationLevel: number): boolean {
  return escalationLevel >= 5;
}
