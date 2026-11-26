// Pure community math, simulator, and local state validation
// Strictly typed, functions < 40 lines, file < 250 lines (NFR-004)

import { z } from 'zod';
import {
  CO2_PER_KM,
  NOX_PER_KM,
  PETROL_CO2_PER_LITRE,
  TREE_ABSORPTION_KG_CO2_YEAR,
  WEEKS_PER_MONTH,
} from './emissions';

export const PLEDGE_ACTIONS = [
  { id: 'pledge-transit', label: 'Swap 1 car trip/week for metro or bus', co2Kg: 2.8 },
  { id: 'pledge-wet-mop', label: 'Wet mop floors instead of dry broom', pm25Drop: 15 },
  { id: 'pledge-no-burn', label: 'Zero waste or dry leaf burning in ward', co2Kg: 5.2 },
  { id: 'pledge-idle-off', label: 'Turn engine off at society gate & signals', co2Kg: 1.1 },
  { id: 'pledge-window-seal', label: 'Seal windows before 5 PM inversion', pm25Drop: 25 },
] as const;

export const HotspotCategorySchema = z.enum([
  'Open Waste Burning',
  'Uncovered Construction Dust',
  'Traffic Choke Point',
]);
export type HotspotCategory = z.infer<typeof HotspotCategorySchema>;

export const LocalHotspotSchema = z.object({
  id: z.string().min(1),
  city: z.string().min(1).max(80),
  category: HotspotCategorySchema,
  locality: z.string().min(2).max(80),
  description: z.string().min(5).max(280),
  upvotes: z.number().int().min(0),
  createdAt: z.string().datetime().optional(),
});
export type LocalHotspot = z.infer<typeof LocalHotspotSchema>;

export interface ColonyProjection {
  families: number;
  daysPerWeek: number;
  monthlyCo2Kg: number;
  monthlyPetrolL: number;
  annualTreesEq: number;
  monthlyNoxGrams: number;
  label: 'rough estimate';
}

export function calculateColonyProjection(
  families: number,
  daysPerWeek: number,
  roundTripKm = 16
): ColonyProjection {
  const safeFamilies = Math.max(1, Math.min(10000, Math.round(families || 1)));
  const safeDays = Math.max(1, Math.min(7, Math.round(daysPerWeek || 1)));
  const monthlyRuns = safeDays * WEEKS_PER_MONTH.value;

  const co2PerTrip = roundTripKm * CO2_PER_KM.value.solo_car;
  const noxPerTrip = roundTripKm * NOX_PER_KM.value.solo_car;

  const monthlyCo2 = Math.round(safeFamilies * monthlyRuns * co2PerTrip);
  const monthlyPetrol = Math.round(monthlyCo2 / PETROL_CO2_PER_LITRE.value);
  const annualTrees = Number((monthlyCo2 / TREE_ABSORPTION_KG_CO2_YEAR.value).toFixed(1));
  const monthlyNox = Math.round(safeFamilies * monthlyRuns * noxPerTrip);

  return {
    families: safeFamilies,
    daysPerWeek: safeDays,
    monthlyCo2Kg: monthlyCo2,
    monthlyPetrolL: monthlyPetrol,
    annualTreesEq: annualTrees,
    monthlyNoxGrams: monthlyNox,
    label: 'rough estimate',
  };
}

export function computePledgeTotals(activePledgeIds: readonly string[]) {
  let co2SavedMonthlyKg = 0;
  for (const id of activePledgeIds) {
    const p = PLEDGE_ACTIONS.find((item) => item.id === id);
    if (p && 'co2Kg' in p) co2SavedMonthlyKg += p.co2Kg * WEEKS_PER_MONTH.value;
  }
  return {
    pledgeCount: activePledgeIds.length,
    co2SavedMonthlyKg: Number(co2SavedMonthlyKg.toFixed(1)),
    petrolSavedMonthlyL: Number((co2SavedMonthlyKg / PETROL_CO2_PER_LITRE.value).toFixed(1)),
  };
}
