import { Router } from 'express';
import { body } from 'express-validator';
import { register, verifyPhone, login, adminLogin } from '../controllers/authController';

const router = Router();

router.post(
  '/register',
  [
    body('phone').matches(/^\+992\d{9}$/).withMessage('Enter a valid Tajik phone (+992XXXXXXXXX)'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('dateOfBirth').isISO8601().withMessage('dateOfBirth must be a valid date (YYYY-MM-DD)'),
  ],
  register
);

router.post('/verify-phone', verifyPhone);

router.post(
  '/login',
  [body('phone').notEmpty(), body('password').notEmpty()],
  login
);

router.post('/admin/login', adminLogin);

export default router;
