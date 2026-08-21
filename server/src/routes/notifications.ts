import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await db.getNotifications(req.user!.id);
    return res.json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.post('/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db.markNotificationsAsRead(req.user!.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
