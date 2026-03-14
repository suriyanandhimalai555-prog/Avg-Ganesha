import express from 'express';
import { getMyInviteStats, getMyInvitees } from './invite.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// PROTECTED ROUTES (Need Token)
router.get('/stats', authenticateToken, getMyInviteStats);
router.get('/members', authenticateToken, getMyInvitees);

export default router;
