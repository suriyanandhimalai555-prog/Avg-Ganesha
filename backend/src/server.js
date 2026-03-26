import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimitConfig, corsConfig } from './config/index.js';
import { pool } from './shared/db.js';
import { RedisStore } from 'rate-limit-redis';
import redisClient from './shared/redis.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import inviteRoutes from './modules/invites/invite.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import plansRoutes from './modules/plans/plans.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import donationsRoutes from './modules/donations/donations.routes.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

const allowedOrigins = corsConfig.allowedOrigins;

// 1. CORS first so preflight and all responses get headers
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`CORS blocked: ${origin}. Allowed:`, allowedOrigins);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 2. SECURITY HEADERS (helmet after CORS)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// 3. RATE LIMITING
const apiLimiter = rateLimit({
  ...rateLimitConfig.api,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:api:',
  }),
  message: 'Too many requests from this IP, please try again later.',
});
const authLimiter = rateLimit({
  ...rateLimitConfig.auth,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:auth:',
  }),
  message: 'Too many auth attempts. Please try again later.',
});
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/donations', donationsRoutes);

// Static uploads with CORS so img tags from frontend can load (preview in admin)
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length > 0) {
    res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  } else {
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', app: 'Ganesha Seva Platform', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', app: 'Ganesha Seva Platform', db: 'disconnected' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Catch Multer errors specifically
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum limit is 5MB.' });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  console.error('Server Error:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`🐘 Ganesha Seva Platform running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Allowed Origins:`, allowedOrigins);
});

// Graceful Shutdown Handler
const gracefulShutdown = () => {
  console.log('\nClosing server and database pool...');
  server.close(() => {
    console.log('HTTP server closed.');
    pool.end().then(() => {
      console.log('Database pool closed.');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing pool:', err);
      process.exit(1);
    });
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);