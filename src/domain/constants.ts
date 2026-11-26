// Satisfies: NFR-004, DATA-001, EC-001
// Named domain constants with explicit units.

/** Coordinate rounding precision (DATA-001) - ~1.1 km precision at equator */
export const COORD_DECIMAL_PLACES = 2; // units: decimal places

/** Household profile size bounds */
export const MIN_PROFILE_MEMBERS = 1; // units: count
export const MAX_PROFILE_MEMBERS = 10; // units: count

/** Air Quality Index boundaries */
export const MIN_AQI_VALUE = 0; // units: AQI index points
export const MAX_AQI_VALUE = 999; // units: AQI index points

/** PM2.5 measurement bounds */
export const MIN_PM25_UG_M3 = 0; // units: µg/m³
export const MAX_PM25_UG_M3 = 1000; // units: µg/m³

/** In-memory cache default durations */
export const AQI_CACHE_TTL_MS = 15 * 60 * 1000; // units: milliseconds (15 min)
export const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // units: milliseconds (24 hr)
export const PLAN_CACHE_TTL_MS = 30 * 60 * 1000; // units: milliseconds (30 min)

/** Timeouts */
export const HTTP_CLIENT_TIMEOUT_MS = 5000; // units: milliseconds (5 seconds)
export const LLM_CLIENT_TIMEOUT_MS = 10000; // units: milliseconds (10 seconds)
