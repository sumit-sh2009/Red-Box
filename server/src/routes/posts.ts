import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { extractUser, requireAuth, AuthRequest } from '../middleware/auth.js';
import { Post } from '../types/index.js';

const router = Router();

router.get('/', extractUser, async (req: AuthRequest, res: Response) => {
  try {
    const { tab, userId, tag, search, filter, page, limit } = req.query;

    const result = await db.getPosts({
      tab: (tab as 'foryou' | 'following') || 'foryou',
      userId: userId as string,
      tag: tag as string,
      search: search as string,
      filter: filter as 'chirps' | 'replies' | 'likes' | 'media',
      currentUserId: req.user?.id,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    return res.json(result);
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

router.get('/:id', extractUser, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await db.findPostById(id, req.user?.id);

    if (!post) {
      return res.status(404).json({ error: 'Chirp not found in the pixelverse.' });
    }

    return res.json({ post });
  } catch (err) {
    console.error('Error fetching post thread:', err);
    return res.status(500).json({ error: 'Failed to fetch post thread.' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { content, image_url, parent_post_id, repost_of_id, quote_post_id } = req.body;

    const text = (content || '').trim();
    if (text.length > 280) {
      return res.status(400).json({ error: 'Chirps cannot exceed 280 characters.' });
    }

    if (!repost_of_id && !text && !image_url) {
      return res.status(400).json({ error: 'Chirp cannot be empty.' });
    }

    const newPost: Post = {
      id: `post_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      user_id: user.id,
      content: text,
      image_url: image_url || null,
      parent_post_id: parent_post_id || null,
      repost_of_id: repost_of_id || null,
      quote_post_id: quote_post_id || null,
      created_at: new Date().toISOString(),
      likes_count: 0,
      replies_count: 0,
      reposts_count: 0,
    };

    await db.createPost(newPost);
    const enriched = await db.enrichPost(newPost, user.id);

    return res.status(201).json({
      message: 'Chirp transmitted!',
      post: enriched,
    });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Failed to broadcast chirp.' });
  }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await db.deletePost(id, req.user!.id);

    if (!success) {
      return res.status(403).json({ error: 'Could not delete chirp. You can only delete your own chirps.' });
    }

    return res.json({ message: 'Chirp disintegrated from the timeline.' });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

router.post('/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.toggleLike(req.user!.id, id);
    return res.json(result);
  } catch (err: unknown) {
    console.error('Error toggling like:', err);
    const message = err instanceof Error ? err.message : 'Failed to toggle like.';
    return res.status(400).json({ error: message });
  }
});

router.post('/:id/repost', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.toggleRepost(req.user!.id, id);
    return res.json(result);
  } catch (err: unknown) {
    console.error('Error toggling repost:', err);
    const message = err instanceof Error ? err.message : 'Failed to toggle repost.';
    return res.status(400).json({ error: message });
  }
});

export default router;
