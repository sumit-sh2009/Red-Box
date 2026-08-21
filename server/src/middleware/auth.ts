import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { SafeUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pixel_super_secret_arcade_key_8bit';

export interface AuthRequest extends Request {
  user?: SafeUser;
}

export function generateToken(user: SafeUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role || 'citizen' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function requireGov(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'government') {
      return res.status(403).json({ error: 'Government access required.' });
    }
    next();
  });
}

export function extractUser(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = db.findUserById(decoded.id);
    if (user) {
      req.user = db.toSafeUser(user, user.id);
    }
  } catch (err) {
    // Token invalid or expired, continue as unauthenticated
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User session not found.' });
    }
    req.user = db.toSafeUser(user, user.id);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}
