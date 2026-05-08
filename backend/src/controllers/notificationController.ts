import { Request, Response } from 'express';
import prisma from '../config/database';

/* GET /notifications — admin reads all zone alerts, newest first */
export async function getNotifications(_req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  res.json({ status: 'success', unreadCount, notifications });
}

/* PATCH /notifications/:id/read — mark a single notification as read */
export async function markNotificationRead(req: Request, res: Response) {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json({ status: 'error', error: 'Notification not found' });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data:  { read: true },
  });

  res.json({ status: 'success', notification: updated });
}

/* PATCH /notifications/read-all — mark every notification as read */
export async function markAllNotificationsRead(_req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { read: false },
    data:  { read: true },
  });

  res.json({ status: 'success', message: 'All notifications marked as read' });
}

/* POST /notifications — internal: create a manual admin notification */
export async function createNotification(req: Request, res: Response) {
  const { type, title, body } = req.body;

  if (!type || !title || !body) {
    res.status(400).json({ status: 'error', error: 'type, title, and body are required' });
    return;
  }

  const notification = await prisma.notification.create({
    data: { type, title, body },
  });

  res.status(201).json({ status: 'success', notification });
}
