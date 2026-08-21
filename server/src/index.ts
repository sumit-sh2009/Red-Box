import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import trendsRoutes from './routes/trends.js';
import { db } from './db/database.js';
import { seedCivic } from './db/seedCivic.js';
import { initialUsers } from './db/seed.js';
import complaintsRoutes from './routes/complaints.js';
import govRoutes from './routes/gov.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/gov', govRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), message: 'Open thoughts pixel server running!' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error in the pixel matrix.' });
});

app.listen(PORT, () => {
  for (const u of initialUsers) {
    if (!db.findUserById(u.id) && !db.findUserByUsername(u.username)) {
      db.createUser(u);
    } else {
      const existing = db.findUserByUsername(u.username);
      if (existing && !existing.role) {
        db.updateUser(existing.id, { role: u.role });
      }
    }
  }
  seedCivic('user_citizen_demo');
  console.log(`Civic pixel server on http://localhost:${PORT}`);
});
