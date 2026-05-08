import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authenticateAdmin } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  getMe,
  updateMe,
  submitDriverLicense,
  submitPassport,
  blockUser,
  setVipStatus,
  deleteUser,
  rateUser,
  setBlacklist,
  getNotifications,
  markNotificationsRead,
} from '../controllers/userController';

const router = Router();

// Admin routes — static paths before dynamic /:id
router.get('/',                        authenticateAdmin, getAllUsers);
router.get('/notifications',           authenticateAdmin, getNotifications);
router.post('/notifications/read',     authenticateAdmin, markNotificationsRead);
router.get('/:id',                     authenticateAdmin, getUserById);
router.patch('/:id/block',             authenticateAdmin, blockUser);
router.patch('/:id/vip',               authenticateAdmin, setVipStatus);
router.patch('/:id/rate',              authenticateAdmin, rateUser);
router.patch('/:id/blacklist',         authenticateAdmin, setBlacklist);
router.delete('/:id',                  authenticateAdmin, deleteUser);

// Client routes
router.get('/me', authenticate, getMe);
router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().notEmpty().withMessage('firstName cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('lastName cannot be empty'),
  ],
  updateMe
);
router.post(
  '/me/driver-license',
  authenticate,
  [body('licenseNumber').notEmpty().withMessage('licenseNumber is required')],
  submitDriverLicense
);
router.post(
  '/me/passport',
  authenticate,
  [body('passportNumber').notEmpty().withMessage('passportNumber is required')],
  submitPassport
);

export default router;
