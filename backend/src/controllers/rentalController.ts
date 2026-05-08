import { Response } from 'express';
import { AuthRequest, CarClass, RentalPackage } from '../types';
import { getCarZone } from '../services/geoService';
import { calculateCost, shouldTriggerRefuel, getAllTariffs } from '../services/tariffService';
import { computeDiscount } from './userController';
import prisma from '../config/database';

const PKG_DURATION_MINS: Record<string, number> = {
  H3: 180, H6: 360, H12: 720, H24: 1440,
};

export async function startRental(req: AuthRequest, res: Response) {
  const { carId, latitude, longitude, package: pkg = 'PER_MINUTE' } = req.body;
  const userId = req.userId!;

  const activeRental = await prisma.rental.findFirst({
    where: { userId, status: 'ACTIVE' },
  });
  if (activeRental) {
    res.status(409).json({ error: 'You already have an active rental' });
    return;
  }

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.status !== 'AVAILABLE') {
    res.status(404).json({ error: 'Car not available' });
    return;
  }

  const [rental] = await prisma.$transaction([
    prisma.rental.create({
      data: {
        userId,
        carId,
        package: pkg as RentalPackage,
        startLatitude: latitude,
        startLongitude: longitude,
        status: 'ACTIVE',
      },
    }),
    prisma.car.update({
      where: { id: carId },
      data: { status: 'RENTED' },
    }),
  ]);

  res.status(201).json({ rental });
}

export async function endRental(req: AuthRequest, res: Response) {
  const { rentalId, latitude, longitude, drivingMinutes, waitingMinutes, distanceKm, rating } =
    req.body;
  const userId = req.userId!;

  /* Zone check */
  const zone = getCarZone(latitude, longitude);
  if (zone !== 'green') {
    res.status(400).json({
      error: zone === 'yellow'
        ? 'You\'re in the city outskirts. Drive to the Green Zone (city centre) to finish your trip.'
        : '⚠️ You\'re outside the service area! Return to Dushanbe Green Zone to end your trip.',
      zone,
    });
    return;
  }

  const rental = await prisma.rental.findFirst({
    where: { id: rentalId, userId, status: 'ACTIVE' },
    include: {
      car: true,
      user: { select: { firstName: true, lastName: true, vipDiscount: true } },
    },
  });

  if (!rental) {
    res.status(404).json({ error: 'Active rental not found' });
    return;
  }

  /* Cost calculation */
  const costBreakdown = calculateCost({
    carClass: rental.car.carClass as CarClass,
    package: rental.package as RentalPackage,
    drivingMinutes,
    waitingMinutes,
    distanceKm,
  });

  /* Apply discount */
  const completedCount = await prisma.rental.count({
    where: { userId, status: 'COMPLETED' },
  });
  const { discountPct, discountTier } = computeDiscount(completedCount, rental.user.vipDiscount ?? 0);
  const discountAmt  = +(costBreakdown.total * discountPct / 100).toFixed(2);
  const finalTotal   = +(costBreakdown.total - discountAmt).toFixed(2);

  const now = new Date();
  const startTime = rental.startTime;
  const durationMs = now.getTime() - startTime.getTime();
  const totalMins  = Math.round(durationMs / 60000);

  /* Package time limit details */
  const pkgLimit = PKG_DURATION_MINS[rental.package] ?? null;
  const overageMins = pkgLimit !== null ? Math.max(0, totalMins - pkgLimit) : 0;

  /* Tariff for reference */
  const tariffs = getAllTariffs();
  const tariff  = tariffs.find((t) => t.carClass === rental.car.carClass);

  const updatedRental = await prisma.rental.update({
    where: { id: rentalId },
    data: {
      endTime: now,
      endLatitude: latitude,
      endLongitude: longitude,
      drivingMinutes,
      waitingMinutes,
      distanceKm,
      totalCost: finalTotal,
      status: 'COMPLETED',
    },
  });

  await prisma.car.update({
    where: { id: rental.carId },
    data: { latitude, longitude, status: 'AVAILABLE' },
  });

  if (shouldTriggerRefuel(rental.car.fuelLevel)) {
    await prisma.task.create({
      data: {
        type: 'REFUEL',
        carId: rental.carId,
        notes: `Fuel at ${rental.car.fuelLevel}% after trip ${rentalId}`,
      },
    });
  }

  /* Admin notification */
  await (prisma as any).notification.create({
    data: {
      type:  'TRIP_ENDED',
      title: `Trip ended — ${rental.car.model}`,
      body:  `${rental.user.firstName} ${rental.user.lastName} · ${totalMins} min · ${distanceKm} km · ${finalTotal} TJS`,
    },
  });

  /* Receipt */
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const receipt = {
    orderId:        `ORD-${updatedRental.id.slice(-6).toUpperCase()}`,
    carName:        rental.car.model,
    carClass:       rental.car.carClass,
    carImage:       rental.car.imageUrl,
    licensePlate:   rental.car.licensePlate,
    startTime:      fmt(startTime),
    endTime:        fmt(now),
    durationMins:   totalMins,
    distanceKm:     distanceKm,
    zone:           'green',
    package:        rental.package,
    breakdown: {
      base:         costBreakdown.base,
      overageKm:    costBreakdown.overageKm,
      overageMins,
      penaltyCost:  overageMins > 0 ? +(overageMins * (tariff?.perMinDriving ?? 1.5)).toFixed(2) : 0,
      subtotal:     costBreakdown.total,
      discountPct,
      discountTier,
      discountAmt,
      finalTotal,
    },
    currency:       'TJS',
    paymentMethod:  'Card',
    userRating:     rating ?? null,
  };

  res.json({ rental: updatedRental, cost: costBreakdown, receipt });
}

export async function getActiveRental(req: AuthRequest, res: Response) {
  const userId = req.userId!;

  const rental = await prisma.rental.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: {
      car: {
        select: {
          model: true, carClass: true, licensePlate: true,
          imageUrl: true, fuelLevel: true,
        },
      },
    },
  });

  if (!rental) {
    res.json({ rental: null });
    return;
  }

  const tariffs  = getAllTariffs();
  const tariff   = tariffs.find((t) => t.carClass === rental.car.carClass);
  const pkgLimit = PKG_DURATION_MINS[rental.package] ?? null;

  const elapsedMs   = Date.now() - rental.startTime.getTime();
  const elapsedMins = Math.floor(elapsedMs / 60000);
  const remainingMins = pkgLimit !== null ? Math.max(0, pkgLimit - elapsedMins) : null;
  const isOverLimit   = pkgLimit !== null && elapsedMins > pkgLimit;

  /* Live cost estimate */
  const liveCost = tariff
    ? rental.package === 'PER_MINUTE'
      ? +(elapsedMins * tariff.perMinDriving).toFixed(2)
      : isOverLimit
        ? +(tariff[`package${rental.package.replace('H','') as '3' | '6' | '12' | '24'}h` as keyof typeof tariff] as number +
            (elapsedMins - pkgLimit!) * tariff.perMinDriving).toFixed(2)
        : tariff[`package${rental.package.replace('H','') as '3' | '6' | '12' | '24'}h` as keyof typeof tariff]
    : 0;

  res.json({
    rental: {
      ...rental,
      elapsedMins,
      remainingMins,
      pkgLimit,
      isOverLimit,
      liveCost,
      perMinRate: tariff?.perMinDriving ?? 1.5,
    },
  });
}

export async function getRentalHistory(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const page   = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit  = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
  const skip   = (page - 1) * limit;

  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({
      where: { userId, status: { in: ['COMPLETED', 'CANCELLED'] } },
      include: { car: { select: { model: true, carClass: true, licensePlate: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.rental.count({
      where: { userId, status: { in: ['COMPLETED', 'CANCELLED'] } },
    }),
  ]);

  res.json({ rentals, total, page, limit });
}
