import prisma from '../config/database';

const FUEL_THRESHOLD = 20; // % — alert below this
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const COOLDOWN_MS = 60 * 60 * 1000; // don't re-alert same car within 1 hour

async function checkFuelLevels() {
  const lowFuelCars = await prisma.car.findMany({
    where: { fuelLevel: { lt: FUEL_THRESHOLD } },
    select: { id: true, model: true, licensePlate: true, fuelLevel: true },
  });

  for (const car of lowFuelCars) {
    // Skip if we already sent a notification for this car in the last hour
    const recent = await (prisma as any).notification.findFirst({
      where: {
        type: 'LOW_FUEL',
        body: { contains: car.licensePlate },
        createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
      },
    });

    if (recent) continue;

    const urgency = car.fuelLevel < 5 ? '🔴 CRITICAL' : car.fuelLevel < 10 ? '🟠 URGENT' : '🟡 LOW';

    await (prisma as any).notification.create({
      data: {
        id: `notif-fuel-${car.id}-${Date.now()}`,
        type: 'LOW_FUEL',
        title: `${urgency} — Fuel Alert`,
        body: `${car.model} (${car.licensePlate}) has only ${car.fuelLevel}% fuel remaining. Dispatch refuel task immediately.`,
      },
    });

    console.log(`[FuelMonitor] Alert created for ${car.licensePlate} — ${car.fuelLevel}%`);
  }
}

export function startFuelMonitor() {
  console.log('[FuelMonitor] Started — checking every 5 minutes');
  checkFuelLevels(); // run immediately on startup
  setInterval(checkFuelLevels, CHECK_INTERVAL_MS);
}
