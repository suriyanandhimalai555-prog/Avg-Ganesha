import { query } from '../../shared/db.js';
import { uploadToS3 } from '../../shared/s3.js';
import { invalidateCache } from '../../shared/redis.js';
import { logAudit, devoteeLabel } from '../../shared/audit.js';

// --- 1. SUBMIT KYC ---
export const submitKYC = async (req, res) => {
  const userId = req.user.id;
  
  if (!req.files || !req.files.idFront || !req.files.idBack) {
    return res.status(400).json({ error: 'Both ID Front and Back are required' });
  }

  try {
    // An approved devotee must not be able to knock themselves back to SUBMITTED.
    const cur = await query('SELECT kyc_status FROM users WHERE id = $1', [userId]);
    if (cur.rows[0]?.kyc_status === 'APPROVED') {
      return res.status(400).json({ error: 'KYC is already approved' });
    }

    // Upload both files to S3
    const [frontUrl, backUrl] = await Promise.all([
      uploadToS3(req.files.idFront[0].path, 'kyc'),
      uploadToS3(req.files.idBack[0].path, 'kyc'),
    ]);

    await query(
      `UPDATE users 
       SET kyc_status = 'SUBMITTED',
           kyc_rejection_reason = NULL,
           details = jsonb_set(COALESCE(details, '{}'), '{kyc_docs}', $1),
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify({ front: frontUrl, back: backUrl }), userId]
    );

    await invalidateCache('admin:stats');

    res.json({ message: 'KYC Submitted Successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving KYC' });
  }
};

// --- 2. GET STATUS ---
export const getKycStatus = async (req, res) => {
  try {
    const result = await query(
      'SELECT kyc_status, kyc_rejection_reason FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const status = result.rows[0].kyc_status || 'PENDING';
    const rejectionReason = result.rows[0].kyc_rejection_reason;
    res.json({ status, rejectionReason: status === 'REJECTED' ? rejectionReason : null });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching status' });
  }
};

// --- 3. REVIEW KYC ---
// Legacy endpoint (POST /api/kyc/review). The console uses /api/admin/kyc-review;
// this mirrors it so either path records the reviewer and reason consistently.
export const reviewKYC = async (req, res) => {
  const { userId, status, rejectionReason } = req.body;
  
  try {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const before = await query('SELECT id, full_name, email, kyc_status FROM users WHERE id = $1', [userId]);
    await query(
      'UPDATE users SET kyc_status = $1, kyc_rejection_reason = $2, kyc_reviewed_by = $3, updated_at = NOW() WHERE id = $4',
      [status, status === 'REJECTED' ? rejectionReason || null : null, req.user.id, userId]
    );
    await invalidateCache('admin:stats');

    const u = before.rows[0];
    if (u) {
      await logAudit(null, {
        req,
        action: 'KYC_REVIEW',
        entityType: 'USER',
        entityId: u.id,
        targetUserId: u.id,
        summary:
          `KYC ${status.toLowerCase()} for ${devoteeLabel(u, userId)}` +
          (status === 'REJECTED' && rejectionReason ? ` — reason: ${rejectionReason}` : ''),
        details: { from: u.kyc_status, to: status, rejectionReason: status === 'REJECTED' ? rejectionReason || null : null },
      });
    }

    res.json({ message: `User KYC has been ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating KYC' });
  }
};