import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';

// 1. Authenticate Token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, authConfig.jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
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
