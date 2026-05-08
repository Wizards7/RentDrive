import prisma from '../config/database';
import { haversineDistance } from '../utils/haversine';

/* ─── Zone rectangle bounds (WGS-84, Dushanbe) ─── */
const GREEN_BOUNDS = {
  minLat: 38.530, maxLat: 38.592,
  minLon: 68.745, maxLon: 68.808,
};

const YELLOW_BOUNDS = {
  minLat: 38.485, maxLat: 38.635,
  minLon: 68.675, maxLon: 68.875,
};

export type Zone = 'green' | 'yellow' | 'red';

/**
 * Determine which geofence zone a coordinate falls in.
 * Green  → city centre (free parking, safe).
 * Yellow → city outskirts (warning).
 * Red    → outside city limits (alert, extra charges may apply).
 */
export function getCarZone(lat: number, lon: number): Zone {
  if (
    lat >= GREEN_BOUNDS.minLat && lat <= GREEN_BOUNDS.maxLat &&
    lon >= GREEN_BOUNDS.minLon && lon <= GREEN_BOUNDS.maxLon
  ) return 'green';

  if (
    lat >= YELLOW_BOUNDS.minLat && lat <= YELLOW_BOUNDS.maxLat &&
    lon >= YELLOW_BOUNDS.minLon && lon <= YELLOW_BOUNDS.maxLon
  ) return 'yellow';

  return 'red';
}

/**
 * Haversine distance in kilometres (rounded to 3 decimal places).
 */
export function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  return Math.round((haversineDistance(lat1, lon1, lat2, lon2) / 1000) * 1000) / 1000;
}

/* In-memory last-zone cache so we only fire one notification per zone crossing */
const lastZoneCache = new Map<string, Zone>();

/**
 * Check if a car has crossed into a warning/alert zone and, if so,
 * persist a Notification row and return the new zone.
 */
export async function checkAndNotifyZone(
  carId: string,
  lat: number,
  lon: number,
): Promise<Zone> {
  const zone = getCarZone(lat, lon);
  const prev = lastZoneCache.get(carId);

  if (prev !== zone && (zone === 'yellow' || zone === 'red')) {
    await prisma.notification.create({
      data: {
        type:  zone === 'red' ? 'ZONE_ALERT_RED' : 'ZONE_ALERT_YELLOW',
        title: zone === 'red'
          ? '🚨 Car left service area'
          : '⚠️ Car entering outskirts',
        body: zone === 'red'
          ? `Car ${carId} moved into the RED zone (outside city limits). Immediate action required.`
          : `Car ${carId} has entered the YELLOW zone (city outskirts). Monitor closely.`,
      },
    });
  }

  lastZoneCache.set(carId, zone);
  return zone;
}

/* ── Legacy helpers kept for backward-compat with rentalController ── */
export function isInGreenZone(lat: number, lon: number): boolean {
  return getCarZone(lat, lon) === 'green';
}

export function isCarInAnyParkingZone(
  lat: number,
  lon: number,
  zones: { geojson: unknown }[],
): boolean {
  // Simplified: check green zone as the primary free-parking zone
  if (isInGreenZone(lat, lon)) return true;

  return zones.some((zone) => {
    const geo = zone.geojson as { type: string; coordinates: number[][][] };
    if (geo.type !== 'Polygon') return false;
    return isPointInPolygon(lat, lon, geo.coordinates[0]);
  });
}

function isPointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
