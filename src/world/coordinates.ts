/**
 * coordinates.ts - Geometric & Geographic Coordinate Conversion
 * 
 * Accurately projects WGS84 geographic coordinates (lon, lat) to local
 * Three.js metric Cartesian coordinates (X, Y, Z in meters) centered on UCH.
 */

export interface CoordinateOrigin {
  lon: number;
  lat: number;
  description: string;
}

export const UCH_ORIGIN: CoordinateOrigin = {
  lon: 3.90300,
  lat: 7.40250,
  description: 'UCH Central Clinical Grounds (Queen Elizabeth II Road axis, Ibadan)',
};

// Metric scaling parameters at latitude 7.4025° N
export const METERS_PER_DEGREE_LAT = 110574.0;
export const METERS_PER_DEGREE_LON = 110392.0;

/**
 * Converts WGS84 [lon, lat] coordinates to local Three.js Cartesian [x, z] coordinates in meters.
 * X points East (+), West (-)
 * Z points South (+), North (-) [standard WebGL/Three.js camera looks toward -Z]
 */
export function wgs84ToCartesian(
  lon: number,
  lat: number,
  origin = UCH_ORIGIN
): { x: number; z: number } {
  const x = (lon - origin.lon) * METERS_PER_DEGREE_LON;
  const z = -(lat - origin.lat) * METERS_PER_DEGREE_LAT;
  return { x, z };
}

/**
 * Converts Three.js Cartesian [x, z] in meters back to WGS84 [lon, lat].
 */
export function cartesianToWgs84(
  x: number,
  z: number,
  origin = UCH_ORIGIN
): { lon: number; lat: number } {
  const lon = origin.lon + x / METERS_PER_DEGREE_LON;
  const lat = origin.lat - z / METERS_PER_DEGREE_LAT;
  return { lon, lat };
}

/**
 * Computes 2D distance between two Cartesian points in meters.
 */
export function cartesianDistance(
  p1: { x: number; z: number },
  p2: { x: number; z: number }
): number {
  return Math.hypot(p1.x - p2.x, p1.z - p2.z);
}
