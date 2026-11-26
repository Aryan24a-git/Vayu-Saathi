import { z } from 'zod';
import { findBandByPm25 } from '../../domain/bands';
import type { AirQualitySnapshot } from '../../domain/types';
import { logger } from '../../lib/logger';
import { LruCache, RequestCoalescer } from '../cache/lru';
import {
  CircuitBreaker,
  ProviderError,
  retryWithBackoff,
  fetchWithTimeout,
} from '../http/resilience';
import type { AirQualityProvider, ForecastReading } from './airQuality';

const ResponseSchema = z.object({
  current: z
    .object({
      time: z.string(),
      pm2_5: z.number().nullable(),
      us_aqi: z.number().nullable(),
    })
    .optional(),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number().nullable()),
    us_aqi: z.array(z.number().nullable()),
  }),
});

const AQI_CACHE = new LruCache<string, AirQualitySnapshot>({
  maxEntries: 500,
  ttlMs: 15 * 60 * 1000,
});
const AQI_CALLS = new RequestCoalescer<string, AirQualitySnapshot>();
const BREAKER = new CircuitBreaker({ failureThreshold: 5, openMs: 30_000 });

export function roundCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
}

export function clearAirQualityCaches(): void {
  AQI_CACHE.clear();
  AQI_CALLS.clear();
  BREAKER.reset();
}

export function airQualityCacheSize(): number {
  return AQI_CACHE.size;
}

export function coalescedCallsInFlight(): number {
  return AQI_CALLS.size;
}

function timestampFrom(time: string): string {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(time) ? time : `${time}:00Z`;
}

function buildSnapshotUrl(lat: number, lon: number): URL {
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'pm2_5,us_aqi');
  url.searchParams.set('hourly', 'pm2_5,us_aqi');
  url.searchParams.set('forecast_days', '2');
  return url;
}

function parseSnapshot(raw: unknown): AirQualitySnapshot {
  let parsed: z.infer<typeof ResponseSchema>;
  try {
    parsed = ResponseSchema.parse(raw);
  } catch (error) {
    throw new ProviderError('SCHEMA_ERROR', 'Upstream response did not match schema', error);
  }
  const current = parsed.current;
  const pm25 = current?.pm2_5 ?? parsed.hourly.pm2_5.find((value) => value !== null);
  const aqi = current?.us_aqi ?? parsed.hourly.us_aqi.find((value) => value !== null);
  if (pm25 == null || aqi == null) {
    throw new ProviderError('SCHEMA_ERROR', 'Upstream response contained no current values');
  }
  return {
    aqi,
    pm25,
    timestamp: timestampFrom(current?.time ?? parsed.hourly.time[0] ?? new Date().toISOString()),
    provider: 'Open-Meteo Air Quality',
    band: findBandByPm25(pm25).key,
    isStale: false,
    isFallback: false,
  };
}

async function loadSnapshot(
  rounded: { lat: number; lon: number },
  fetchImpl: typeof fetch
): Promise<AirQualitySnapshot> {
  try {
    const url = buildSnapshotUrl(rounded.lat, rounded.lon);
    const response = await retryWithBackoff(() => fetchWithTimeout(url, 4_000, fetchImpl), {
      timeoutMs: 4_000,
      maxRetries: 2,
      baseDelayMs: 200,
      fetchImpl,
    });
    if (!response.ok) throw new ProviderError('HTTP_ERROR', `Upstream returned ${response.status}`);
    return parseSnapshot(await readJson(response));
  } catch (error) {
    logger.warn('providerFailure', { counter: 'providerFailure', provider: 'air-quality' });
    throw error instanceof ProviderError
      ? error
      : new ProviderError('NETWORK_ERROR', 'Air quality provider failed', error);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new ProviderError('SCHEMA_ERROR', 'Upstream returned malformed JSON', error);
  }
}

export async function fetchOpenMeteoSnapshot(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch
): Promise<AirQualitySnapshot> {
  const rounded = roundCoordinates(lat, lon);
  const key = `${rounded.lat},${rounded.lon}`;
  const cached = AQI_CACHE.get(key);
  if (cached) {
    logger.info('cacheHit', { counter: 'cacheHit', provider: 'air-quality' });
    return cached;
  }
  return AQI_CALLS.get(key, () =>
    BREAKER.execute(async () => {
      const snapshot = await loadSnapshot(rounded, fetchImpl);
      AQI_CACHE.set(key, snapshot);
      return snapshot;
    })
  );
}

export async function fetchOpenMeteoForecast(
  lat: number,
  lon: number,
  hours: number,
  fetchImpl: typeof fetch = fetch
): Promise<readonly ForecastReading[]> {
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) return [];
  const rounded = roundCoordinates(lat, lon);
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', String(rounded.lat));
  url.searchParams.set('longitude', String(rounded.lon));
  url.searchParams.set('hourly', 'pm2_5,us_aqi');
  url.searchParams.set('forecast_days', '7');
  try {
    const response = await retryWithBackoff(() => fetchWithTimeout(url, 4_000, fetchImpl), {
      timeoutMs: 4_000,
      maxRetries: 2,
      baseDelayMs: 200,
      fetchImpl,
    });
    if (!response.ok) throw new ProviderError('HTTP_ERROR', `Upstream returned ${response.status}`);
    let raw: unknown;
    try {
      raw = await response.json();
    } catch (error) {
      throw new ProviderError('SCHEMA_ERROR', 'Upstream returned malformed JSON', error);
    }
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success)
      throw new ProviderError('SCHEMA_ERROR', 'Upstream response did not match schema');
    return parsed.data.hourly.time.slice(0, hours).map((time, index) => ({
      time,
      pm25: parsed.data.hourly.pm2_5[index] ?? 0,
      aqi: parsed.data.hourly.us_aqi[index] ?? 0,
    }));
  } catch (error) {
    logger.warn('providerFailure', {
      counter: 'providerFailure',
      provider: 'air-quality-forecast',
    });
    throw error instanceof ProviderError
      ? error
      : new ProviderError('NETWORK_ERROR', 'Air quality forecast failed', error);
  }
}

export class OpenMeteoAirQualityProvider implements AirQualityProvider {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  fetchSnapshot(lat: number, lon: number): Promise<AirQualitySnapshot> {
    return fetchOpenMeteoSnapshot(lat, lon, this.fetchImpl);
  }

  fetchForecast(lat: number, lon: number, hours: number): Promise<readonly ForecastReading[]> {
    return fetchOpenMeteoForecast(lat, lon, hours, this.fetchImpl);
  }
}
