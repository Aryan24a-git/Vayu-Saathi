// Winter Smog Scenarios and Household Profile State
// Strictly typed, functions < 40 lines, file < 250 lines

import { calculateCPCBNAQI, type NaqiResult } from './naqi';

export interface LocationScenario {
  id: string;
  city: string;
  shortCity: string;
  subtitle: string;
  sourceLabel: string;
  pm25: number;
  pm10: number;
  no2: number;
  wind: number;
  hourlyPM25: number[];
  hourlyWind: number[];
  hourlyError?: string;
  isSynthetic?: boolean;
}

export type Vulnerability = 'kids' | 'seniors' | 'asthma' | 'none';
export type PurifierSetup = 'none' | 'one_room' | 'whole_home';
export type CommuteMode = 'solo_car' | 'two_wheeler' | 'public_transit' | 'wfh';
export type BudgetTier = 'zero_cost' | 'diy_2000' | 'paid_upgrades';

export interface HouseholdProfile {
  vulnerabilities: Vulnerability[];
  purifier: PurifierSetup;
  kitchenExhaust: boolean;
  commuteMode: CommuteMode;
  commuteKm: number;
  budgetTier: BudgetTier;
}

export const DEFAULT_PROFILE: HouseholdProfile = {
  vulnerabilities: ['kids', 'seniors'],
  purifier: 'none',
  kitchenExhaust: true,
  commuteMode: 'solo_car',
  commuteKm: 16,
  budgetTier: 'zero_cost',
};

export const SCENARIOS: Record<string, LocationScenario> = {
  delhi: {
    id: 'demo:delhi',
    city: 'New Delhi (Winter Scenario)',
    shortCity: 'New Delhi',
    subtitle: 'Severe Morning Thermal Inversion (Demo scenario — synthetic data)',
    sourceLabel: 'Demo scenario (synthetic data)',
    isSynthetic: true,
    pm25: 285,
    pm10: 410,
    no2: 84,
    wind: 4,
    hourlyPM25: [
      315, 328, 332, 330, 322, 310, 302, 292, 285, 255, 215, 180, 152, 138, 134, 142, 165, 205, 248,
      288, 318, 334, 340, 330,
    ],
    hourlyWind: [
      3.2, 3.0, 2.8, 2.8, 3.1, 3.5, 3.8, 4.0, 4.5, 5.8, 7.4, 9.2, 11.0, 12.4, 12.8, 11.6, 9.5, 7.2,
      5.6, 4.5, 3.8, 3.4, 3.2, 3.1,
    ],
  },
  patna: {
    id: 'demo:patna',
    city: 'Patna (Gangetic Basin Scenario)',
    shortCity: 'Patna',
    subtitle: 'Very Poor Gangetic Winter Smog (Demo scenario — synthetic data)',
    sourceLabel: 'Demo scenario (synthetic data)',
    isSynthetic: true,
    pm25: 192,
    pm10: 295,
    no2: 56,
    wind: 6,
    hourlyPM25: [
      218, 225, 230, 226, 220, 210, 204, 196, 192, 172, 146, 124, 106, 96, 94, 102, 122, 150, 178,
      202, 220, 232, 228, 222,
    ],
    hourlyWind: [
      4.2, 4.0, 3.8, 4.0, 4.5, 5.0, 5.5, 6.0, 6.8, 8.0, 9.5, 11.2, 12.6, 13.4, 13.0, 11.8, 9.6, 7.8,
      6.4, 5.4, 4.8, 4.5, 4.2, 4.1,
    ],
  },
  kolkata: {
    id: 'demo:kolkata',
    city: 'Kolkata (Lower Gangetic Scenario)',
    shortCity: 'Kolkata',
    subtitle: 'Poor / Very Poor Winter Haze (Demo scenario — synthetic data)',
    sourceLabel: 'Demo scenario (synthetic data)',
    isSynthetic: true,
    pm25: 118,
    pm10: 198,
    no2: 62,
    wind: 7,
    hourlyPM25: [
      138, 142, 145, 140, 136, 130, 126, 120, 118, 104, 88, 76, 68, 62, 64, 70, 82, 98, 116, 132,
      144, 148, 145, 140,
    ],
    hourlyWind: [
      5.0, 4.8, 4.6, 4.8, 5.2, 5.8, 6.4, 7.0, 7.8, 9.0, 10.5, 12.2, 13.8, 14.5, 14.0, 12.6, 10.4,
      8.6, 7.2, 6.2, 5.6, 5.2, 5.0, 4.8,
    ],
  },
  bengaluru: {
    id: 'demo:bengaluru',
    city: 'Bengaluru (Deccan Plateau Scenario)',
    shortCity: 'Bengaluru',
    subtitle: 'Moderate Urban Traffic Air (Demo scenario — synthetic data)',
    sourceLabel: 'Demo scenario (synthetic data)',
    isSynthetic: true,
    pm25: 64,
    pm10: 112,
    no2: 48,
    wind: 12,
    hourlyPM25: [
      62, 60, 58, 56, 55, 58, 62, 66, 68, 64, 54, 46, 42, 38, 39, 42, 48, 58, 68, 74, 72, 68, 65,
      63,
    ],
    hourlyWind: [
      9.0, 8.6, 8.4, 8.5, 9.0, 9.8, 10.8, 12.0, 13.2, 14.5, 16.0, 17.2, 18.0, 18.4, 17.8, 16.6,
      15.0, 13.4, 11.8, 10.6, 9.8, 9.4, 9.2, 9.0,
    ],
  },
};

export interface CalculatedImpact {
  aqi: NaqiResult;
  km: number;
  commuteCo2Kg: number;
  totalCo2Kg: number;
  totalNoxG: number;
  commuteSwapLabel: string;
  maxExposureDropPct: number;
  maxCigsAvoided: number;
  cigsMethodNote?: string;
  co2MethodNote?: string;
  confidence?: 'high' | 'medium' | 'low';
}

function calculateCommute(mode: CommuteMode, km: number) {
  if (mode === 'solo_car') {
    return { co2: km * 0.136, nox: km * 0.65, label: `Shift ${km} km solo car trip to Metro/Bus` };
  }
  if (mode === 'two_wheeler') {
    return {
      co2: km * 0.037,
      nox: km * 0.28,
      label: `Shift ${km} km scooter/bike trip to Metro/Bus`,
    };
  }
  if (mode === 'public_transit') {
    return {
      co2: 0.65,
      nox: 3.2,
      label: `Batch evening errands along your ${km} km transit route`,
    };
  }
  return {
    co2: 0.85,
    nox: 2.6,
    label: 'Zero-idling day + electric kettle/induction & batched deliveries',
  };
}

export function computeDeterministicImpact(
  loc: LocationScenario,
  profile: HouseholdProfile
): CalculatedImpact {
  const aqi = calculateCPCBNAQI(loc.pm25, loc.pm10, loc.no2);
  const km = profile.commuteMode === 'wfh' ? 0 : Number(profile.commuteKm || 16);
  const comm = calculateCommute(profile.commuteMode, km);
  const totalCo2Kg = Number((comm.co2 + 0.35).toFixed(2));
  const totalNoxG = Number((comm.nox + 1.4).toFixed(1));

  let drop = 46;
  if (profile.kitchenExhaust) drop += 6;
  if (profile.purifier === 'one_room') drop += 14;
  if (profile.purifier === 'whole_home') drop += 22;
  if (profile.budgetTier === 'diy_2000' && profile.purifier === 'none') drop += 12;
  if (profile.budgetTier === 'paid_upgrades' && profile.purifier === 'none') drop += 16;
  drop = Math.min(76, drop);

  const maxCigsAvoided = Number((aqi.cigsPerDay * (drop / 100)).toFixed(1));
  return {
    aqi,
    km,
    commuteCo2Kg: Number(comm.co2.toFixed(2)),
    totalCo2Kg,
    totalNoxG,
    commuteSwapLabel: comm.label,
    maxExposureDropPct: drop,
    maxCigsAvoided,
    cigsMethodNote:
      'Rough estimate based on ~22 µg/m³ PM2.5 per cigarette equivalent (Berkeley Earth).',
    co2MethodNote: 'Calculated using 0.136 kg CO2/km solo-car vs transit factors.',
    confidence: 'medium',
  };
}
