import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import trendsRoutes from './routes/trends.js';
import complaintsRoutes from './routes/complaints.js';
import govRoutes from './routes/gov.js';
import { db } from './db/database.js';
import { seedCivicData } from './db/seedCivic.js';
import { initialUsers } from './db/seed.js';
import { pgEnabled } from './db/pg.js';
import { seedPgDatabase } from './db/pgSeed.js';

dotenv.config();

let booted = false;

export async function bootstrap(): Promise<void> {
  if (booted) return;
  booted = true;

  if (pgEnabled()) {
    try {
      await seedPgDatabase();
    } catch (err) {
      console.error('PostgreSQL bootstrap failed — API will still start; check DATABASE_URL:', err);
    }
    return;
  }

  for (const u of initialUsers) {
    if (!(await db.findUserById(u.id)) && !(await db.findUserByUsername(u.username))) {
      await db.createUser(u);
    } else {
      const existing = await db.findUserByUsername(u.username);
      if (existing && !existing.role) {
        await db.updateUser(existing.id, { role: u.role });
      }
    }
  }

  await seedCivicData('user_citizen_demo');
}

export async function createApp(): Promise<express.Application> {
  await bootstrap();

  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/trends', trendsRoutes);
  app.use('/api/complaints', complaintsRoutes);
  app.use('/api/gov', govRoutes);

  app.get('/api/health', async (_req, res) => {
    const payload: Record<string, unknown> = {
      status: 'ok',
      time: new Date().toISOString(),
      service: 'red-box-api',
      storage: pgEnabled() ? 'postgres' : 'json',
    };
    if (pgEnabled()) {
      try {
        const { pgQuery } = await import('./db/pg.js');
        await pgQuery('SELECT 1');
        payload.database = 'connected';
      } catch {
        payload.database = 'error';
        payload.status = 'degraded';
      }
    }
    res.json(payload);
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
