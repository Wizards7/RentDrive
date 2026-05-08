import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { startRental, endRental, getActiveRental, getRentalHistory } from '../controllers/rentalController';

const router = Router();

router.get('/active', authenticate, getActiveRental);
router.get('/history', authenticate, getRentalHistory);

router.post(
  '/start',
  authenticate,
  [
    body('carId').notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('package')
      .optional()
      .isIn(['PER_MINUTE', 'H3', 'H6', 'H12', 'H24'])
      .withMessage('package must be one of: PER_MINUTE, H3, H6, H12, H24'),
  ],
  startRental
);

router.post(
  '/end',
  authenticate,
  [
    body('rentalId').notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('drivingMinutes').isFloat({ min: 0 }),
    body('waitingMinutes').isFloat({ min: 0 }),
    body('distanceKm').isFloat({ min: 0 }),
  ],
  endRental
);

export default router;
