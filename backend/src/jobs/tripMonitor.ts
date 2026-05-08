import prisma from '../config/database';

const PKG_DURATION_MINS: Record<string, number> = {
  H3: 180, H6: 360, H12: 720, H24: 1440,
};

const notifiedExpiring = new Set<string>();
const notifiedExpired  = new Set<string>();

export function startTripMonitor() {
  setInterval(async () => {
    try {
      const activeRentals = await prisma.rental.findMany({
        where: {
          status: 'ACTIVE',
          package: { in: ['H3', 'H6', 'H12', 'H24'] },
        },
        select: { id: true, startTime: true, package: true, userId: true, carId: true },
      });

      const now = Date.now();

      for (const rental of activeRentals) {
        const limit    = PKG_DURATION_MINS[rental.package];
        if (!limit) continue;

        const elapsedMins  = (now - rental.startTime.getTime()) / 60000;
        const remaining    = limit - elapsedMins;

        /* 15-min warning */
        if (remaining <= 15 && remaining > 0 && !notifiedExpiring.has(rental.id)) {
          notifiedExpiring.add(rental.id);
          await (prisma as any).notification.create({
            data: {
              type:  'TRIP_EXPIRING',
              title: '⏰ Your trip is ending soon!',
              body:  `You have ~${Math.ceil(remaining)} minutes left. Find a Green Zone to park or extend your time.`,
            },
          });
        }

        /* Package expired — switch to per-minute penalty mode */
        if (remaining <= 0 && !notifiedExpired.has(rental.id)) {
          notifiedExpired.add(rental.id);
          await (prisma as any).notification.create({
            data: {
              type:  'TRIP_EXPIRED',
              title: '🚨 Time is up!',
              body:  `Your ${rental.package.replace('H', '')}-hour package has expired. Extra minutes are now charged at the per-minute rate.`,
            },
          });
        }
      }
    } catch (err) {
      console.error('[tripMonitor]', err);
    }
  }, 60_000);

  console.log('[tripMonitor] started — checking every 60 s');
}
