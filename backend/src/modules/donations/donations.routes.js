import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getCategories,
  submitDonation,
  getMyDonations,
  getMyDonationStats,
  getPendingDonations,
  reviewDonation,
} from './donations.controller.js';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// Donation payment proofs only: backend/uploads/donations/ (separate from KYC)
const DONATIONS_UPLOAD_DIR = path.join(__dirname, '../../../uploads/donations');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(DONATIONS_UPLOAD_DIR)) {
      fs.mkdirSync(DONATIONS_UPLOAD_DIR, { recursive: true });
    }
    cb(null, DONATIONS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user?.id || 'anon'}-${Date.now()}-${file.originalname || 'proof.jpg'}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WEBP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

router.get('/categories', getCategories);

router.post(
  '/submit',
  authenticateToken,
  upload.single('paymentProof'),
  submitDonation
);

router.get('/my', authenticateToken, getMyDonations);
router.get('/my-stats', authenticateToken, getMyDonationStats);

router.get('/admin/pending', authenticateToken, authorizeRole('ADMIN'), getPendingDonations);
router.post('/admin/review/:donationId', authenticateToken, authorizeRole('ADMIN'), reviewDonation);

export default router;
