/**
 * Centralized configuration - single source of truth for env and constants.
 * Makes the app easier to edit and test (inject config for tests).
 */

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

export const authConfig = Object.freeze({
  jwtSecret: process.env.JWT_SECRET || '',
  accessTokenExpiry: process.env.JWT_EXPIRY || '1d',
  bcryptRounds: 10,
});

export const rateLimitConfig = Object.freeze({
  api: { windowMs: 15 * 60 * 1000, max: 500 },
  auth: { windowMs: 15 * 60 * 1000, max: 50 },
});

export const corsConfig = Object.freeze({
  allowedOrigins: [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://donate.agilavetriganesha.com'
  ]
    .filter(Boolean)
    .map((o) => o?.trim()),
});
