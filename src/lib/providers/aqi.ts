import type { AirQualitySnapshot } from '../../domain/types';
import {
  fetchOpenMeteoSnapshot,
  roundCoordinates,
  clearAirQualityCaches,
  OpenMeteoAirQualityProvider,
} from '../../server/providers/openMeteoAirQuality';

export interface AqiReading {
  aqi: number;
  pm25: number;
  timestamp: string;
  source: string;
  isFallback: boolean;
  isStale: boolean;
  band?: string;
}

export interface AqiProvider {
  fetchCurrent(lat: number, lon: number): Promise<AqiReading>;
}

export { roundCoordinates, clearAirQualityCaches, OpenMeteoAirQualityProvider };

export async function fetchCurrentAqi(lat: number, lon: number): Promise<AqiReading> {
  try {
    const snapshot: AirQualitySnapshot = await fetchOpenMeteoSnapshot(lat, lon);
    return {
      aqi: snapshot.aqi,
      pm25: snapshot.pm25,
      timestamp: snapshot.timestamp,
      source: snapshot.provider,
      isFallback: snapshot.isFallback,
      isStale: snapshot.isStale,
      band: snapshot.band,
    };
  } catch {
    return {
      aqi: 155,
      pm25: 65,
      timestamp: new Date().toISOString(),
      source: 'Fallback estimate (Provider unreachable)',
      isFallback: true,
      isStale: true,
      band: 'unhealthy',
    };
  }
}
