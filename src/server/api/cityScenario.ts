import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { LocationScenario } from '@/domain/scenarios';
import { searchCities } from '@/lib/providers/geocoding';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { boundaryError, MAX_QUERY_LENGTH } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';
import { LruCache } from '@/server/cache/lru';

const limiter = new TokenBucketLimiter(30, 60_000, new MemoryBucketStore());
const scenarioCache = new LruCache<string, LocationScenario>({
  maxEntries: 100,
  ttlMs: 15 * 60 * 1000,
});
const QuerySchema = z.object({ q: z.string().trim().min(2).max(MAX_QUERY_LENGTH) });

interface MeteoPayload {
  aq: {
    current: { pm10: number; pm2_5: number; nitrogen_dioxide?: number };
    hourly?: { pm2_5?: (number | null)[] };
  };
  wx: {
    current: { wind_speed_10m: number; temperature_2m?: number };
    hourly?: { wind_speed_10m?: (number | null)[] };
  };
}

async function fetchLiveMeteo(lat: number, lon: number): Promise<MeteoPayload | null> {
  try {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide&hourly=pm10,pm2_5,nitrogen_dioxide&timezone=auto&forecast_days=2`;
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,temperature_2m&hourly=wind_speed_10m&timezone=auto&forecast_days=2`;
    const [aqRes, wxRes] = await Promise.all([
      fetch(aqUrl, { signal: AbortSignal.timeout(3500) }),
      fetch(wxUrl, { signal: AbortSignal.timeout(3500) }),
    ]);
    if (!aqRes.ok || !wxRes.ok) return null;
    const aq = await aqRes.json();
    const wx = await wxRes.json();
    if (
      !aq?.current ||
      !Number.isFinite(aq.current.pm2_5) ||
      !Number.isFinite(aq.current.pm10) ||
      !wx?.current ||
      !Number.isFinite(wx.current.wind_speed_10m)
    ) {
      return null;
    }
    return { aq, wx };
  } catch {
    return null;
  }
}

function extractHourlySeries(raw: (number | null)[] | undefined, fallback: number): number[] {
  const series = (raw || []).slice(0, 24).map((v) => Math.max(1, Math.round(v ?? fallback)));
  while (series.length < 24) series.push(fallback);
  return series;
}

function buildScenarioFromData(
  city: string,
  admin1: string | undefined,
  data: MeteoPayload
): LocationScenario {
  const pm25 = Math.round(data.aq.current.pm2_5);
  const pm10 = Math.round(data.aq.current.pm10);
  const no2 = Math.round(data.aq.current.nitrogen_dioxide ?? 0);
  const wind = Math.max(1, Math.round(data.wx.current.wind_speed_10m));
  const hourlyPM25 = extractHourlySeries(data.aq.hourly?.pm2_5, pm25);
  const hourlyWind = extractHourlySeries(data.wx.hourly?.wind_speed_10m, wind);

  return {
    id: `live-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    city: `${city}, ${admin1 || 'India'}`,
    shortCity: city,
    subtitle: `Live observations from Open-Meteo model (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`,
    sourceLabel: 'Model-derived NAQI equivalent (Open-Meteo)',
    pm25,
    pm10,
    no2,
    wind,
    basePledges: 120,
    baseCo2Kg: 420,
    hourlyPM25,
    hourlyWind,
    isSynthetic: false,
  };
}

export async function handleCityScenario(req: NextRequest) {
  const requestId = getRequestId(req);
  const limit = limiter.check(getHashedClientKey(req));
  if (!limit.allowed) {
    return apiErrorResponse(
      {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait before retrying.',
        requestId,
        timestamp: new Date().toISOString(),
      },
      429,
      { 'Retry-After': String(limit.retryAfterSeconds) }
    );
  }

  const query = req.nextUrl.searchParams.get('q');
  const parsed = QuerySchema.safeParse({ q: query ?? '' });
  if (!parsed.success) {
    return apiErrorResponse(
      boundaryError(
        'VALIDATION_ERROR',
        'City query parameter "q" must be 2 to 100 characters',
        requestId,
        400
      ).error,
      400
    );
  }

  // V2-30 step 6: SCENARIOS shortcut removed — q=delhi must geocode live.
  // Demo scenarios are only served from the client-side demo flow.
  const q = parsed.data.q.toLowerCase().trim();
  const cached = scenarioCache.get(q);
  if (cached) return securityJson(cached, 200, { [REQUEST_ID_HEADER]: requestId });

  const geoRes = await searchCities(q);
  if (!geoRes || geoRes.length === 0) {
    return apiErrorResponse(
      {
        code: 'NOT_FOUND',
        message: `City "${parsed.data.q}" not found in geocoding database`,
        requestId,
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  const top = geoRes[0];
  const meteo = await fetchLiveMeteo(top.latitude, top.longitude);
  if (!meteo) {
    return apiErrorResponse(
      {
        code: 'PROVIDER_UNAVAILABLE',
        message:
          'Live air quality provider temporarily unavailable. Please enter AQI manually or choose a Demo scenario.',
        requestId,
        timestamp: new Date().toISOString(),
      },
      502
    );
  }

  const scenario = buildScenarioFromData(top.name, top.admin1, meteo);
  scenarioCache.set(q, scenario);
  return securityJson(scenario, 200, { [REQUEST_ID_HEADER]: requestId });
}

export async function GET(req: NextRequest) {
  return handleCityScenario(req);
}
