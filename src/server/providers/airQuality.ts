import type { AirQualitySnapshot } from '../../domain/types';

export interface ForecastReading {
  time: string;
  pm25: number;
  aqi: number;
}

export interface AirQualityProvider {
  fetchSnapshot(latitude: number, longitude: number): Promise<AirQualitySnapshot>;
  fetchForecast(
    latitude: number,
    longitude: number,
    hours: number
  ): Promise<readonly ForecastReading[]>;
}
