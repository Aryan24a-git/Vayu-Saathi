// Satisfies: REQ-003, REL-001, REL-002, SEC-006, PERF-002, DATA-001
// Open-Meteo Air Quality provider with cache, timeout, and coordinate rounding.

import { z } from 'zod';
import { LruCache, RequestCoalescer } from '../cache';
import { logger } from '../logger';

export interface AqiReading {
  aqi: number;
  pm25: number;
  timestamp: string;
  source: string;
  isFallback: boolean;
  isStale: boolean;
}

export interface AqiProvider {
  fetchCurrent(lat: number, lon: number): Promise<AqiReading>;
}

const ALLOWED_HOSTS = new Set(['api.open-meteo.com', 'air-quality-api.open-meteo.com']);

function assertAllowedHost(url: URL): void {
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`SSRF guard: host ${url.hostname} is not allowed`);
  }
}

export function roundCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.round(lat * 100) / 100,
    lon: Math.round(lon * 100) / 100,
  };
}

const OpenMeteoHourlySchema = z.object({
  time: z.array(z.string()),
  pm2_5: z.array(z.number().nullable()),
  us_aqi: z.array(z.number().nullable()),
});

const OpenMeteoResponseSchema = z.object({
  hourly: OpenMeteoHourlySchema,
});

const aqiCache = new LruCache<string, AqiReading>({
  maxEntries: 500,
  ttlMs: 15 * 60 * 1000,
});
const coalescer = new RequestCoalescer<string, AqiReading>();

async function fetchWithTimeout(url: URL, timeoutMs = 5000): Promise<Response> {
  assertAllowedHost(url);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function extractCurrentReading(parsed: z.infer<typeof OpenMeteoResponseSchema>): {
  aqi: number;
  pm25: number;
  timestamp: string;
} {
  const times = parsed.hourly.time;
  const now = new Date();
  const nowHour = `${now.toISOString().slice(0, 13)}:00`;
  const idx = times.findIndex((t) => t.startsWith(nowHour.slice(0, 13)));
  const targetIdx = idx >= 0 ? idx : Math.max(0, times.length - 1);

  return {
    pm25: parsed.hourly.pm2_5[targetIdx] ?? 0,
    aqi: parsed.hourly.us_aqi[targetIdx] ?? 0,
    timestamp: times[targetIdx] ?? new Date().toISOString(),
  };
}

export async function fetchCurrentAqi(lat: number, lon: number): Promise<AqiReading> {
  const { lat: rLat, lon: rLon } = roundCoordinates(lat, lon);
  const cacheKey = `${rLat},${rLon}`;

  const cached = aqiCache.get(cacheKey);
  if (cached) return cached;

  return coalescer.get(cacheKey, async () => {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', String(rLat));
    url.searchParams.set('longitude', String(rLon));
    url.searchParams.set('hourly', 'pm2_5,us_aqi');
    url.searchParams.set('forecast_days', '1');

    try {
      const response = await fetchWithTimeout(url, 5000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const raw: unknown = await response.json();
      const parsed = OpenMeteoResponseSchema.parse(raw);
      const current = extractCurrentReading(parsed);

      const reading: AqiReading = {
        ...current,
        source: 'Open-Meteo Air Quality',
        isFallback: false,
        isStale: false,
      };

      aqiCache.set(cacheKey, reading);
      return reading;
    } catch (err) {
      logger.warn('Failed to fetch live AQI, returning safe fallback reading', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        aqi: 155,
        pm25: 65,
        timestamp: new Date().toISOString(),
        source: 'Fallback estimate (Provider unreachable)',
        isFallback: true,
        isStale: true,
      };
    }
  });
}
