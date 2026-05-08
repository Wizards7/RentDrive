import { Request, Response } from 'express';
import { AuthRequest, CarClass } from '../types';
import { haversineDistance } from '../utils/haversine';
import { getCarZone, checkAndNotifyZone, distanceKm } from '../services/geoService';
import { getAllTariffs } from '../services/tariffService';
import { computeDiscount } from './userController';
import prisma from '../config/database';
import { z } from 'zod';

/* ─── Dushanbe landmark spots — one per district ─── */
const DUSHANBE_SPOTS: [number, number][] = [
  [38.5598, 68.7740], // Rudaki Ave center
  [38.5620, 68.7710], // Government House
  [38.5580, 68.7770], // Central Post Office
  [38.5560, 68.7680], // Opera & Ballet Theatre
  [38.5750, 68.7680], // Pushkin district NW
  [38.5740, 68.7830], // Pushkin district NE
  [38.5810, 68.7740], // Firdavsi North
  [38.5640, 68.7280], // Kamongaron west
  [38.5570, 68.7350], // Abu Ali Sina district
  [38.5500, 68.7420], // 22-Y MKR south-west
  [38.5350, 68.7720], // Darvoz district
  [38.5420, 68.7860], // Korvon bazaar area
  [38.5300, 68.7560], // Far south-west
  [38.5600, 68.8060], // Navruz east
  [38.5460, 68.8120], // Airport road
];

/**
 * Returns a deterministic, unique position for a car based on its ID.
 * Uses a simple polynomial hash so it works with any ID format (UUID or "car-001").
 */
function stableCarPosition(id: string): { latitude: number; longitude: number } {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < id.length; i++) {
    h1 = Math.imul(h1, 31) + id.charCodeAt(i) >>> 0;
    h2 = Math.imul(h2, 37) + id.charCodeAt(i) >>> 0;
  }
  const spot = DUSHANBE_SPOTS[h1 % DUSHANBE_SPOTS.length];
  return {
    latitude:  spot[0] + ((h2 % 100) - 50) * 0.00001,
    longitude: spot[1] + ((Math.floor(h2 / 100) % 100) - 50) * 0.000013,
  };
}

/** Map carClass enum to short type string used by frontend */
function classToType(cls: CarClass): 'ECO' | 'COMFORT' | 'CROSSOVER' {
  const map: Record<CarClass, 'ECO' | 'COMFORT' | 'CROSSOVER'> = {
    ECONOMY:   'ECO',
    COMFORT:   'COMFORT',
    CROSSOVER: 'CROSSOVER',
  };
  return map[cls];
}

/** Map URL query category param to CarClass */
function parseCategory(raw: string | undefined): CarClass | undefined {
  if (!raw) return undefined;
  const map: Record<string, CarClass> = {
    eco:       'ECONOMY',
    economy:   'ECONOMY',
    comfort:   'COMFORT',
    crossover: 'CROSSOVER',
    premium:   'CROSSOVER',
  };
  return map[raw.toLowerCase()];
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /cars/public
   Query params: user_lat, user_lng, category (eco|comfort|crossover)
   - Returns cars within 1 km of the user (or all available if no location given)
   - Category fallback: if no car of that type is within 1 km, return 3 nearest
   - Each car includes: distance_km, zone, is_available
───────────────────────────────────────────────────────────────────────────── */
export async function getPublicCars(req: Request, res: Response) {
  const { user_lat, user_lng, category } = req.query;

  const userLat = user_lat !== undefined ? parseFloat(user_lat as string) : null;
  const userLng = user_lng !== undefined ? parseFloat(user_lng as string) : null;
  const hasLocation =
    userLat !== null && userLng !== null &&
    !isNaN(userLat) && !isNaN(userLng) &&
    userLat >= -90 && userLat <= 90 &&
    userLng >= -180 && userLng <= 180;

  const carClassFilter = parseCategory(category as string | undefined);

  const rawCars = await prisma.car.findMany({
    where: { status: 'AVAILABLE' },
    select: {
      id: true, model: true, year: true, carClass: true,
      features: true, imageUrl: true, fuelLevel: true,
      status: true, latitude: true, longitude: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const tariffs = getAllTariffs();

  /* Attach stable position, zone, tariff, and distance to every car */
  const enriched = rawCars.map((car) => {
    const pos    = stableCarPosition(car.id);
    const zone   = getCarZone(pos.latitude, pos.longitude);
    const tariff = tariffs.find((t) => t.carClass === car.carClass) ?? null;
    const dist   = hasLocation
      ? distanceKm(userLat!, userLng!, pos.latitude, pos.longitude)
      : null;

    return {
      id:           car.id,
      model:        car.model,
      year:         car.year,
      type:         classToType(car.carClass),
      carClass:     car.carClass,
      lat:          pos.latitude,
      lng:          pos.longitude,
      /* Legacy keys — frontend reads these */
      latitude:     pos.latitude,
      longitude:    pos.longitude,
      distance_km:  dist,
      distanceMeters: dist !== null ? Math.round(dist * 1000) : null,
      zone,
      is_available: true,
      fuelLevel:    car.fuelLevel,
      imageUrl:     car.imageUrl,
      features:     car.features,
      status:       car.status,
      tariff:       tariff ? {
        perMinDriving:  tariff.perMinDriving,
        package3h:      tariff.package3h,
        package6h:      tariff.package6h,
        package24h:     tariff.package24h,
        includesFuel:   tariff.includesFuel,
        includesParkingWash: tariff.includesParkingWash,
      } : null,
    };
  });

  /* Apply category filter */
  const filtered = carClassFilter
    ? enriched.filter((c) => c.carClass === carClassFilter)
    : enriched;

  let result = filtered;

  if (hasLocation) {
    const sorted  = [...filtered].sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    const within1 = sorted.filter((c) => c.distance_km !== null && c.distance_km <= 1);

    if (within1.length > 0) {
      result = within1;
    } else if (carClassFilter) {
      /* Fallback: no car of that category within 1 km → 3 nearest regardless of distance */
      result = sorted.slice(0, 3);
    } else {
      /* No location filter in "ALL" mode — show 8 closest */
      result = sorted.slice(0, 8);
    }
  }

  res.json({ status: 'success', data: result, cars: result });
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /cars/:id/reserve   (requires JWT via `authenticate` middleware)
   Body: { latitude, longitude, package? }
   Creates an ACTIVE rental and locks the car.
───────────────────────────────────────────────────────────────────────────── */
export async function reserveCar(req: AuthRequest, res: Response) {
  const { id: carId } = req.params;
  const userId = req.userId!;
  const { latitude, longitude, package: pkg = 'PER_MINUTE' } = req.body;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ status: 'error', error: 'latitude and longitude are required' });
    return;
  }

  /* Block double-booking */
  const existingRental = await prisma.rental.findFirst({
    where: { userId, status: 'ACTIVE' },
  });
  if (existingRental) {
    res.status(409).json({ status: 'error', error: 'You already have an active rental' });
    return;
  }

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.status !== 'AVAILABLE') {
    res.status(404).json({ status: 'error', error: 'Car is not available' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, phone: true, vipDiscount: true },
  });

  /* Compute discount from completed rentals */
  const completedCount = await prisma.rental.count({
    where: { userId, status: 'COMPLETED' },
  });
  const { discountPct, discountTier } = computeDiscount(completedCount, user?.vipDiscount ?? 0);

  /* Package → base price map */
  const tariffs = getAllTariffs();
  const tariff  = tariffs.find((t) => t.carClass === car.carClass);
  const pkgPriceMap: Record<string, number | null> = {
    PER_MINUTE: null,
    H3:  tariff?.package3h  ?? null,
    H6:  tariff?.package6h  ?? null,
    H12: tariff?.package12h ?? null,
    H24: tariff?.package24h ?? null,
  };
  const basePrice    = pkgPriceMap[pkg] ?? null;
  const discountAmt  = basePrice !== null ? +(basePrice * discountPct / 100).toFixed(2) : null;
  const finalPrice   = basePrice !== null ? +(basePrice - (discountAmt ?? 0)).toFixed(2) : null;

  const pkgLabel: Record<string, string> = {
    PER_MINUTE: 'Flex (per min)', H3: '3H package', H6: '6H package', H12: '12H package', H24: '24H package',
  };

  const [rental] = await prisma.$transaction([
    prisma.rental.create({
      data: {
        userId,
        carId,
        package:        pkg as 'PER_MINUTE' | 'H3' | 'H6' | 'H12' | 'H24',
        startLatitude:  latitude,
        startLongitude: longitude,
        status:         'ACTIVE',
        ...(finalPrice !== null ? { totalCost: finalPrice } : {}),
      },
    }),
    prisma.car.update({
      where: { id: carId },
      data:  { status: 'RENTED' },
    }),
  ]);

  /* Notify admin */
  const discountNote = discountPct > 0 ? ` · ${discountPct}% ${discountTier} discount` : '';
  await (prisma as any).notification.create({
    data: {
      type:  'RESERVATION',
      title: `New reservation — ${car.model}`,
      body:  `${user?.firstName ?? ''} ${user?.lastName ?? ''} (${user?.phone ?? userId}) reserved ${car.model} · ${pkgLabel[pkg] ?? pkg}${discountNote}`,
    },
  });

  /* Auto-notify user if they just hit a new tier */
  const newTierThresholds: Record<number, string> = { 5: 'Silver 🥈 (5% off)', 10: 'Gold 🥇 (10% off)', 20: 'Platinum 💎 (15% off)' };
  const nextCount = completedCount + 1;
  if (newTierThresholds[nextCount]) {
    await (prisma as any).notification.create({
      data: {
        type:  'LOYALTY',
        title: `You reached ${newTierThresholds[nextCount]} tier!`,
        body:  `Congrats! You now get an automatic discount on every reservation.`,
      },
    });
  }

  res.status(201).json({
    status: 'success',
    rental,
    discount: { pct: discountPct, tier: discountTier, savedAmount: discountAmt, finalPrice },
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   Admin endpoints (authenticateAdmin protected in route file)
───────────────────────────────────────────────────────────────────────────── */
export async function getAllCars(_req: Request, res: Response) {
  const cars = await prisma.car.findMany({
    select: {
      id: true, licensePlate: true, model: true, year: true,
      carClass: true, features: true, imageUrl: true,
      fuelLevel: true, status: true, latitude: true, longitude: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ cars });
}

const createCarSchema = z.object({
  model:        z.string().min(1),
  licensePlate: z.string().min(1),
  year:         z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(2000).max(2030).optional()),
  carClass:     z.enum(['ECONOMY', 'COMFORT', 'CROSSOVER']),
  fuelLevel:    z.preprocess((v) => (v === '' || v === undefined ? 100 : Number(v)), z.number().int().min(0).max(100)),
  features:     z.string().optional().default(''),
});

export async function createCar(req: Request, res: Response) {
  const parsed = createCarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const existing = await prisma.car.findUnique({ where: { licensePlate: parsed.data.licensePlate } });
  if (existing) {
    res.status(409).json({ error: 'License plate already exists' });
    return;
  }

  const file     = (req as Request & { file?: Express.Multer.File }).file;
  const imageUrl = file
    ? `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/cars/${file.filename}`
    : null;

  const features = parsed.data.features
    ? parsed.data.features.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const { features: _f, ...rest } = parsed.data;

  /* New cars get a random position spread across the city */
  const car = await prisma.car.create({
    data: {
      ...rest,
      features,
      imageUrl,
      latitude:  38.485 + Math.random() * (38.635 - 38.485),
      longitude: 68.675 + Math.random() * (68.875 - 68.675),
    },
    select: {
      id: true, licensePlate: true, model: true, year: true,
      carClass: true, features: true, imageUrl: true, fuelLevel: true, status: true,
    },
  });

  res.status(201).json({ car });
}

const updateCarSchema = z.object({
  model:        z.string().min(1).optional(),
  licensePlate: z.string().min(1).optional(),
  year:         z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(2000).max(2030).optional()),
  carClass:     z.enum(['ECONOMY', 'COMFORT', 'CROSSOVER']).optional(),
  fuelLevel:    z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(0).max(100).optional()),
  status:       z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
  features:     z.string().optional(),
  latitude:     z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().optional()),
  longitude:    z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().optional()),
});

export async function updateCar(req: Request, res: Response) {
  const { id } = req.params;

  const car = await prisma.car.findUnique({ where: { id } });
  if (!car) { res.status(404).json({ error: 'Car not found' }); return; }

  const parsed = updateCarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const file     = (req as Request & { file?: Express.Multer.File }).file;
  const imageUrl = file
    ? `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/cars/${file.filename}`
    : undefined;

  const { features, latitude, longitude, ...rest } = parsed.data;
  const featuresArr = features !== undefined
    ? features.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  /* If new coordinates provided, trigger zone check + possible admin alert */
  const newLat = latitude ?? car.latitude;
  const newLon = longitude ?? car.longitude;
  if (latitude !== undefined || longitude !== undefined) {
    await checkAndNotifyZone(id, newLat, newLon);
  }

  const updated = await prisma.car.update({
    where: { id },
    data: {
      ...rest,
      ...(featuresArr !== undefined ? { features: featuresArr } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(latitude  !== undefined ? { latitude }  : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    },
    select: {
      id: true, licensePlate: true, model: true, year: true,
      carClass: true, features: true, imageUrl: true, fuelLevel: true,
      status: true, latitude: true, longitude: true,
    },
  });

  res.json({ car: updated });
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /cars/:id/detail   (admin only)
   Full car profile with rental history and revenue stats.
───────────────────────────────────────────────────────────────────────────── */
export async function getCarAdminDetail(req: Request, res: Response) {
  const { id } = req.params;

  const car = await prisma.car.findUnique({
    where: { id },
    select: {
      id: true, licensePlate: true, model: true, year: true,
      carClass: true, features: true, imageUrl: true,
      fuelLevel: true, status: true, latitude: true, longitude: true,
      rentals: {
        select: {
          id: true, package: true, startTime: true, endTime: true,
          totalCost: true, distanceKm: true, status: true,
          user: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
        orderBy: { startTime: 'desc' },
        take: 30,
      },
    },
  });

  if (!car) {
    res.status(404).json({ status: 'error', error: 'Car not found' });
    return;
  }

  const tariffs  = getAllTariffs();
  const tariff   = tariffs.find((t) => t.carClass === car.carClass) ?? null;
  const pos      = stableCarPosition(car.id);
  const zone     = getCarZone(pos.latitude, pos.longitude);

  const completed     = car.rentals.filter((r) => r.status === 'COMPLETED');
  const totalRevenue  = completed.reduce((s, r) => s + (r.totalCost ?? 0), 0);
  const totalKm       = completed.reduce((s, r) => s + r.distanceKm, 0);

  res.json({
    status: 'success',
    car: {
      ...car,
      zone,
      tariff,
      stats: {
        totalRentals:     car.rentals.length,
        completedRentals: completed.length,
        totalRevenue:     Math.round(totalRevenue * 100) / 100,
        totalKm:          Math.round(totalKm * 10) / 10,
      },
    },
  });
}

/* Nearby cars for logged-in users (legacy endpoint) */
export async function getNearbyCars(req: AuthRequest, res: Response) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400).json({ error: 'lat and lon query params are required' });
    return;
  }

  const userLat = parseFloat(lat as string);
  const userLon = parseFloat(lon as string);

  if (isNaN(userLat) || isNaN(userLon)) {
    res.status(400).json({ error: 'lat and lon must be valid numbers' });
    return;
  }

  const allCars = await prisma.car.findMany({ where: { status: 'AVAILABLE' } });
  const tariffs = getAllTariffs();

  const nearby = allCars
    .map((car) => {
      const pos    = stableCarPosition(car.id);
      const tariff = tariffs.find((t) => t.carClass === car.carClass);
      const dist   = haversineDistance(userLat, userLon, pos.latitude, pos.longitude);
      return { ...car, latitude: pos.latitude, longitude: pos.longitude, tariff, distanceMeters: Math.round(dist) };
    })
    .filter((car) => car.distanceMeters <= 1000)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({ status: 'success', cars: nearby, count: nearby.length });
}

export async function getCarById(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const car = await prisma.car.findUnique({ where: { id } });
  if (!car) {
    res.status(404).json({ error: 'Car not found' });
    return;
  }

  const tariffs = getAllTariffs();
  const tariff  = tariffs.find((t) => t.carClass === car.carClass);
  const zone    = getCarZone(car.latitude, car.longitude);

  res.json({ car: { ...car, tariff, zone } });
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /cars/stats   (admin)
   Returns real aggregate data for the admin dashboard.
───────────────────────────────────────────────────────────────────────────── */
export async function getAdminStats(_req: Request, res: Response) {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    totalFleet,
    byStatus,
    activeRentals,
    pendingTasks,
    dailyRevenueAgg,
    recentCars,
    recentTasks,
  ] = await Promise.all([
    prisma.car.count(),
    prisma.car.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.rental.count({ where: { status: 'ACTIVE' } }),
    prisma.task.count({ where: { status: 'PENDING' } }),
    prisma.rental.aggregate({
      _sum: { totalCost: true },
      where: { status: 'COMPLETED', endTime: { gte: todayStart } },
    }),
    prisma.car.findMany({
      select: {
        id: true, licensePlate: true, model: true,
        carClass: true, fuelLevel: true, status: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.task.findMany({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      select: {
        id: true, type: true, status: true, notes: true, createdAt: true,
        car: { select: { licensePlate: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));

  res.json({
    totalFleet,
    available:     statusMap['AVAILABLE']   ?? 0,
    rented:        statusMap['RENTED']      ?? 0,
    maintenance:   statusMap['MAINTENANCE'] ?? 0,
    activeRentals,
    pendingTasks,
    dailyRevenue:  dailyRevenueAgg._sum.totalCost ?? 0,
    recentCars,
    recentTasks,
  });
}
