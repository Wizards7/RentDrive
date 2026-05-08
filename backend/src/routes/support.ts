import { Router } from 'express';
import { supportChat } from '../controllers/supportController';

const router = Router();

router.post('/chat', supportChat);

export default router;
