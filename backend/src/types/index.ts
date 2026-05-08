import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export type Zone = 'green' | 'yellow' | 'red';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export type CarClass = 'ECONOMY' | 'COMFORT' | 'CROSSOVER';
export type RentalPackage = 'PER_MINUTE' | 'H3' | 'H6' | 'H12' | 'H24';

export interface TariffRates {
  perMinDriving: number;
  perMinWaiting: number;
  perKm: number;
  package3h: number;
  package6h: number;
  package12h: number;
  package24h: number;
  packageKmLimit3h: number;
  packageKmLimit6h: number;
  packageKmLimit12h: number;
  packageKmLimit24h: number;
  includesFuel: boolean;
  includesParkingWash: boolean;
}

// Default tariff rates in TJS (Tajik Somoni) per car class
export const DEFAULT_TARIFFS: Record<CarClass, TariffRates> = {
  ECONOMY: {
    perMinDriving: 1.5,
    perMinWaiting: 0.5,
    perKm: 2.0,
    package3h: 150,
    package6h: 250,
    package12h: 400,
    package24h: 550,
    packageKmLimit3h: 50,
    packageKmLimit6h: 100,
    packageKmLimit12h: 150,
    packageKmLimit24h: 200,
    includesFuel: true,
    includesParkingWash: true,
  },
  COMFORT: {
    perMinDriving: 2.2,
    perMinWaiting: 0.8,
    perKm: 2.5,
    package3h: 220,
    package6h: 380,
    package12h: 600,
    package24h: 850,
    packageKmLimit3h: 50,
    packageKmLimit6h: 100,
    packageKmLimit12h: 150,
    packageKmLimit24h: 200,
    includesFuel: true,
    includesParkingWash: true,
  },
  CROSSOVER: {
    perMinDriving: 3.0,
    perMinWaiting: 1.0,
    perKm: 3.0,
    package3h: 320,
    package6h: 550,
    package12h: 900,
    package24h: 1200,
    packageKmLimit3h: 50,
    packageKmLimit6h: 100,
    packageKmLimit12h: 150,
    packageKmLimit24h: 200,
    includesFuel: true,
    includesParkingWash: true,
  },
};

export const FUEL_ALERT_THRESHOLD = 15;

export const DUSHANBE_GREEN_ZONE: GeoJsonPolygon = {
  type: 'Polygon',
  coordinates: [[
    [68.7200, 38.5200],
    [68.8400, 38.5200],
    [68.8400, 38.6000],
    [68.7200, 38.6000],
    [68.7200, 38.5200],
  ]],
};
