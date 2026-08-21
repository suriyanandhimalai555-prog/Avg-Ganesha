import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  adminReviewKYC,
  updateUserDetails,
  getSignedImageUrl,
  getInviteTree,
  adminSubmitKYC,
} from './admin.controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// Multer for admin-side KYC upload (same kyc/ bucket prefix so toRelativeUploadPath resolves correctly)
const KYC_UPLOAD_DIR = path.join(__dirname, '../../../uploads/kyc');
const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(KYC_UPLOAD_DIR)) {
      fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });
    }
    cb(null, KYC_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `admin-kyc-${req.user.id}-${Date.now()}-${file.originalname}`);
  },
});
const kycFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WEBP images are allowed.'), false);
  }
};
const kycUpload = multer({
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: kycFileFilter,
});

// All admin routes require login + ADMIN role
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/invite-tree', getInviteTree);
router.post('/role', updateUserRole);
router.post('/kyc-review', adminReviewKYC);
router.post(
  '/kyc-submit',
  kycUpload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]),
  adminSubmitKYC
);
router.put('/users/:userId', updateUserDetails);
router.post('/signed-url', getSignedImageUrl);

export default router;
