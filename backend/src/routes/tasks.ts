import { Router } from 'express';
import { getTasks, updateTask } from '../controllers/taskController';

const router = Router();

// These routes are for ops team — add admin auth middleware when ready
router.get('/', getTasks);
router.patch('/:id', updateTask);

export default router;
