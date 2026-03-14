import { query } from '../../shared/db.js';

// --- 1. SUBMIT KYC ---
export const submitKYC = async (req, res) => {
  const userId = req.user.id;
  
  if (!req.files || !req.files.idFront || !req.files.idBack) {
    return res.status(400).json({ error: 'Both ID Front and Back are required' });
  }

  const idFrontPath = req.files.idFront[0].path;
  const idBackPath = req.files.idBack[0].path;

  try {
    await query(
      `UPDATE users 
       SET kyc_status = 'SUBMITTED', 
           details = jsonb_set(COALESCE(details, '{}'), '{kyc_docs}', $1)
       WHERE id = $2`,
      [JSON.stringify({ front: idFrontPath, back: idBackPath }), userId]
    );

    res.json({ message: 'KYC Submitted Successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving KYC' });
  }
};

// --- 2. GET STATUS (NEW!) ---
export const getKycStatus = async (req, res) => {
  try {
    const result = await query('SELECT kyc_status FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Return the status directly (or 'PENDING' if null)
    const status = result.rows[0].kyc_status || 'PENDING';
    res.json({ status });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching status' });
  }
};

// --- 3. REVIEW KYC ---
export const reviewKYC = async (req, res) => {
  const { userId, status } = req.body; 
  
  try {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await query('UPDATE users SET kyc_status = $1 WHERE id = $2', [status, userId]);

    res.json({ message: `User KYC has been ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating KYC' });
  }
};