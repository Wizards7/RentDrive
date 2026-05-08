import { Request, Response } from 'express';
import prisma from '../config/database';

export async function getParkingZones(_req: Request, res: Response) {
  const zones = await prisma.parkingZone.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true, geojson: true },
  });

  const geojson = {
    type: 'FeatureCollection',
    features: zones.map((zone) => ({
      type: 'Feature',
      properties: { id: zone.id, name: zone.name, description: zone.description },
      geometry: zone.geojson,
    })),
  };

  res.json(geojson);
}
