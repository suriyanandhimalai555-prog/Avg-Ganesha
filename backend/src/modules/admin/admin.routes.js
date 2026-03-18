import express from 'express';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';
import { getAdminStats, getAllUsers, updateUserRole, adminReviewKYC, updateUserDetails, getSignedImageUrl } from './admin.controller.js';

const router = express.Router();

// All admin routes require login + ADMIN role
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/role', updateUserRole);
router.post('/kyc-review', adminReviewKYC);
router.put('/users/:userId', updateUserDetails);
router.post('/signed-url', getSignedImageUrl);

export default router;