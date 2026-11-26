// /api/city-scenario unit tests — V2-30: SCENARIOS shortcut removed.
// q=delhi now geocodes live. Mocking via vi.mock at the provider module level.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the geocoding provider before any imports
vi.mock('../../src/server/providers/geocoding', () => ({
  clearGeocodingCache: vi.fn(),
  searchOpenMeteo: vi.fn(),
  OpenMeteoGeocodingProvider: vi.fn(),
}));

const GEOCODE_DELHI = [
  { id: 1, name: 'Delhi', latitude: 28.66, longitude: 77.22, country: 'India', admin1: 'Delhi' },
];

const MOCK_FETCH_AQ = {
  timezone_abbreviation: 'IST',
  current: { time: '2026-11-26T14:30', pm10: 220, pm2_5: 160, nitrogen_dioxide: 45 },
  hourly: { pm2_5: Array(48).fill(160), pm10: Array(48).fill(220) },
};

const MOCK_FETCH_WX = {
  current: { wind_speed_10m: 4, temperature_2m: 18 },
  hourly: { wind_speed_10m: Array(48).fill(4) },
};

describe('/api/city-scenario Endpoint', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear the LRU cache between tests to avoid cross-test pollution
    const { clearGeocodingCache } = await import('../../src/server/providers/geocoding');
    (clearGeocodingCache as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  });

  it('geocodes delhi live and returns isSynthetic=false', async () => {
    const { searchOpenMeteo } = await import('../../src/server/providers/geocoding');
    (searchOpenMeteo as ReturnType<typeof vi.fn>).mockResolvedValue(GEOCODE_DELHI);

    // Stub global fetch for Open-Meteo weather APIs
    vi.stubGlobal('fetch', async (url: string | URL) => {
      const u = String(url);
      if (u.includes('air-quality-api')) {
        return { ok: true, json: async () => MOCK_FETCH_AQ };
      }
      if (u.includes('api.open-meteo.com')) {
        return { ok: true, json: async () => MOCK_FETCH_WX };
      }
      return { ok: false, json: async () => ({}) };
    });

    const { GET } = await import('../../src/app/api/city-scenario/route');
    const req = new NextRequest('http://localhost:3000/api/city-scenario?q=delhi');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isSynthetic).toBe(false);
    expect(data.subtitle).toContain('Model estimate (Open-Meteo)');
    expect(data.subtitle).toContain('2:30 pm');
    expect('basePledges' in data).toBe(false);
    expect('baseCo2Kg' in data).toBe(false);
    expect(data.hourlyPM25).toHaveLength(24);
    expect(data.hourlyWind).toHaveLength(24);
    expect(data.pm25).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it('extractHourlySeries returns typed error when missing or shorter than 24 values (no padding)', async () => {
    const { extractHourlySeries } = await import('../../src/server/api/cityScenario');
    expect(extractHourlySeries(undefined)).toEqual({
      ok: false,
      error: 'HOURLY_DATA_UNAVAILABLE',
      message: 'Hourly forecast unavailable',
    });
    expect(extractHourlySeries([120, 130, 140])).toEqual({
      ok: false,
      error: 'HOURLY_DATA_UNAVAILABLE',
      message: 'Hourly forecast unavailable',
    });
  });

  it('returns 404 when city not found in geocoding', async () => {
    const { searchOpenMeteo } = await import('../../src/server/providers/geocoding');
    (searchOpenMeteo as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const { GET } = await import('../../src/app/api/city-scenario/route');
    const req = new NextRequest('http://localhost:3000/api/city-scenario?q=unknowncityzz');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns 502 when Open-Meteo provider is unavailable', async () => {
    const { searchOpenMeteo } = await import('../../src/server/providers/geocoding');
    (searchOpenMeteo as ReturnType<typeof vi.fn>).mockResolvedValue(GEOCODE_DELHI);

    vi.stubGlobal('fetch', async () => ({ ok: false, json: async () => ({}) }));

    const { GET } = await import('../../src/app/api/city-scenario/route');
    const req = new NextRequest('http://localhost:3000/api/city-scenario?q=mumbai');
    const res = await GET(req);
    expect(res.status).toBe(502);
    vi.unstubAllGlobals();
  });

  it('rejects too-short city query with 400', async () => {
    const { GET } = await import('../../src/app/api/city-scenario/route');
    const req = new NextRequest('http://localhost:3000/api/city-scenario?q=a');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
