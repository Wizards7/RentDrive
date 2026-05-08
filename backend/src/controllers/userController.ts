import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export async function getAllUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      phoneVerified: true,
      firstName: true,
      lastName: true,
      tajikPassportVerified: true,
      driverLicenseVerified: true,
      isBlocked: true,
      isVip: true,
      vipDiscount: true,
      rating: true,
      isBlacklisted: true,
      createdAt: true,
      _count: { select: { rentals: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
}

/* GET /users/:id — full profile + rental history for admin detail page */
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      phone: true,
      phoneVerified: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      tajikPassportNumber: true,
      tajikPassportVerified: true,
      driverLicenseNumber: true,
      driverLicenseVerified: true,
      isBlocked: true,
      isVip: true,
      vipDiscount: true,
      rating: true,
      isBlacklisted: true,
      createdAt: true,
      rentals: {
        select: {
          id: true,
          package: true,
          startTime: true,
          endTime: true,
          totalCost: true,
          distanceKm: true,
          status: true,
          car: {
            select: { id: true, model: true, carClass: true, imageUrl: true },
          },
        },
        orderBy: { startTime: 'desc' },
      },
    },
  });

  if (!user) {
    res.status(404).json({ status: 'error', error: 'User not found' });
    return;
  }

  const completed = user.rentals.filter((r) => r.status === 'COMPLETED');
  const totalSpend = completed.reduce((sum, r) => sum + (r.totalCost ?? 0), 0);

  /* Preferred category */
  const catCounts: Record<string, number> = {};
  completed.forEach((r) => {
    catCounts[r.car.carClass] = (catCounts[r.car.carClass] ?? 0) + 1;
  });
  const preferredCategory =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  /* Loyalty: ≥10 completed rentals + rating > 4.5 */
  const hasLoyaltyDiscount = completed.length >= 10 && user.rating > 4.5;
  const loyaltyDiscountPct = !hasLoyaltyDiscount ? 0 : totalSpend >= 10000 ? 10 : 5;

  res.json({
    status: 'success',
    user: {
      ...user,
      stats: {
        totalRentals: user.rentals.length,
        completedRentals: completed.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        preferredCategory,
        hasLoyaltyDiscount,
        loyaltyDiscountPct,
      },
    },
  });
}

/* PATCH /users/:id/rate — report incident, drop rating, auto-blacklist if < 1.0 */
export async function rateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { penalty, reason } = req.body;

  const penaltyNum = parseFloat(penalty);
  if (!penalty || isNaN(penaltyNum) || penaltyNum <= 0 || penaltyNum > 5) {
    res.status(400).json({ status: 'error', error: 'penalty must be a number between 0.1 and 5' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ status: 'error', error: 'User not found' });
    return;
  }

  const newRating  = Math.max(0, Math.round((user.rating - penaltyNum) * 10) / 10);
  const autoBlacklist = newRating < 1.0;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      rating: newRating,
      ...(autoBlacklist ? { isBlacklisted: true } : {}),
    },
    select: { id: true, rating: true, isBlacklisted: true },
  });

  await prisma.notification.create({
    data: {
      type:  autoBlacklist ? 'USER_BLACKLISTED' : 'USER_INCIDENT',
      title: autoBlacklist ? '🚫 User Auto-Blacklisted' : '⚠️ Driver Incident Reported',
      body:  `${user.firstName} ${user.lastName}: ${reason ?? 'Incident reported'}. ` +
             `Rating ${user.rating} → ${newRating}` +
             (autoBlacklist ? '. User automatically blacklisted (rating < 1.0).' : '.'),
    },
  });

  res.json({ status: 'success', user: updated });
}

/* PATCH /users/:id/blacklist — manually blacklist or clear a user */
export async function setBlacklist(req: Request, res: Response) {
  const { id } = req.params;
  const { blacklist } = req.body;

  if (typeof blacklist !== 'boolean') {
    res.status(400).json({ status: 'error', error: 'blacklist must be a boolean' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ status: 'error', error: 'User not found' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlacklisted: blacklist },
    select: { id: true, isBlacklisted: true },
  });

  await prisma.notification.create({
    data: {
      type:  blacklist ? 'USER_BLACKLISTED' : 'USER_CLEARED',
      title: blacklist ? '🚫 User Manually Blacklisted' : '✅ User Cleared from Blacklist',
      body:  `${user.firstName} ${user.lastName} (${user.phone}) was ${blacklist ? 'manually blacklisted' : 'cleared from the blacklist'} by admin.`,
    },
  });

  res.json({ status: 'success', user: updated });
}

export async function blockUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked: !user.isBlocked },
    select: { id: true, isBlocked: true },
  });

  await (prisma as any).notification.create({
    data: {
      id: `notif-${Date.now()}`,
      type: 'USER_BLOCKED',
      title: updated.isBlocked ? 'User Blocked' : 'User Unblocked',
      body: `${user.firstName} ${user.lastName} (${user.phone}) has been ${updated.isBlocked ? 'blocked' : 'unblocked'}.`,
    },
  });

  res.json({ user: updated });
}

export async function setVipStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { isVip, vipDiscount } = req.body;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isVip: isVip ?? !user.isVip,
      vipDiscount: vipDiscount ?? (isVip ? 10 : 0),
    },
    select: { id: true, isVip: true, vipDiscount: true },
  });

  await (prisma as any).notification.create({
    data: {
      id: `notif-${Date.now()}`,
      type: 'VIP_STATUS',
      title: updated.isVip ? 'VIP Status Granted' : 'VIP Status Removed',
      body: `${user.firstName} ${user.lastName} (${user.phone}) VIP status ${updated.isVip ? `granted with ${updated.vipDiscount}% discount` : 'removed'}.`,
    },
  });

  res.json({ user: updated });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  await prisma.user.delete({ where: { id } });

  await (prisma as any).notification.create({
    data: {
      id: `notif-${Date.now()}`,
      type: 'USER_DELETED',
      title: 'User Deleted',
      body: `${user.firstName} ${user.lastName} (${user.phone}) account was deleted.`,
    },
  });

  res.json({ message: 'User deleted' });
}

export async function getNotifications(req: Request, res: Response) {
  const notifications = await (prisma as any).notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ notifications });
}

export async function markNotificationsRead(req: Request, res: Response) {
  await (prisma as any).notification.updateMany({ data: { read: true } });
  res.json({ message: 'All notifications marked as read' });
}

/* Shared discount helper — used by getMe and reserveCar */
export function computeDiscount(completedRentals: number, vipDiscount: number): {
  discountPct: number;
  discountTier: string;
} {
  let autoPct = 0;
  let tier = 'Standard';
  if (completedRentals >= 20)      { autoPct = 15; tier = 'Platinum'; }
  else if (completedRentals >= 10) { autoPct = 10; tier = 'Gold'; }
  else if (completedRentals >= 5)  { autoPct = 5;  tier = 'Silver'; }

  const discountPct = Math.max(autoPct, vipDiscount);
  const discountTier = vipDiscount > 0 && vipDiscount >= autoPct ? 'VIP' : tier;
  return { discountPct, discountTier };
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      phone: true,
      phoneVerified: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      tajikPassportNumber: true,
      tajikPassportVerified: true,
      driverLicenseNumber: true,
      driverLicenseVerified: true,
      isVip: true,
      vipDiscount: true,
      rating: true,
      createdAt: true,
      _count: { select: { rentals: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const completedRentals = await prisma.rental.count({
    where: { userId: req.userId!, status: 'COMPLETED' },
  });

  const { discountPct, discountTier } = computeDiscount(completedRentals, user.vipDiscount);

  res.json({
    user: {
      ...user,
      totalRentals: user._count.rentals,
      completedRentals,
      discountPct,
      discountTier,
    },
  });
}

export async function updateMe(req: AuthRequest, res: Response) {
  const { firstName, lastName } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      tajikPassportVerified: true,
      driverLicenseVerified: true,
    },
  });

  res.json({ user });
}

export async function submitDriverLicense(req: AuthRequest, res: Response) {
  const { licenseNumber } = req.body;

  if (!licenseNumber) {
    res.status(400).json({ error: 'licenseNumber is required' });
    return;
  }

  // In production: store uploaded document, send to verification queue
  await prisma.user.update({
    where: { id: req.userId! },
    data: {
      driverLicenseNumber: licenseNumber,
      // driverLicenseVerified stays false until admin approves
    },
  });

  res.json({ message: 'Driver license submitted for verification' });
}

export async function submitPassport(req: AuthRequest, res: Response) {
  const { passportNumber } = req.body;

  if (!passportNumber) {
    res.status(400).json({ error: 'passportNumber is required' });
    return;
  }

  await prisma.user.update({
    where: { id: req.userId! },
    data: {
      tajikPassportNumber: passportNumber,
      // tajikPassportVerified stays false until admin approves
    },
  });

  res.json({ message: 'Passport submitted for verification' });
}
