import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from '../controllers/notificationController';

const router = Router();

/* All notification routes are admin-only */
router.get('/',                   authenticateAdmin, getNotifications);
router.post('/',                  authenticateAdmin, createNotification);
router.patch('/read-all',         authenticateAdmin, markAllNotificationsRead);
router.patch('/:id/read',         authenticateAdmin, markNotificationRead);

export default router;
