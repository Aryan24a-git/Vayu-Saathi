import { describe, expect, it, vi } from 'vitest';
import { LruCache, RequestCoalescer } from '../../src/server/cache/lru';
import { lowestPm25Window } from '../../src/domain/forecast';
import {
  CircuitBreaker,
  ProviderError,
  fetchWithTimeout,
  retryWithBackoff,
} from '../../src/server/http/resilience';
import {
  clearAirQualityCaches,
  fetchOpenMeteoSnapshot,
} from '../../src/server/providers/openMeteoAirQuality';
import { clearGeocodingCache, searchOpenMeteo } from '../../src/server/providers/geocoding';
import airQualityFixture from '../fixtures/open-meteo/air-quality.json';
import geocodingFixture from '../fixtures/open-meteo/geocoding.json';

describe('LRU cache and coalescing', () => {
  it('evicts the least recently used entry and expires by TTL', () => {
    let now = 1000;
    const cache = new LruCache<string, number>({ ttlMs: 100, maxEntries: 2, now: () => now });
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.has('b')).toBe(false);
    now = 1100;
    expect(cache.get('a')).toBeUndefined();
  });

  it('coalesces identical in-flight calls', async () => {
    const coalescer = new RequestCoalescer<string, number>();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return calls;
    };
    const results = await Promise.all([
      coalescer.get('same', fetcher),
      coalescer.get('same', fetcher),
      coalescer.get('same', fetcher),
    ]);
    expect(results).toEqual([1, 1, 1]);
    expect(calls).toBe(1);
  });
});

describe('provider resilience', () => {
  it('maps the live Open-Meteo fields and records a cache hit', async () => {
    clearAirQualityCaches();
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      return new Response(JSON.stringify(airQualityFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const first = await fetchOpenMeteoSnapshot(52.524, 13.411, fetchImpl);
    const second = await fetchOpenMeteoSnapshot(52.521, 13.408, fetchImpl);
    expect(first.aqi).toBe(28);
    expect(first.pm25).toBe(5);
    expect(first.band).toBe('good');
    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });

  it('coalesces concurrent provider calls and saves upstream calls', async () => {
    clearGeocodingCache();
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response(JSON.stringify(geocodingFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const results = await Promise.all([
      searchOpenMeteo('Berlin', fetchImpl),
      searchOpenMeteo('Berlin', fetchImpl),
      searchOpenMeteo('Berlin', fetchImpl),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(calls).toBe(1);
  });

  it('returns typed schema errors for malformed and mismatched responses', async () => {
    clearAirQualityCaches();
    const malformed = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('bad json');
      },
    })) as unknown as typeof fetch;
    await expect(fetchOpenMeteoSnapshot(1, 1, malformed)).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'SCHEMA_ERROR',
    });

    clearAirQualityCaches();
    const mismatch = vi.fn(
      async () =>
        new Response(JSON.stringify({ hourly: { time: [], pm2_5: 'wrong' } }), { status: 200 })
    ) as unknown as typeof fetch;
    await expect(fetchOpenMeteoSnapshot(2, 2, mismatch)).rejects.toBeInstanceOf(ProviderError);
  });

  it('retries 500 responses and opens after repeated breaker failures', async () => {
    let calls = 0;
    const serverError = vi.fn(async () => {
      calls += 1;
      return new Response('bad', { status: 500 });
    }) as unknown as typeof fetch;
    await expect(
      retryWithBackoff(
        () => fetchWithTimeout(new URL('https://api.open-meteo.com/test'), 100, serverError),
        {
          timeoutMs: 100,
          maxRetries: 2,
          baseDelayMs: 1,
          fetchImpl: serverError,
        }
      )
    ).rejects.toBeInstanceOf(ProviderError);
    expect(calls).toBe(3);

    const breaker = new CircuitBreaker({ failureThreshold: 5, openMs: 30_000 });
    for (let index = 0; index < 5; index += 1) {
      await expect(
        breaker.execute(async () => {
          throw new ProviderError('HTTP_ERROR', 'failure');
        })
      ).rejects.toBeInstanceOf(ProviderError);
    }
    await expect(breaker.execute(async () => 1)).rejects.toMatchObject({ code: 'CIRCUIT_OPEN' });
  });

  it('times out and never throws a raw error', async () => {
    const timeoutFetch = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    ) as unknown as typeof fetch;
    await expect(
      fetchWithTimeout(new URL('https://api.open-meteo.com/test'), 5, timeoutFetch)
    ).rejects.toMatchObject({ name: 'ProviderError', code: 'TIMEOUT' });
  });
});

describe('forecast domain', () => {
  it('finds the lowest average PM2.5 window', () => {
    const result = lowestPm25Window([{ pm25: 20 }, { pm25: 10 }, { pm25: 8 }, { pm25: 30 }], 2);
    expect(result?.startIndex).toBe(1);
    expect(result?.minPm25).toBe(8);
  });
});
