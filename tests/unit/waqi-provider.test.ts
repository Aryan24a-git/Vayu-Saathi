import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  clearWaqiCache,
  fetchWaqiStation,
  usAqiToPm10,
  usAqiToPm25,
} from '../../src/server/providers/waqiAirQuality';

describe('WAQI Air Quality Provider', () => {
  beforeEach(() => {
    clearWaqiCache();
  });

  it('converts US EPA AQI sub-indices back to PM2.5 and PM10 µg/m³', () => {
    expect(usAqiToPm25(50)).toBe(12);
    expect(usAqiToPm25(150)).toBe(55);
    expect(usAqiToPm10(100)).toBe(154);
  });

  it('parses WAQI feed response and rounds coordinates cleanly', async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      expect(String(url)).toContain('geo:28.66;77.22');
      return {
        ok: true,
        json: async () => ({
          status: 'ok',
          data: {
            aqi: 155,
            city: { name: 'ITO, Delhi' },
            time: { iso: '2026-11-26T15:00:00+05:30' },
            iaqi: {
              pm25: { v: 155 },
              pm10: { v: 110 },
              no2: { v: 24 },
              w: { v: 2.0 },
            },
          },
        }),
      } as Response;
    });

    const reading = await fetchWaqiStation(28.6612, 77.2219, 'dummy-token', fetchMock as never);
    expect(reading.aqi).toBe(155);
    expect(reading.pm25).toBeGreaterThan(55);
    expect(reading.windKmh).toBe(7);
    expect(reading.stationName).toBe('ITO, Delhi');
  });
});
