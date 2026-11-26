import { z } from 'zod';
import { LruCache } from '../cache/lru';
import { ProviderError, fetchWithTimeout, retryWithBackoff } from '../http/resilience';

const WaqiResponseSchema = z.object({
  status: z.string(),
  data: z.unknown(),
});

const WaqiDataSchema = z.object({
  aqi: z.union([z.number(), z.string()]),
  city: z.object({ name: z.string() }).optional(),
  time: z
    .object({
      iso: z.string().optional(),
      s: z.string().optional(),
    })
    .optional(),
  iaqi: z
    .object({
      pm25: z.object({ v: z.number() }).optional(),
      pm10: z.object({ v: z.number() }).optional(),
      no2: z.object({ v: z.number() }).optional(),
      w: z.object({ v: z.number() }).optional(),
    })
    .optional(),
});

export interface WaqiStationReading {
  aqi: number;
  pm25: number;
  pm10: number;
  no2?: number;
  windKmh?: number;
  stationName?: string;
  timeIso?: string;
}

const STATION_CACHE = new LruCache<string, WaqiStationReading>({
  maxEntries: 200,
  ttlMs: 15 * 60 * 1000,
});

export function clearWaqiCache(): void {
  STATION_CACHE.clear();
}

function invertBreakpoints(
  aqi: number,
  table: readonly (readonly [number, number, number, number])[]
): number {
  const clamped = Math.max(0, Math.min(500, aqi));
  for (const [iLo, iHi, cLo, cHi] of table) {
    if (clamped <= iHi) {
      return Math.round(((clamped - iLo) / Math.max(1, iHi - iLo)) * (cHi - cLo) + cLo);
    }
  }
  return Math.round(clamped);
}

export function usAqiToPm25(aqi: number): number {
  return Math.max(
    1,
    invertBreakpoints(aqi, [
      [0, 50, 0, 12],
      [51, 100, 12.1, 35.4],
      [101, 150, 35.5, 55.4],
      [151, 200, 55.5, 150.4],
      [201, 300, 150.5, 250.4],
      [301, 500, 250.5, 500.4],
    ])
  );
}

export function usAqiToPm10(aqi: number): number {
  return Math.max(
    1,
    invertBreakpoints(aqi, [
      [0, 50, 0, 54],
      [51, 100, 55, 154],
      [101, 150, 155, 254],
      [151, 200, 255, 354],
      [201, 300, 355, 424],
      [301, 500, 425, 604],
    ])
  );
}

export async function fetchWaqiStation(
  lat: number,
  lon: number,
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<WaqiStationReading> {
  const rLat = Math.round(lat * 100) / 100;
  const rLon = Math.round(lon * 100) / 100;
  const key = `${rLat}:${rLon}`;
  const cached = STATION_CACHE.get(key);
  if (cached) return cached;

  const url = new URL(`https://api.waqi.info/feed/geo:${rLat};${rLon}/`);
  url.searchParams.set('token', token);
  const res = await retryWithBackoff(() => fetchWithTimeout(url, 4_000, fetchImpl), {
    timeoutMs: 4_000,
    maxRetries: 1,
  });
  if (!res.ok) throw new ProviderError('HTTP_ERROR', `WAQI HTTP ${res.status}`);

  const envParsed = WaqiResponseSchema.safeParse(await res.json());
  if (!envParsed.success || envParsed.data.status !== 'ok') {
    throw new ProviderError('HTTP_ERROR', 'WAQI station returned non-ok status');
  }
  const dParsed = WaqiDataSchema.safeParse(envParsed.data.data);
  if (!dParsed.success) throw new ProviderError('SCHEMA_ERROR', 'WAQI data schema mismatch');

  const d = dParsed.data;
  const rawAqi = Number(d.aqi);
  const pm25Sub = d.iaqi?.pm25?.v ?? (Number.isFinite(rawAqi) ? rawAqi : NaN);
  if (!Number.isFinite(pm25Sub)) {
    throw new ProviderError('SCHEMA_ERROR', 'WAQI station lacked PM2.5 or AQI reading');
  }

  const pm25 = usAqiToPm25(pm25Sub);
  const pm10 = d.iaqi?.pm10?.v != null ? usAqiToPm10(d.iaqi.pm10.v) : Math.round(pm25 * 1.4);
  const reading: WaqiStationReading = {
    aqi: Number.isFinite(rawAqi) ? Math.round(rawAqi) : Math.round(pm25Sub),
    pm25,
    pm10,
    no2: d.iaqi?.no2?.v != null ? Math.round(d.iaqi.no2.v) : undefined,
    windKmh: d.iaqi?.w?.v != null ? Math.max(1, Math.round(d.iaqi.w.v * 3.6)) : undefined,
    stationName: d.city?.name,
    timeIso: d.time?.iso ?? d.time?.s,
  };
  STATION_CACHE.set(key, reading);
  return reading;
}
