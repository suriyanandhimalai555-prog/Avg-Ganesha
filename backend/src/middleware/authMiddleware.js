import jwt from 'jsonwebtoken';
import { authConfig } from '../config/index.js';
import { query } from '../shared/db.js';

// 1. Authenticate Token
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
    
    // Check if the user is still in the database
    try {
      const userRes = await query('SELECT id, role, email FROM users WHERE id = $1', [decodedUser.id]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ error: 'User does not exist or has been deleted.' });
      }
      
      // Keep the JWT role unless you explicitly need the exact DB role on every request
      // We overwrite role here just in case admin changed it instantly, though JWT payload takes precedence mostly unless strictly enforced.
      req.user = {
        id: decodedUser.id,
        role: userRes.rows[0].role, // overwrite with real DB role to handle live demotions
        email: userRes.rows[0].email
      };
      
      next();
    } catch (dbErr) {
      console.error('Auth verification DB error:', dbErr);
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
