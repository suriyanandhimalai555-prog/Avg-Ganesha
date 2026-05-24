import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';
import { query } from '../shared/db.js';
import redisClient, { invalidateCache } from '../shared/redis.js';

const AUTH_USER_TTL = 60; // seconds — role/email changes propagate within this window
const authUserKey = (id) => `auth:user:${id}`;

// Invalidate the cached auth profile (call after role/email mutation)
export const invalidateAuthUser = (userId) => invalidateCache(authUserKey(userId));

// 1. Authenticate Token (Redis-cached user lookup to avoid a Postgres roundtrip per request)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, authConfig.jwtSecret, async (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    try {
      const cacheKey = authUserKey(decodedUser.id);
      let userProfile = null;

      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          userProfile = JSON.parse(cached);
        }
      }

      if (!userProfile) {
        const userRes = await query(
          'SELECT id, role, email FROM users WHERE id = $1',
          [decodedUser.id]
        );
        if (userRes.rows.length === 0) {
          return res.status(401).json({ error: 'User does not exist or has been deleted.' });
        }
        userProfile = {
          id: userRes.rows[0].id,
          role: userRes.rows[0].role,
          email: userRes.rows[0].email,
        };
        if (redisClient.isOpen) {
          await redisClient.setEx(cacheKey, AUTH_USER_TTL, JSON.stringify(userProfile));
        }
      }

      req.user = userProfile;
      next();
    } catch (dbErr) {
      console.error('Auth verification error:', dbErr);
      return res.status(500).json({ error: 'Server error during authentication.' });
    }
  });
};

// 2. Authorize Role (Generic)
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.sendStatus(401);

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// 3. Admin shorthand
export const requireAdmin = authorizeRole('ADMIN');
