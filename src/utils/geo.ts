// src/utils/geo.ts

/**
 * Generates a consistent grid-based key from latitude and longitude.
 * Rounding to 2 decimal places creates grid cells of roughly 1.1km x 1.1km,
 * which is a good "neighborhood" level for caching trending news.
 *
 * @param lat - The latitude.
 * @param lon - The longitude.
 * @param precision - The number of decimal places to round to.
 * @returns A string in the format "lat_rounded:lon_rounded".
 */
export function getGeospatialCacheKey(lat: number, lon: number, precision: number = 2): string {
  const latFixed = lat.toFixed(precision);
  const lonFixed = lon.toFixed(precision);
  return `${latFixed}:${lonFixed}`;
}