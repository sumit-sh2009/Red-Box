import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { extractUser, requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/profile/:username', extractUser, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await db.findUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'Pixel user not found.' });
    }

    const safeUser = await db.toSafeUser(user, req.user?.id);
    const badges = await db.getUserBadges(user.id);

    return res.json({
      user: safeUser,
      badges,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

router.get('/:id/badges', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const badges = await db.getUserBadges(id);
    return res.json({ badges });
  } catch (err) {
    console.error('Error fetching user badges:', err);
    return res.status(500).json({ error: 'Failed to fetch badges.' });
  }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { display_name, bio, avatar_id, banner_color } = req.body;

    const updates: Record<string, string> = {};
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar_id !== undefined) updates.avatar_id = avatar_id;
    if (banner_color !== undefined) updates.banner_color = banner_color;

    const updatedUser = await db.updateUser(currentUserId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safe = await db.toSafeUser(updatedUser, currentUserId);
    const badges = await db.getUserBadges(currentUserId);

    return res.json({
      message: 'Profile upgraded!',
      user: safe,
      badges,
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.post('/:id/follow', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.id;

    const result = await db.toggleFollow(currentUserId, targetUserId);
    return res.json(result);
  } catch (err) {
    console.error('Error toggling follow:', err);
    return res.status(500).json({ error: 'Failed to toggle follow status.' });
  }
});

router.get('/suggestions', extractUser, async (req: AuthRequest, res: Response) => {
  try {
    const suggestions = await db.getSuggestedUsers(req.user?.id, 6);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    return res.status(500).json({ error: 'Failed to fetch suggestions.' });
  }
});

router.get('/search', extractUser, async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const users = await db.searchUsers(query, req.user?.id);
    return res.json({ users });
  } catch (err) {
    console.error('Error searching users:', err);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
});

export default router;
