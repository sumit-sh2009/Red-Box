import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { extractUser, requireAuth, AuthRequest } from '../middleware/auth.js';
import { Post } from '../types/index.js';

const router = Router();

// GET /api/posts - Fetch feed / filtered posts
router.get('/', extractUser, (req: AuthRequest, res: Response) => {
  try {
    const { tab, userId, tag, search, filter, page, limit } = req.query;

    const result = db.getPosts({
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
  } catch (err: any) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// GET /api/posts/:id - Fetch single post with full threaded replies
router.get('/:id', extractUser, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = db.findPostById(id, req.user?.id);

    if (!post) {
      return res.status(404).json({ error: 'Chirp not found in the pixelverse.' });
    }

    return res.json({ post });
  } catch (err: any) {
    console.error('Error fetching post thread:', err);
    return res.status(500).json({ error: 'Failed to fetch post thread.' });
  }
});

// POST /api/posts - Create a chirp, reply, repost, or quote-chirp
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { content, image_url, parent_post_id, repost_of_id, quote_post_id } = req.body;

    // Validation: content max 280 chars
    const text = (content || '').trim();
    if (text.length > 280) {
      return res.status(400).json({ error: 'Chirps cannot exceed 280 characters.' });
    }

    // A pure repost doesn't need content or image, but a standard chirp or reply or quote does
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

    db.createPost(newPost);
    const enriched = db.enrichPost(newPost, user.id);

    return res.status(201).json({
      message: 'Chirp transmitted!',
      post: enriched,
    });
  } catch (err: any) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Failed to broadcast chirp.' });
  }
});

// DELETE /api/posts/:id - Delete own post
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = db.deletePost(id, req.user!.id);

    if (!success) {
      return res.status(403).json({ error: 'Could not delete chirp. You can only delete your own chirps.' });
    }

    return res.json({ message: 'Chirp disintegrated from the timeline.' });
  } catch (err: any) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST /api/posts/:id/like - Toggle like
router.post('/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.toggleLike(req.user!.id, id);
    return res.json(result);
  } catch (err: any) {
    console.error('Error toggling like:', err);
    return res.status(400).json({ error: err.message || 'Failed to toggle like.' });
  }
});

// POST /api/posts/:id/repost - Toggle pure repost
router.post('/:id/repost', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.toggleRepost(req.user!.id, id);
    return res.json(result);
  } catch (err: any) {
    console.error('Error toggling repost:', err);
    return res.status(400).json({ error: err.message || 'Failed to toggle repost.' });
  }
});

export default router;
