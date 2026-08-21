import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { extractUser, requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/users/profile/:username
router.get('/profile/:username', extractUser, (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = db.findUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: 'Pixel user not found.' });
    }

    const safeUser = db.toSafeUser(user, req.user?.id);
    const badges = db.getUserBadges(user.id);

    return res.json({
      user: safeUser,
      badges,
    });
  } catch (err: any) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// GET /api/users/:id/badges
router.get('/:id/badges', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const badges = db.getUserBadges(id);
    return res.json({ badges });
  } catch (err: any) {
    console.error('Error fetching user badges:', err);
    return res.status(500).json({ error: 'Failed to fetch badges.' });
  }
});

// PATCH /api/users/profile - Update current user profile
router.patch('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { display_name, bio, avatar_id, banner_color } = req.body;

    const updates: Record<string, any> = {};
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar_id !== undefined) updates.avatar_id = avatar_id;
    if (banner_color !== undefined) updates.banner_color = banner_color;

    const updatedUser = db.updateUser(currentUserId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safe = db.toSafeUser(updatedUser, currentUserId);
    const badges = db.getUserBadges(currentUserId);

    return res.json({
      message: 'Profile upgraded!',
      user: safe,
      badges,
    });
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/users/:id/follow - Toggle follow
router.post('/:id/follow', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.id;

    const result = db.toggleFollow(currentUserId, targetUserId);
    return res.json(result);
  } catch (err: any) {
    console.error('Error toggling follow:', err);
    return res.status(500).json({ error: 'Failed to toggle follow status.' });
  }
});

// GET /api/users/suggestions - Get recommended users
router.get('/suggestions', extractUser, (req: AuthRequest, res: Response) => {
  try {
    const suggestions = db.getSuggestedUsers(req.user?.id, 6);
    return res.json({ suggestions });
  } catch (err: any) {
    console.error('Error fetching suggestions:', err);
    return res.status(500).json({ error: 'Failed to fetch suggestions.' });
  }
});

// GET /api/users/search?q=query
router.get('/search', extractUser, (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const users = db.searchUsers(query, req.user?.id);
    return res.json({ users });
  } catch (err: any) {
    console.error('Error searching users:', err);
    return res.status(500).json({ error: 'Failed to search users.' });
  }
});

export default router;
