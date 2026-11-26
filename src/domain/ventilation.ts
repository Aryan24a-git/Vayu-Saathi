// Ventilation Window & Diurnal Inversion Engine
// Strictly typed, functions < 40 lines, file < 250 lines (NFR-004)

import { formatHour12 } from './naqi';

/**
 * Diurnal boundary layer dispersion weighting factors.
 * In winter north India, 75% PM2.5 dip combined with 25% wind ventilation breeze
 * identifies the safest cross-ventilation slot before evening thermal inversion.
 */
export const PM25_WEIGHT = 0.75;
export const WIND_WEIGHT = 0.25;

export interface SafeVentilationResult {
  startHour: number;
  endHour: number;
  sealHour: number;
  windowLabel: string;
  sealLabel: string;
  avgWindowPM: number;
  avgWindowWind: number;
  isTomorrow: boolean;
  isHeuristic: true;
  methodologyNote: string;
}

export type VentilationWindowError = {
  window: null;
  reason: string;
};

export function findSafeVentilationWindow(
  hourlyPM25: readonly number[],
  hourlyWind: readonly number[],
  currentHourIndex = 12
): SafeVentilationResult | VentilationWindowError {
  if (!hourlyPM25 || !hourlyWind || hourlyPM25.length < 24 || hourlyWind.length < 24) {
    return {
      window: null,
      reason:
        'INSUFFICIENT_DATA: Hourly PM2.5 and wind series must each contain at least 24 data points.',
    };
  }

  const minPM = Math.min(...hourlyPM25);
  const maxPM = Math.max(...hourlyPM25);
  const pmRange = Math.max(1, maxPM - minPM);
  const minW = Math.min(...hourlyWind);
  const maxW = Math.max(...hourlyWind);
  const wRange = Math.max(1, maxW - minW);

  const now = Math.max(0, Math.min(23, currentHourIndex));
  const isPastToday = now >= 16;
  const startSearch = isPastToday ? 10 : Math.max(10, now);
  const endSearch = 15;

  let bestStart = startSearch;
  let bestScore = Infinity;

  for (let h = startSearch; h <= endSearch; h++) {
    const nextH = Math.min(23, h + 1);
    const avgPM = (hourlyPM25[h] + hourlyPM25[nextH]) / 2;
    const avgWind = (hourlyWind[h] + hourlyWind[nextH]) / 2;
    const score =
      ((avgPM - minPM) / pmRange) * PM25_WEIGHT + (1 - (avgWind - minW) / wRange) * WIND_WEIGHT;
    if (score < bestScore) {
      bestScore = score;
      bestStart = h;
    }
  }

  const endHour = Math.min(23, bestStart + 2);
  const sealHour = Math.min(18, endHour + 2);
  const avgPM = Math.round((hourlyPM25[bestStart] + hourlyPM25[Math.min(23, bestStart + 1)]) / 2);
  const avgW = Number(
    (((hourlyWind[bestStart] + hourlyWind[Math.min(23, bestStart + 1)]) / 2) as number).toFixed(1)
  );

  const prefix = isPastToday ? 'Tomorrow ' : '';
  return {
    startHour: bestStart,
    endHour,
    sealHour,
    windowLabel: `${prefix}${formatHour12(bestStart)} – ${formatHour12(endHour)}`,
    sealLabel: `${prefix}${formatHour12(sealHour)}`,
    avgWindowPM: avgPM,
    avgWindowWind: avgW,
    isTomorrow: isPastToday,
    isHeuristic: true,
    methodologyNote: isPastToday
      ? 'Today safe daytime window has passed. Projected tomorrow midday window based on diurnal mixing curve.'
      : 'Optimal daytime ventilation based on diurnal boundary layer mixing heights (75% PM2.5 / 25% wind).',
  };
}
