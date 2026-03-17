import { query } from '../../shared/db.js';

function toRelativeUploadPath(fullPath) {
  if (!fullPath || typeof fullPath !== 'string') return null;
  // Cloudinary URLs — return as-is
  if (fullPath.startsWith('http://') || fullPath.startsWith('https://')) return fullPath;
  const normalized = fullPath.replace(/\\/g, '/');
  const afterUploads = normalized.match(/uploads\/(.+)$/i);
  if (afterUploads) return afterUploads[1];
  if (normalized.startsWith('kyc/') || normalized.startsWith('donations/')) return normalized;
  const filename = normalized.split('/').pop();
  if (filename && (normalized.includes('kyc') || normalized.includes('donations'))) {
    return normalized.includes('kyc') ? `kyc/${filename}` : `donations/${filename}`;
  }
  return normalized;
}

// --- 1. Get System-Wide Stats ---
export const getAdminStats = async (req, res) => {
  try {
    const [totalRes, submittedRes, approvedRes, invitedRes, pendingDonationsRes] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query("SELECT COUNT(*) FROM users WHERE kyc_status = 'SUBMITTED'"),
      query("SELECT COUNT(*) FROM users WHERE kyc_status = 'APPROVED'"),
      query('SELECT COUNT(*) FROM users WHERE invited_by IS NOT NULL'),
      query("SELECT COUNT(*) FROM donations WHERE status = 'PENDING'")
    ]);

    res.json({
      totalUsers: parseInt(totalRes.rows[0].count),
      submittedKYC: parseInt(submittedRes.rows[0].count),
      approvedKYC: parseInt(approvedRes.rows[0].count),
      totalInvited: parseInt(invitedRes.rows[0].count),
      pendingDonations: parseInt(pendingDonationsRes.rows[0].count),
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// --- 2. Get All Users (Paginated + Search + Filter) ---
export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const kycStatus = req.query.kycStatus || '';
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (kycStatus && kycStatus !== 'ALL') {
      whereClause += ` AND u.kyc_status = $${paramIndex}`;
      params.push(kycStatus);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.invite_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.invite_code, u.invite_count, u.kyc_status, u.created_at,
             inviter.full_name as invited_by_name,
             u.details->'kyc_docs' as kyc_docs
      FROM users u
      LEFT JOIN users inviter ON u.invited_by = inviter.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, offset];
    const result = await query(dataQuery, dataParams);

    const rows = result.rows.map((row) => {
      const r = { ...row };
      let docs = r.kyc_docs;
      if (typeof docs === 'string') {
        try {
          docs = JSON.parse(docs);
        } catch {
          docs = null;
        }
      }
      if (docs && typeof docs === 'object') {
        r.kyc_docs = {
          front: toRelativeUploadPath(docs.front) || null,
          back: toRelativeUploadPath(docs.back) || null,
        };
      } else {
        r.kyc_docs = null;
      }
      return r;
    });

    res.json({
      data: rows,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });

  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- 3. Change User Role ---
export const updateUserRole = async (req, res) => {
  const { userId, role } = req.body;

  // Only allow valid roles: USER, ADMIN
  if (!['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be USER or ADMIN.' });
  }

  try {
    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Update Role Error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};

// --- 4. Review KYC (Admin approves/rejects) ---
export const adminReviewKYC = async (req, res) => {
  const { userId, status, rejectionReason } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
  }

  try {
    await query(
      'UPDATE users SET kyc_status = $1, kyc_rejection_reason = $2, updated_at = NOW() WHERE id = $3',
      [status, status === 'REJECTED' ? rejectionReason || null : null, userId]
    );
    res.json({ message: `User KYC has been ${status}` });
  } catch (err) {
    console.error('KYC Review Error:', err);
    res.status(500).json({ error: 'Server error updating KYC' });
  }
};

// --- 5. Edit User Details ---
export const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const { email, phone_number } = req.body;

  try {
    // Basic validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if another user has this email
    const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use by another user' });
    }

    if (phone_number) {
      const phoneCheck = await query('SELECT id FROM users WHERE phone_number = $1 AND id != $2', [phone_number, userId]);
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number is already in use by another user' });
      }
    }

    const updateRes = await query(
      `UPDATE users 
       SET email = $1, phone_number = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, full_name, email, phone_number`,
      [email, phone_number || null, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User details updated successfully',
      user: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Update User Details Error:', err);
    res.status(500).json({ error: 'Server error updating user details' });
  }
};