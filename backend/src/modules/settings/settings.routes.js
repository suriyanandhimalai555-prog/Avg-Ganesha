import express from 'express';
import { getBankDetails, updateBankDetails } from './settings.controller.js';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Public — anyone can read bank details for donations
router.get('/', getBankDetails);

// Only ADMIN can update settings
router.put('/', authenticateToken, authorizeRole('ADMIN'), updateBankDetails);

export default router;