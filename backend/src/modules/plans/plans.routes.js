import express from 'express';
import { getPlans, updatePlan } from './plans.controller.js';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Public Route — anyone can view plans
router.get('/', getPlans);

// Protected Route — only ADMIN can update plans
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), updatePlan);

export default router;