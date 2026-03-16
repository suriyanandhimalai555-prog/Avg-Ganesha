import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { submitKYC, reviewKYC, getKycStatus } from './kyc.controller.js';
import { authenticateToken, authorizeRole } from '../../middleware/authMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// KYC only: backend/uploads/kyc/ (separate from donation proofs)
const KYC_UPLOAD_DIR = path.join(__dirname, '../../../uploads/kyc');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(KYC_UPLOAD_DIR)) {
      fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });
    }
    cb(null, KYC_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
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

router.get('/status', authenticateToken, getKycStatus);
// The Route: Expects 2 files named 'idFront' and 'idBack'
router.post('/submit', 
  authenticateToken, 
  upload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]), 
  submitKYC
);
router.post('/review', authenticateToken, authorizeRole('ADMIN'), reviewKYC);

export default router;