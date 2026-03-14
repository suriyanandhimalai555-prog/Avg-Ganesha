import 'dotenv/config'; // Must load first so process.env is ready for config
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { rateLimitConfig, corsConfig } from './config/index.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import inviteRoutes from './modules/invites/invite.routes.js';
import kycRoutes from './modules/kyc/kyc.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import plansRoutes from './modules/plans/plans.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// 1. SECURITY HEADERS
app.use(helmet());

// 2. RATE LIMITING
const apiLimiter = rateLimit({
  ...rateLimitConfig.api,
  message: 'Too many requests from this IP, please try again later.',
});
const authLimiter = rateLimit({
  ...rateLimitConfig.auth,
  message: 'Too many auth attempts. Please try again later.',
});
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// 3. CORS
const allowedOrigins = corsConfig.allowedOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Ganesha Seva Platform' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🐘 Ganesha Seva Platform running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Allowed Origins:`, allowedOrigins);
});