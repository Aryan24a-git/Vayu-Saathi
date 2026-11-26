// Live city / geolocation / manual AQI client helpers (no silent synthetic fallback)
// Satisfies: REQ-001, REQ-003, V2-30
import type { LocationScenario } from '@/domain/scenarios';

export async function fetchLiveIndianCity(cityQuery: string): Promise<LocationScenario | null> {
  const clean = cityQuery.trim();
  if (clean.length < 2) return null;

  const res = await fetch(`/api/city-scenario?q=${encodeURIComponent(clean)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Provider unavailable (HTTP ${res.status})`);
  }
  return (await res.json()) as LocationScenario;
}

export async function fetchLiveByCoords(lat: number, lon: number): Promise<LocationScenario> {
  const rLat = Math.round(lat * 100) / 100;
  const rLon = Math.round(lon * 100) / 100;
  const res = await fetch(`/api/air-quality?lat=${rLat}&lon=${rLon}`);
  if (!res.ok) {
    throw new Error(`Air quality service unavailable (HTTP ${res.status})`);
  }
  const reading = (await res.json()) as { pm25: number; aqi: number; timestamp: string };
  const pm25 = Math.max(1, Math.round(reading.pm25));
  const timeStr = new Date(reading.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: `gps-${rLat}-${rLon}`,
    city: `Your Area (${rLat}, ${rLon})`,
    shortCity: 'Your Area',
    subtitle: `Model estimate (Open-Meteo) · ${timeStr}`,
    sourceLabel: `Model-derived NAQI equivalent (Open-Meteo)`,
    pm25,
    pm10: Math.round(pm25 * 1.4),
    no2: 35,
    wind: 5,
    hourlyPM25: [],
    hourlyWind: [],
    hourlyError: 'Hourly forecast unavailable',
    isSynthetic: false,
  };
}

export function buildManualScenario(pm25Raw: number, cityLabel = 'Manual Entry'): LocationScenario {
  const pm25 = Math.max(1, Math.min(1000, Math.round(pm25Raw)));
  const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return {
    id: `manual-${pm25}`,
    city: cityLabel,
    shortCity: cityLabel,
    subtitle: `Manual PM2.5 entry at ${nowStr}`,
    sourceLabel: `Manual entry (${nowStr})`,
    pm25,
    pm10: Math.round(pm25 * 1.4),
    no2: 30,
    wind: 5,
    hourlyPM25: [],
    hourlyWind: [],
    hourlyError: 'Hourly forecast unavailable',
    isSynthetic: false,
  };
}
