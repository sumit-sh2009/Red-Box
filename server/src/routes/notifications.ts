import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const notifications = db.getNotifications(req.user!.id);
    return res.json({ notifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// POST /api/notifications/read
router.post('/read', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    db.markNotificationsAsRead(req.user!.id);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notifications as read:', err);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
