import { Router } from 'express';
import { getParkingZones } from '../controllers/mapController';

const router = Router();

router.get('/zones', getParkingZones);

export default router;
