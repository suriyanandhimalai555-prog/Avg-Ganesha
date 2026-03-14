import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { submitKYC, reviewKYC, getKycStatus } from './kyc.controller.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Configure Storage (Where to save files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/kyc';
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Save as: userid-timestamp-filename.jpg
    const uniqueName = `${req.user.id}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.get('/status', authenticateToken, getKycStatus);
// The Route: Expects 2 files named 'idFront' and 'idBack'
router.post('/submit', 
  authenticateToken, 
  upload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]), 
  submitKYC
);
router.post('/review', authenticateToken, reviewKYC);

export default router;