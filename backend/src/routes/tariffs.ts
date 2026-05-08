import { Router } from 'express';
import { getAllTariffs } from '../services/tariffService';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ tariffs: getAllTariffs(), currency: 'TJS' });
});

export default router;
