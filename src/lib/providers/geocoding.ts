import {
  searchOpenMeteo,
  clearGeocodingCache,
  OpenMeteoGeocodingProvider,
  type GeocodingResult,
} from '../../server/providers/geocoding';

export type { GeocodingResult };
export { clearGeocodingCache, OpenMeteoGeocodingProvider };

export function searchCities(query: string): Promise<GeocodingResult[]> {
  return searchOpenMeteo(query)
    .then((results) => [...results])
    .catch(() => []);
}
