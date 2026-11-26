import { z } from 'zod';
import { logger } from '../../lib/logger';
import { LruCache, RequestCoalescer } from '../cache/lru';
import {
  CircuitBreaker,
  ProviderError,
  fetchWithTimeout,
  retryWithBackoff,
} from '../http/resilience';

const ResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string(),
  admin1: z.string().optional(),
});

const ResponseSchema = z.object({ results: z.array(ResultSchema).optional() });

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface GeocodingProvider {
  search(query: string): Promise<readonly GeocodingResult[]>;
  reverse(latitude: number, longitude: number): Promise<GeocodingResult | null>;
}

const CACHE = new LruCache<string, readonly GeocodingResult[]>({
  maxEntries: 200,
  ttlMs: 24 * 60 * 60 * 1000,
});
const CALLS = new RequestCoalescer<string, readonly GeocodingResult[]>();
const BREAKER = new CircuitBreaker({ failureThreshold: 5, openMs: 30_000 });

export function clearGeocodingCache(): void {
  CACHE.clear();
  CALLS.clear();
  BREAKER.reset();
}

export async function searchOpenMeteo(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<readonly GeocodingResult[]> {
  const clean = query.trim();
  if (clean.length < 2 || clean.length > 100) return [];
  const key = clean.toLowerCase();
  const cached = CACHE.get(key);
  if (cached) {
    logger.info('cacheHit', { counter: 'cacheHit', provider: 'geocoding' });
    return cached;
  }
  return CALLS.get(key, () =>
    BREAKER.execute(async () => {
      try {
        const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
        url.searchParams.set('name', clean);
        url.searchParams.set('count', '5');
        url.searchParams.set('language', 'en');
        url.searchParams.set('format', 'json');
        const response = await retryWithBackoff(() => fetchWithTimeout(url, 3_000, fetchImpl), {
          timeoutMs: 3_000,
          maxRetries: 2,
          baseDelayMs: 200,
          fetchImpl,
        });
        if (!response.ok)
          throw new ProviderError('HTTP_ERROR', `Upstream returned ${response.status}`);
        let raw: unknown;
        try {
          raw = await response.json();
        } catch (error) {
          throw new ProviderError('SCHEMA_ERROR', 'Upstream returned malformed JSON', error);
        }
        const parsed = ResponseSchema.safeParse(raw);
        if (!parsed.success)
          throw new ProviderError('SCHEMA_ERROR', 'Upstream response did not match schema');
        const results = parsed.data.results ?? [];
        CACHE.set(key, results);
        return results;
      } catch (error) {
        logger.warn('providerFailure', { counter: 'providerFailure', provider: 'geocoding' });
        throw error instanceof ProviderError
          ? error
          : new ProviderError('NETWORK_ERROR', 'Geocoding provider failed', error);
      }
    })
  );
}

export class OpenMeteoGeocodingProvider implements GeocodingProvider {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  search(query: string): Promise<readonly GeocodingResult[]> {
    return searchOpenMeteo(query, this.fetchImpl);
  }

  reverse(_latitude: number, _longitude: number): Promise<GeocodingResult | null> {
    return Promise.resolve(null);
  }
}
