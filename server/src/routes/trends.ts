import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const trends = await db.getTrends();
    return res.json({ trends });
  } catch (err) {
    console.error('Error fetching trends:', err);
    return res.status(500).json({ error: 'Failed to fetch trends.' });
  }
});

export default router;
