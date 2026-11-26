// CPCB NAQI and Ventilation Window Unit Tests (REQ-021, REQ-025)
import { describe, expect, it } from 'vitest';
import {
  calculateCPCBNAQI,
  safeCalculateCPCBNAQI,
  calcSubIndex,
  findSafeVentilationWindow,
  PM25_BREAKPOINTS,
  PM10_BREAKPOINTS,
  NO2_BREAKPOINTS,
} from '../../src/domain/naqi';

describe('CPCB NAQI calculations', () => {
  it('correctly calculates sub-index for PM2.5 in good range', () => {
    const sub = calcSubIndex(20, PM25_BREAKPOINTS);
    expect(sub).toBeGreaterThan(0);
    expect(sub).toBeLessThanOrEqual(50);
  });

  it('tests exact breakpoint boundaries for PM2.5', () => {
    expect(calcSubIndex(30, PM25_BREAKPOINTS)).toBe(50);
    expect(calcSubIndex(60, PM25_BREAKPOINTS)).toBe(100);
    expect(calcSubIndex(90, PM25_BREAKPOINTS)).toBe(200);
    expect(calcSubIndex(120, PM25_BREAKPOINTS)).toBe(300);
    expect(calcSubIndex(250, PM25_BREAKPOINTS)).toBe(400);
    expect(calcSubIndex(380, PM25_BREAKPOINTS)).toBe(500);
  });

  it('caps above-range extrapolation at 500', () => {
    expect(calcSubIndex(600, PM25_BREAKPOINTS)).toBe(500);
    expect(calcSubIndex(1000, PM10_BREAKPOINTS)).toBe(500);
    expect(calcSubIndex(800, NO2_BREAKPOINTS)).toBe(500);
  });

  it('identifies dominant pollutant and band correctly for severe Delhi smog', () => {
    const result = calculateCPCBNAQI(285, 410, 84);
    expect(result.naqi).toBeGreaterThanOrEqual(400);
    expect(result.band.label).toBe('Severe');
    expect(result.cigsPerDay).toBeCloseTo(285 / 22, 1);
  });

  it('selects PM10 as dominant when PM10 sub-index exceeds PM2.5', () => {
    // PM2.5=40 -> sub=67, PM10=300 -> sub=251
    const result = calculateCPCBNAQI(40, 300, 20);
    expect(result.dominant).toBe('PM10');
    expect(result.naqi).toBe(251);
  });

  it('selects NO2 as dominant when NO2 sub-index exceeds PM', () => {
    // PM2.5=20 -> sub=33, PM10=30 -> sub=30, NO2=250 -> sub=270
    const result = calculateCPCBNAQI(20, 30, 250);
    expect(result.dominant).toBe('NO₂');
  });

  it('identifies moderate conditions correctly', () => {
    const result = calculateCPCBNAQI(64, 112, 48);
    expect(result.band.label).toBe('Moderately Polluted');
  });

  it('computes cigarette equivalence using Berkeley Earth formula (PM2.5 / 22)', () => {
    const result = calculateCPCBNAQI(110, 150, 40);
    expect(result.cigsPerDay).toBe(5.0);
  });

  it('throws TypeError or returns typed error on non-finite input', () => {
    expect(() => calculateCPCBNAQI(NaN, 100, 50)).toThrow(TypeError);
    expect(() => calculateCPCBNAQI(100, Infinity, 50)).toThrow(TypeError);

    const safe = safeCalculateCPCBNAQI(NaN, 100);
    expect(safe.ok).toBe(false);
    if (!safe.ok) {
      expect(safe.error.code).toBe('INVALID_INPUT');
    }
  });
});

describe('Thermal Inversion & Ventilation Window (REQ-021)', () => {
  const hourlyPM25 = [
    315, 328, 332, 330, 322, 310, 302, 292, 285, 255, 215, 180, 152, 138, 134, 142, 165, 205, 248,
    288, 318, 334, 340, 330,
  ];
  const hourlyWind = [
    3.2, 3.0, 2.8, 2.8, 3.1, 3.5, 3.8, 4.0, 4.5, 5.8, 7.4, 9.2, 11.0, 12.4, 12.8, 11.6, 9.5, 7.2,
    5.6, 4.5, 3.8, 3.4, 3.2, 3.1,
  ];

  it('finds safe daytime ventilation window during midday wind dispersion', () => {
    const vent = findSafeVentilationWindow(hourlyPM25, hourlyWind, 10);
    expect(vent.startHour).toBeGreaterThanOrEqual(10);
    expect(vent.startHour).toBeLessThanOrEqual(15);
    expect(vent.endHour).toBe(vent.startHour + 2);
    expect(vent.windowLabel).toContain('M');
    expect(vent.sealHour).toBeGreaterThan(vent.endHour);
    expect(vent.isTomorrow).toBe(false);
    expect(vent.heuristicNote).toContain('Heuristic model');
  });

  it('falls back to tomorrow forecast when evaluated after 16:00 (evening smog inversion)', () => {
    const vent = findSafeVentilationWindow(hourlyPM25, hourlyWind, 19);
    expect(vent.isTomorrow).toBe(true);
    expect(vent.startHour).toBeGreaterThanOrEqual(11);
    expect(vent.startHour).toBeLessThanOrEqual(14);
    expect(vent.windowLabel).toContain('Tomorrow');
    expect(vent.heuristicNote).toBeDefined();
  });
});
