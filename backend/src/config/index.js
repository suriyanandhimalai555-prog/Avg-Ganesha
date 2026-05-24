/**
 * Centralized configuration - single source of truth for env and constants.
 * Makes the app easier to edit and test (inject config for tests).
 */

const isProduction = process.env.NODE_ENV === 'production';

// Refuse to boot in production with a missing/placeholder JWT_SECRET — anyone with
// the placeholder string can forge tokens.
const JWT_PLACEHOLDER = 'change_this_to_a_long_random_secret';
const jwtSecret = process.env.JWT_SECRET || '';
if (isProduction && (!jwtSecret || jwtSecret === JWT_PLACEHOLDER || jwtSecret.length < 32)) {
  throw new Error(
    'JWT_SECRET must be set to a strong (>=32 char) random value in production. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

export const authConfig = Object.freeze({
  jwtSecret,
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
