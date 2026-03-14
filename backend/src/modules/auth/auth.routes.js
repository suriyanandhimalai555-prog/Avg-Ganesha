import express from 'express';
import { register, login, me } from './auth.controller.js';
import { registerValidation, loginValidation } from './auth.validator.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, me);

export default router;