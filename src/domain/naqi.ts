// CPCB NAQI & Thermal Inversion Engine
// Strictly typed, functions < 40 lines, file < 250 lines (NFR-004)
// Source: Central Pollution Control Board (CPCB), Ministry of Environment, Forest & Climate Change (2014)

import { ok, err, type Result } from './result';

export interface CpcbBand {
  max: number;
  label: string;
  color: string;
  softBg: string;
  border: string;
  note: string;
}

export const CPCB_BANDS: readonly CpcbBand[] = [
  {
    max: 50,
    label: 'Good',
    color: '#15803d',
    softBg: '#F0FDF4',
    border: '#BBF7D0',
    note: 'Minimal health impact. Great day for outdoor walks and natural cross-ventilation.',
  },
  {
    max: 100,
    label: 'Satisfactory',
    color: '#4d7c0f',
    softBg: '#F7FEE7',
    border: '#D9F99D',
    note: 'Minor breathing discomfort only for extremely sensitive people.',
  },
  {
    max: 200,
    label: 'Moderately Polluted',
    color: '#a16207',
    softBg: '#FEFCE8',
    border: '#FEF08A',
    note: 'Sensitive groups (asthma, kids, seniors) should avoid heavy outdoor exertion near traffic.',
  },
  {
    max: 300,
    label: 'Poor',
    color: '#c2410c',
    softBg: '#FFF7ED',
    border: '#FED7AA',
    note: 'Prolonged exposure causes breathing discomfort. Keep windows sealed during morning/evening peaks.',
  },
  {
    max: 400,
    label: 'Very Poor',
    color: '#dc2626',
    softBg: '#FEF2F2',
    border: '#FECACA',
    note: 'High risk of respiratory illness. Avoid morning walks, wear a well-fitted N95 outdoors.',
  },
  {
    max: 500,
    label: 'Severe',
    color: '#7f1d1d',
    softBg: '#FEF2F2',
    border: '#FCA5A5',
    note: 'Health emergency even for healthy people. Heavy winter inversion traps toxic smog near ground level.',
  },
];

export const PM25_BREAKPOINTS: readonly [number, number, number, number][] = [
  [0, 30, 0, 50],
  [30, 60, 51, 100],
  [60, 90, 101, 200],
  [90, 120, 201, 300],
  [120, 250, 301, 400],
  [250, 380, 401, 500],
];

export const PM10_BREAKPOINTS: readonly [number, number, number, number][] = [
  [0, 50, 0, 50],
  [50, 100, 51, 100],
  [100, 250, 101, 200],
  [250, 350, 201, 300],
  [350, 430, 301, 400],
  [430, 510, 401, 500],
];

export const NO2_BREAKPOINTS: readonly [number, number, number, number][] = [
  [0, 40, 0, 50],
  [40, 80, 51, 100],
  [80, 180, 101, 200],
  [180, 280, 201, 300],
  [280, 400, 301, 400],
  [400, 520, 401, 500],
];

export function calcSubIndex(
  conc: number,
  breakpoints: readonly [number, number, number, number][]
): number {
  if (conc === undefined || conc === null || !Number.isFinite(conc)) {
    throw new TypeError(`Concentration must be a finite number; received ${conc}`);
  }
  const val = Math.max(0, conc);
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (val <= cHigh) {
      return ((iHigh - iLow) / (cHigh - cLow)) * (val - cLow) + iLow;
    }
  }
  const [cLow, cHigh, iLow, iHigh] = breakpoints[breakpoints.length - 1];
  const ext = ((iHigh - iLow) / (cHigh - cLow)) * (val - cLow) + iLow;
  return Math.min(500, Math.round(ext));
}

export interface NaqiResult {
  naqi: number;
  dominant: 'PM2.5' | 'PM10' | 'NO₂';
  band: CpcbBand;
  cigsPerDay: number;
  subIndices: { subPM25: number; subPM10: number; subNO2: number };
}

export interface NaqiError {
  code: 'INVALID_INPUT';
  message: string;
}

export function calculateCPCBNAQI(pm25: number, pm10: number, no2 = 0): NaqiResult {
  if (!Number.isFinite(pm25) || !Number.isFinite(pm10) || !Number.isFinite(no2)) {
    throw new TypeError(
      `CPCB NAQI inputs must be finite numbers; received pm25=${pm25}, pm10=${pm10}, no2=${no2}`
    );
  }

  const subPM25 = Math.round(calcSubIndex(pm25, PM25_BREAKPOINTS));
  const subPM10 = Math.round(calcSubIndex(pm10, PM10_BREAKPOINTS));
  const subNO2 = Math.round(calcSubIndex(no2, NO2_BREAKPOINTS));

  let naqi = subPM25;
  let dominant: 'PM2.5' | 'PM10' | 'NO₂' = 'PM2.5';
  if (subPM10 > naqi) {
    naqi = subPM10;
    dominant = 'PM10';
  }
  if (subNO2 > naqi) {
    naqi = subNO2;
    dominant = 'NO₂';
  }
  naqi = Math.min(500, Math.max(1, naqi));
  const band = CPCB_BANDS.find((b) => naqi <= b.max) || CPCB_BANDS[CPCB_BANDS.length - 1];
  const cigsPerDay = Number((Math.max(0, pm25) / 22).toFixed(1));

  return { naqi, dominant, band, cigsPerDay, subIndices: { subPM25, subPM10, subNO2 } };
}

export function safeCalculateCPCBNAQI(
  pm25: number,
  pm10: number,
  no2 = 0
): Result<NaqiResult, NaqiError> {
  if (!Number.isFinite(pm25) || !Number.isFinite(pm10) || !Number.isFinite(no2)) {
    return err({
      code: 'INVALID_INPUT',
      message: 'Pollutant concentrations must be finite numbers',
    });
  }
  return ok(calculateCPCBNAQI(pm25, pm10, no2));
}

export function formatHour12(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

export interface VentilationWindow {
  startHour: number;
  endHour: number;
  sealHour: number;
  windowLabel: string;
  sealLabel: string;
  avgWindowPM: number;
  avgWindowWind: number;
  isTomorrow?: boolean;
  heuristicNote?: string;
}

export function findSafeVentilationWindow(
  hourlyPM25: readonly number[],
  hourlyWind: readonly number[],
  currentHour?: number
): VentilationWindow {
  const minPM = Math.min(...hourlyPM25);
  const maxPM = Math.max(...hourlyPM25);
  const pmRange = Math.max(1, maxPM - minPM);
  const minW = Math.min(...hourlyWind);
  const maxW = Math.max(...hourlyWind);
  const wRange = Math.max(1, maxW - minW);

  const nowHour = currentHour ?? 12;
  const isPastToday = nowHour >= 16;
  const startSearch = isPastToday ? 11 : Math.max(10, nowHour);
  const endSearch = 15;

  let bestStart = startSearch;
  let bestScore = Infinity;

  for (let h = startSearch; h <= endSearch; h++) {
    const nextH = Math.min(23, h + 1);
    const avgPM = (hourlyPM25[h] + hourlyPM25[nextH]) / 2;
    const avgWind = (hourlyWind[h] + hourlyWind[nextH]) / 2;
    const score = ((avgPM - minPM) / pmRange) * 0.75 + (1 - (avgWind - minW) / wRange) * 0.25;
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
    heuristicNote: 'Heuristic model based on diurnal boundary layer mixing heights.',
  };
}
