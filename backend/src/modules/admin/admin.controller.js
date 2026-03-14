import { query } from '../../shared/db.js';

// --- 1. Get System-Wide Stats ---
export const getAdminStats = async (req, res) => {
  try {
    const totalRes = await query('SELECT COUNT(*) FROM users');
    const submittedRes = await query("SELECT COUNT(*) FROM users WHERE kyc_status = 'SUBMITTED'");
    const approvedRes = await query("SELECT COUNT(*) FROM users WHERE kyc_status = 'APPROVED'");
    const invitedRes = await query('SELECT COUNT(*) FROM users WHERE invited_by IS NOT NULL');

    res.json({
      totalUsers: parseInt(totalRes.rows[0].count),
      submittedKYC: parseInt(submittedRes.rows[0].count),
      approvedKYC: parseInt(approvedRes.rows[0].count),
      totalInvited: parseInt(invitedRes.rows[0].count),
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
      SELECT u.id, u.full_name, u.email, u.role, u.invite_code, u.invite_count, u.kyc_status, u.created_at,
             (SELECT full_name FROM users WHERE id = u.invited_by) as invited_by_name
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, offset];
    const result = await query(dataQuery, dataParams);

    res.json({
      data: result.rows,
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
  const { userId, status } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
  }

  try {
    await query('UPDATE users SET kyc_status = $1, updated_at = NOW() WHERE id = $2', [status, userId]);
    res.json({ message: `User KYC has been ${status}` });
  } catch (err) {
    console.error('KYC Review Error:', err);
    res.status(500).json({ error: 'Server error updating KYC' });
  }
};