import { Request, Response } from 'express';
import { TaskStatus, TaskType } from '@prisma/client';
import prisma from '../config/database';

export async function getTasks(req: Request, res: Response) {
  const { status, type, carId } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      ...(status && { status: status as TaskStatus }),
      ...(type && { type: type as TaskType }),
      ...(carId && { carId: carId as string }),
    },
    include: {
      car: {
        select: { model: true, licensePlate: true, latitude: true, longitude: true, fuelLevel: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ tasks, count: tasks.length });
}

export async function updateTask(req: Request, res: Response) {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      car: { select: { model: true, licensePlate: true } },
    },
  });

  res.json({ task: updated });
}
