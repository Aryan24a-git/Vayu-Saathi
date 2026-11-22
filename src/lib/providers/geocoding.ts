// Satisfies: REQ-001, SEC-006
// Open-Meteo Geocoding provider.

import { z } from 'zod';
import { LruCache } from '../cache';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

const GeoResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string(),
  admin1: z.string().optional(),
});

const GeoResponseSchema = z.object({
  results: z.array(GeoResultSchema).optional(),
});

const geoCache = new LruCache<string, GeocodingResult[]>({
  maxEntries: 200,
  ttlMs: 24 * 60 * 60 * 1000,
});

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return [];

  const cached = geoCache.get(clean);
  if (cached) return cached;

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', clean);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return [];

    const raw: unknown = await res.json();
    const parsed = GeoResponseSchema.parse(raw);
    const results = parsed.results ?? [];
    geoCache.set(clean, results);
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
