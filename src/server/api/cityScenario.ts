import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { LocationScenario } from '@/domain/scenarios';
import { searchOpenMeteo } from '@/server/providers/geocoding';
import { getRequestId, REQUEST_ID_HEADER } from '@/server/http/requestId';
import {
  MemoryBucketStore,
  TokenBucketLimiter,
  getHashedClientKey,
} from '@/server/security/rateLimit';
import { boundaryError, MAX_QUERY_LENGTH, RATE_LIMITS } from '@/server/security/limits';
import { apiErrorResponse, securityJson } from '@/server/security/response';
import { LruCache } from '@/server/cache/lru';
import { getEnv } from '@/server/config/env';
import { fetchWaqiStation, type WaqiStationReading } from '@/server/providers/waqiAirQuality';

const limiter = new TokenBucketLimiter(
  RATE_LIMITS.cityScenarioPerMinute,
  60_000,
  new MemoryBucketStore()
);
const scenarioCache = new LruCache<string, LocationScenario>({
  maxEntries: 100,
  ttlMs: 15 * 60 * 1000,
});
const QuerySchema = z.object({ q: z.string().trim().min(2).max(MAX_QUERY_LENGTH) });

interface MeteoPayload {
  aq: {
    timezone_abbreviation?: string;
    current: { time?: string; pm10: number; pm2_5: number; nitrogen_dioxide?: number };
    hourly?: { pm2_5?: (number | null)[] };
  };
  wx: {
    current: { time?: string; wind_speed_10m: number; temperature_2m?: number };
    hourly?: { wind_speed_10m?: (number | null)[] };
  };
}

export type HourlySeriesResult =
  { ok: true; series: number[] } | { ok: false; error: 'HOURLY_DATA_UNAVAILABLE'; message: string };

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

export function extractHourlySeries(
  raw: readonly (number | null | undefined)[] | undefined
): HourlySeriesResult {
  if (!raw || raw.length < 24) {
    return {
      ok: false,
      error: 'HOURLY_DATA_UNAVAILABLE',
      message: 'Hourly forecast unavailable',
    };
  }
  const first24 = raw.slice(0, 24);
  if (first24.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return {
      ok: false,
      error: 'HOURLY_DATA_UNAVAILABLE',
      message: 'Hourly forecast unavailable',
    };
  }
  return {
    ok: true,
    series: first24.map((v) => Math.max(1, Math.round(v as number))),
  };
}

export function formatObservationTime(localIsoTime: string | undefined, tzAbbr?: string): string {
  const match = localIsoTime?.match(/[T ](\d{2}):(\d{2})/);
  if (!match) return 'latest reading';
  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const tz = tzAbbr && /^[A-Z]{2,5}$/.test(tzAbbr) ? ` ${tzAbbr}` : '';
  return `${hour12}:${minute} ${period}${tz}`;
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
  const pmResult = extractHourlySeries(data.aq.hourly?.pm2_5);
  const windResult = extractHourlySeries(data.wx.hourly?.wind_speed_10m);
  const hasHourly = pmResult.ok && windResult.ok;
  const obsTime = formatObservationTime(
    data.aq.current.time ?? data.wx.current.time,
    data.aq.timezone_abbreviation
  );

  return {
    id: `live-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    city: `${city}, ${admin1 || 'India'}`,
    shortCity: city,
    subtitle: `Model estimate (Open-Meteo) · ${obsTime}`,
    sourceLabel: 'Model-derived NAQI equivalent (Open-Meteo)',
    pm25,
    pm10,
    no2,
    wind,
    hourlyPM25: hasHourly ? pmResult.series : [],
    hourlyWind: hasHourly ? windResult.series : [],
    ...(hasHourly ? {} : { hourlyError: 'Hourly forecast unavailable' }),
    isSynthetic: false,
  };
}

function buildWaqiScenario(
  city: string,
  admin1: string | undefined,
  waqi: WaqiStationReading,
  meteo: MeteoPayload | null
): LocationScenario {
  const pmResult = meteo ? extractHourlySeries(meteo.aq.hourly?.pm2_5) : null;
  const windResult = meteo ? extractHourlySeries(meteo.wx.hourly?.wind_speed_10m) : null;
  const hasHourly = Boolean(pmResult?.ok && windResult?.ok);
  const obsTime = formatObservationTime(waqi.timeIso);
  return {
    id: `live-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    city: waqi.stationName || `${city}, ${admin1 || 'India'}`,
    shortCity: city,
    subtitle: `Station reading (WAQI) · ${obsTime}`,
    sourceLabel: hasHourly ? 'WAQI Station + Open-Meteo Hourly' : 'WAQI Station (aqicn.org)',
    pm25: waqi.pm25,
    pm10: waqi.pm10,
    no2: waqi.no2 ?? Math.round(meteo?.aq.current.nitrogen_dioxide ?? 0),
    wind: waqi.windKmh ?? Math.max(1, Math.round(meteo?.wx.current.wind_speed_10m ?? 5)),
    hourlyPM25: hasHourly && pmResult?.ok ? pmResult.series : [],
    hourlyWind: hasHourly && windResult?.ok ? windResult.series : [],
    ...(hasHourly ? {} : { hourlyError: 'Hourly forecast unavailable' }),
    isSynthetic: false,
  };
}

async function resolveLiveScenario(
  name: string,
  admin1: string | undefined,
  lat: number,
  lon: number
): Promise<LocationScenario | null> {
  const env = getEnv();
  if (env.AQ_PROVIDER.toLowerCase() === 'waqi') {
    if (!env.WAQI_API_TOKEN) return null;
    const [waqi, meteo] = await Promise.all([
      fetchWaqiStation(lat, lon, env.WAQI_API_TOKEN).catch(() => null),
      fetchLiveMeteo(lat, lon),
    ]);
    return waqi ? buildWaqiScenario(name, admin1, waqi, meteo) : null;
  }
  const meteo = await fetchLiveMeteo(lat, lon);
  return meteo ? buildScenarioFromData(name, admin1, meteo) : null;
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

  const q = parsed.data.q.toLowerCase().trim();
  const cacheKey = `${getEnv().AQ_PROVIDER}:${q}`;
  const cached = scenarioCache.get(cacheKey);
  if (cached) return securityJson(cached, 200, { [REQUEST_ID_HEADER]: requestId });

  const geoRes = await searchOpenMeteo(q).catch(() => []);
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
  const scenario = await resolveLiveScenario(top.name, top.admin1, top.latitude, top.longitude);
  if (!scenario) {
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

  scenarioCache.set(cacheKey, scenario);
  return securityJson(scenario, 200, { [REQUEST_ID_HEADER]: requestId });
}
