import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, display_name, password, bio, avatar_id, banner_color } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.findUserByUsername(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: `Username @${cleanUsername} is already claimed! Choose another.` });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `usr_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      username: cleanUsername,
      display_name: (display_name && display_name.trim()) || cleanUsername,
      bio: (bio && bio.trim()) || 'Pixel wanderer traversing the 8-bit stream.',
      avatar_id: avatar_id || 'knight',
      banner_color: banner_color || '#3a86ff',
      password_hash,
      created_at: new Date().toISOString(),
      followers_count: 0,
      following_count: 0,
      role: 'citizen',
    };

    db.createUser(newUser);
    const safeUser = db.toSafeUser(newUser, newUser.id);
    const token = generateToken(safeUser);

    return res.status(201).json({
      message: 'Account created successfully!',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please provide both username and password.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.findUserByUsername(cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const safeUser = db.toSafeUser(user, user.id);
    const token = generateToken(safeUser);

    return res.json({
      message: 'Logged in successfully!',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.user });
});

export default router;
