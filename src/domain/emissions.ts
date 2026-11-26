// Emissions, Impact & Colony What-If Model
// Strictly typed, functions < 40 lines, file < 250 lines (NFR-004)

import type { HouseholdProfile } from './scenarios';
import type { NaqiResult } from './naqi';

export interface SourcedConstant<T> {
  value: T;
  sourceNote: string;
  confidence: 'high' | 'medium' | 'low';
  isEstimate: boolean;
}

/**
 * Passenger emissions per kilometre by commute mode.
 * Source: ICCT India Passenger Transport emissions & CPCB vehicular factors.
 */
export const CO2_PER_KM: SourcedConstant<Record<HouseholdProfile['commuteMode'], number>> = {
  value: {
    solo_car: 0.18, // 180g CO2/km (petrol sedan)
    two_wheeler: 0.045, // 45g CO2/km (125cc 4-stroke)
    public_transit: 0.025, // 25g CO2/pass-km (Metro / CNG bus grid average)
    wfh: 0.0,
  },
  sourceNote: 'ICCT India light-duty vehicle emissions & CPCB urban transport factors',
  confidence: 'medium',
  isEstimate: false,
};

export const NOX_PER_KM: SourcedConstant<Record<HouseholdProfile['commuteMode'], number>> = {
  value: {
    solo_car: 0.35, // 350mg NOx/km
    two_wheeler: 0.15,
    public_transit: 0.05,
    wfh: 0.0,
  },
  sourceNote: 'BS-VI real-world driving emissions literature estimate',
  confidence: 'low',
  isEstimate: true,
};

export const EXPOSURE_DROP_PURIFIER: SourcedConstant<Record<HouseholdProfile['purifier'], number>> =
  {
    value: {
      none: 0.0,
      one_room: 0.35,
      whole_home: 0.65,
    },
    sourceNote: 'Indoor HEPA filtration trials in NCR residential apartments',
    confidence: 'medium',
    isEstimate: true,
  };

export const EXPOSURE_DROP_BUDGET: SourcedConstant<Record<HouseholdProfile['budgetTier'], number>> =
  {
    value: {
      zero_cost: 0.15, // Towel weather-sealing + diurnal ventilation
      diy_2000: 0.3, // Silicone weatherstrips + door sweeps + exhaust isolation
      paid_upgrades: 0.55, // HEPA + active air sealing
    },
    sourceNote: 'IIT Delhi & CSE indoor air quality intervention measurements',
    confidence: 'low',
    isEstimate: true,
  };

export const WEEKS_PER_MONTH: SourcedConstant<number> = {
  value: 4.33,
  sourceNote: '52 weeks / 12 months average monthly multiplier',
  confidence: 'high',
  isEstimate: false,
};

export const TREE_ABSORPTION_KG_CO2_YEAR: SourcedConstant<number> = {
  value: 22.0,
  sourceNote:
    'European Environment Agency & Arbor Day Foundation: mature tree absorption ~22 kg CO2/year',
  confidence: 'medium',
  isEstimate: true,
};

export const PETROL_CO2_PER_LITRE: SourcedConstant<number> = {
  value: 2.31,
  sourceNote:
    'IPCC / US EPA standard combustion emission factor for finished motor gasoline (2.31 kg CO2/L)',
  confidence: 'high',
  isEstimate: false,
};

export const PM25_PER_CIGARETTE: SourcedConstant<number> = {
  value: 22.0,
  sourceNote:
    'Berkeley Earth methodology (Muller & Rohde 2015): 22 µg/m³ PM2.5 equates to ~1 cigarette/day exposure',
  confidence: 'medium',
  isEstimate: true,
};

export interface CalculatedDeterministicImpact {
  exposureReductionPercent: number;
  cigsAvoidedPerDay: number;
  monthlyCo2SavedKg: number;
  monthlyPetrolSavedLitres: number;
  treeMonthsEquivalent: number;
  confidence: 'high' | 'medium' | 'low';
  isEstimate: true;
}

export function computeDeterministicImpact(
  profile: HouseholdProfile,
  aqi: NaqiResult
): CalculatedDeterministicImpact {
  const purDrop = EXPOSURE_DROP_PURIFIER.value[profile.purifier] || 0;
  const budDrop = EXPOSURE_DROP_BUDGET.value[profile.budgetTier] || 0.15;
  const exhaustBonus = profile.kitchenExhaust ? 0.08 : 0.0;
  const totalDrop = Math.min(0.85, purDrop + budDrop + exhaustBonus);

  const cigsTotal = aqi.cigsPerDay;
  const cigsAvoided = Number((cigsTotal * totalDrop).toFixed(1));

  const roundTripKm = profile.commuteMode === 'wfh' ? 0 : profile.commuteKm;
  const co2Factor = CO2_PER_KM.value[profile.commuteMode] || 0;
  const monthlyCo2 = Number((roundTripKm * co2Factor * 22).toFixed(1));
  const monthlyPetrol = Number((monthlyCo2 / PETROL_CO2_PER_LITRE.value).toFixed(1));
  const treeMonths = Number((monthlyCo2 / (TREE_ABSORPTION_KG_CO2_YEAR.value / 12)).toFixed(1));

  return {
    exposureReductionPercent: Math.round(totalDrop * 100),
    cigsAvoidedPerDay: cigsAvoided,
    monthlyCo2SavedKg: monthlyCo2,
    monthlyPetrolSavedLitres: monthlyPetrol,
    treeMonthsEquivalent: treeMonths,
    confidence: 'medium',
    isEstimate: true,
  };
}

export interface ColonySimulationResult {
  families: number;
  daysPerWeek: number;
  monthlyCo2Kg: number;
  monthlyPetrolLitres: number;
  treesAnnualEquivalent: number;
  monthlyNoxGrams: number;
  confidence: 'medium';
  isEstimate: true;
  methodologyNote: string;
}

export function simulateColonyImpact(
  families: number,
  daysPerWeek: number,
  avgRoundTripKm = 16
): ColonySimulationResult {
  const cleanFamilies = Math.max(1, Math.min(10000, families));
  const cleanDays = Math.max(1, Math.min(7, daysPerWeek));
  const monthlyTripsPerFamily = cleanDays * WEEKS_PER_MONTH.value;

  const co2SavedPerTrip = avgRoundTripKm * CO2_PER_KM.value.solo_car;
  const noxSavedPerTrip = avgRoundTripKm * NOX_PER_KM.value.solo_car;

  const monthlyCo2 = Math.round(cleanFamilies * monthlyTripsPerFamily * co2SavedPerTrip);
  const monthlyPetrol = Math.round(monthlyCo2 / PETROL_CO2_PER_LITRE.value);
  const treesEq = Number((monthlyCo2 / TREE_ABSORPTION_KG_CO2_YEAR.value).toFixed(1));
  const monthlyNox = Math.round(cleanFamilies * monthlyTripsPerFamily * noxSavedPerTrip);

  return {
    families: cleanFamilies,
    daysPerWeek: cleanDays,
    monthlyCo2Kg: monthlyCo2,
    monthlyPetrolLitres: monthlyPetrol,
    treesAnnualEquivalent: treesEq,
    monthlyNoxGrams: monthlyNox,
    confidence: 'medium',
    isEstimate: true,
    methodologyNote:
      'Rough estimate based on swapping 1 solo car trip for clean transit/carpool per pledged family.',
  };
}
