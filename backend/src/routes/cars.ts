import { Router } from 'express';
import { authenticate, authenticateAdmin } from '../middleware/auth';
import {
  getPublicCars,
  getAllCars,
  getAdminStats,
  createCar,
  updateCar,
  reserveCar,
  getNearbyCars,
  getCarById,
  getCarAdminDetail,
} from '../controllers/carController';
import { uploadCarImage } from '../middleware/upload';

const router = Router();

/* Public — no auth required */
router.get('/public', getPublicCars);

/* Admin — static paths must come before /:id */
router.get('/',             authenticateAdmin, getAllCars);
router.get('/stats',        authenticateAdmin, getAdminStats);

/* Client — JWT required */
router.post('/:id/reserve', authenticate, reserveCar);
router.get('/nearby',       authenticate, getNearbyCars);
router.get('/:id',          authenticate, getCarById);

/* Admin — dynamic paths */
router.get('/:id/detail',   authenticateAdmin, getCarAdminDetail);
router.post('/',            authenticateAdmin, uploadCarImage, createCar);
router.patch('/:id',        authenticateAdmin, uploadCarImage, updateCar);

export default router;
