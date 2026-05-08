import { CarClass, RentalPackage, TariffRates, DEFAULT_TARIFFS, FUEL_ALERT_THRESHOLD } from '../types';

interface CostParams {
  carClass: CarClass;
  package: RentalPackage;
  drivingMinutes: number;
  waitingMinutes: number;
  distanceKm: number;
  tariffOverride?: TariffRates;
}

interface CostBreakdown {
  base: number;
  overageKm: number;
  total: number;
  currency: string;
  includesFuel: boolean;
  includesParkingWash: boolean;
  packageUsed: RentalPackage;
}

function getKmLimitForPackage(tariff: TariffRates, pkg: RentalPackage): number {
  const limits: Record<RentalPackage, number> = {
    PER_MINUTE: 0,
    H3: tariff.packageKmLimit3h,
    H6: tariff.packageKmLimit6h,
    H12: tariff.packageKmLimit12h,
    H24: tariff.packageKmLimit24h,
  };
  return limits[pkg];
}

function getPackagePrice(tariff: TariffRates, pkg: RentalPackage): number {
  const prices: Record<RentalPackage, number> = {
    PER_MINUTE: 0,
    H3: tariff.package3h,
    H6: tariff.package6h,
    H12: tariff.package12h,
    H24: tariff.package24h,
  };
  return prices[pkg];
}

export function calculateCost({
  carClass,
  package: pkg,
  drivingMinutes,
  waitingMinutes,
  distanceKm,
  tariffOverride,
}: CostParams): CostBreakdown {
  const tariff = tariffOverride ?? DEFAULT_TARIFFS[carClass];

  const kmLimit = getKmLimitForPackage(tariff, pkg);
  const excessKm = Math.max(0, distanceKm - kmLimit);
  const overageCost = excessKm * tariff.perKm;

  let base: number;

  if (pkg === 'PER_MINUTE') {
    const drivingCost = drivingMinutes * tariff.perMinDriving;
    const waitingCost = waitingMinutes * tariff.perMinWaiting;
    base = drivingCost + waitingCost;
  } else {
    base = getPackagePrice(tariff, pkg);
  }

  return {
    base,
    overageKm: Math.round(excessKm * 100) / 100,
    total: Math.round((base + overageCost) * 100) / 100,
    currency: 'TJS',
    includesFuel: tariff.includesFuel,
    includesParkingWash: tariff.includesParkingWash,
    packageUsed: pkg,
  };
}

export function getAllTariffs() {
  return Object.entries(DEFAULT_TARIFFS).map(([carClass, rates]) => ({
    carClass,
    ...rates,
    packages: {
      H3: { price: rates.package3h, includedKm: rates.packageKmLimit3h },
      H6: { price: rates.package6h, includedKm: rates.packageKmLimit6h },
      H12: { price: rates.package12h, includedKm: rates.packageKmLimit12h },
      H24: { price: rates.package24h, includedKm: rates.packageKmLimit24h },
    },
  }));
}

export function shouldTriggerRefuel(fuelLevel: number): boolean {
  return fuelLevel < FUEL_ALERT_THRESHOLD;
}
