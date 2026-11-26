// Unit tests for ventilation engine (REQ-021)
import { describe, it, expect } from 'vitest';
import { findSafeVentilationWindow, PM25_WEIGHT, WIND_WEIGHT } from '../../src/domain/ventilation';

describe('Safe Ventilation Window Engine', () => {
  it('exports verified 75/25 diurnal weighting constants', () => {
    expect(PM25_WEIGHT).toBe(0.75);
    expect(WIND_WEIGHT).toBe(0.25);
  });

  it('rejects series with fewer than 24 hours with typed reason', () => {
    const res = findSafeVentilationWindow([100, 200], [5, 6]);
    expect('window' in res).toBe(true);
    if ('window' in res) {
      expect(res.window).toBeNull();
      expect(res.reason).toContain('INSUFFICIENT_DATA');
    }
  });

  it('identifies midday ventilation window during active daytime hours', () => {
    const hourlyPM = Array.from({ length: 24 }, (_, i) => (i >= 11 && i <= 14 ? 120 : 350));
    const hourlyW = Array.from({ length: 24 }, (_, i) => (i >= 11 && i <= 14 ? 12 : 3));

    const res = findSafeVentilationWindow(hourlyPM, hourlyW, 10);
    expect('startHour' in res).toBe(true);
    if ('startHour' in res) {
      expect(res.startHour).toBeGreaterThanOrEqual(10);
      expect(res.startHour).toBeLessThanOrEqual(14);
      expect(res.isTomorrow).toBe(false);
      expect(res.isHeuristic).toBe(true);
    }
  });

  it('falls back to tomorrow when evaluated after 16:00', () => {
    const hourlyPM = Array.from({ length: 24 }, () => 200);
    const hourlyW = Array.from({ length: 24 }, () => 8);

    const res = findSafeVentilationWindow(hourlyPM, hourlyW, 18);
    expect('isTomorrow' in res).toBe(true);
    if ('isTomorrow' in res) {
      expect(res.isTomorrow).toBe(true);
      expect(res.windowLabel).toContain('Tomorrow');
    }
  });
});
