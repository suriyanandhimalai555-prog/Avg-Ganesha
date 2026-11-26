import { query } from '../../shared/db.js';
import { getCachedData, invalidateCache } from '../../shared/redis.js';
import { invalidateAuthUser } from '../../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import { authConfig } from '../../config/index.js';

const CACHE_KEYS = {
  ADMIN_STATS: 'admin:stats'
};
import { getS3SignedUrl, uploadToS3 } from '../../shared/s3.js';

function toRelativeUploadPath(fullPath) {
  if (!fullPath || typeof fullPath !== 'string') return null;
  // S3 URIs and legacy Cloudinary/HTTPS URLs — return as-is (will be signed later)
  if (fullPath.startsWith('http://') || fullPath.startsWith('https://') || fullPath.startsWith('s3://')) return fullPath;
  const normalized = fullPath.replace(/\\/g, '/');
  const afterUploads = normalized.match(/uploads\/(.+)$/i);
  if (afterUploads) return afterUploads[1];
  if (normalized.startsWith('kyc/') || normalized.startsWith('donations/') || normalized.startsWith('proofs/')) return normalized;
  const filename = normalized.split('/').pop();
  if (filename && (normalized.includes('kyc') || normalized.includes('donations') || normalized.includes('proofs'))) {
    if (normalized.includes('kyc')) return `kyc/${filename}`;
    return `proofs/${filename}`;
  }
  return normalized;
}

// --- 1. Get System-Wide Stats ---
export const getAdminStats = async (req, res) => {
  try {
    const stats = await getCachedData(CACHE_KEYS.ADMIN_STATS, async () => {
      const [totalRes, submittedRes, approvedRes, invitedRes, pendingDonationsRes] = await Promise.all([
        query('SELECT COUNT(*) FROM users'),
        query("SELECT COUNT(*) FROM users WHERE kyc_status = 'SUBMITTED'"),
        query("SELECT COUNT(*) FROM users WHERE kyc_status = 'APPROVED'"),
        query('SELECT COUNT(*) FROM users WHERE invited_by IS NOT NULL'),
        query("SELECT COUNT(*) FROM donations WHERE status = 'PENDING'")
      ]);

      return {
        totalUsers: parseInt(totalRes.rows[0].count),
        submittedKYC: parseInt(submittedRes.rows[0].count),
        approvedKYC: parseInt(approvedRes.rows[0].count),
        totalInvited: parseInt(invitedRes.rows[0].count),
        pendingDonations: parseInt(pendingDonationsRes.rows[0].count),
      };
    }, 60); // 1 minute cache

    res.json(stats);
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
  const role = (req.query.role || '').toUpperCase();
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
    if (['USER', 'STAFF', 'ADMIN'].includes(role)) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
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
      SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.invite_code, u.invite_count, u.kyc_status, u.kyc_rejection_reason, u.created_at,
             inviter.full_name as invited_by_name,
             kyc_rev.full_name as kyc_reviewed_by_name,
             u.details->'kyc_docs' as kyc_docs
      FROM users u
      LEFT JOIN users inviter ON u.invited_by = inviter.id
      LEFT JOIN users kyc_rev ON u.kyc_reviewed_by = kyc_rev.id
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

  // Only allow valid roles: USER, ADMIN, STAFF (STAFF = console operator, see authorizeRole)
  if (!['USER', 'ADMIN', 'STAFF'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be USER, ADMIN or STAFF.' });
  }

  try {
    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);

    // Invalidate caches: admin stats + this user's cached auth profile
    await Promise.all([
      invalidateCache(CACHE_KEYS.ADMIN_STATS),
      invalidateAuthUser(userId),
    ]);

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
      'UPDATE users SET kyc_status = $1, kyc_rejection_reason = $2, kyc_reviewed_by = $3, updated_at = NOW() WHERE id = $4',
      [status, status === 'REJECTED' ? rejectionReason || null : null, req.user.id, userId]
    );

    // Invalidate admin stats cache
    await invalidateCache(CACHE_KEYS.ADMIN_STATS);

    res.json({ message: `User KYC has been ${status}` });
  } catch (err) {
    console.error('KYC Review Error:', err);
    res.status(500).json({ error: 'Server error updating KYC' });
  }
};

// --- 5. Edit User Details ---
export const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  // Login looks emails up lower-cased (auth.service), so store them that way or the
  // devotee can no longer sign in after an admin edit.
  const email = (req.body.email || '').trim().toLowerCase();
  const phone_number = (req.body.phone_number || '').trim();

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

    // Email is part of the cached auth profile — invalidate so next request reloads it
    await invalidateAuthUser(userId);

    res.json({
      message: 'User details updated successfully',
      user: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Update User Details Error:', err);
    res.status(500).json({ error: 'Server error updating user details' });
  }
};

// --- 7. Invite Tree: flat list of every user + their inviter link ---
// Returns the raw adjacency list (each user carries `invited_by`); the client
// assembles the forest. `invited_by` is a self-FK with ON DELETE SET NULL, so a
// NULL value means a root (organic signup) — no dangling parents to worry about.
//
// NOTE: this fetches ALL users in one query. Fine at current scale. If the
// devotee base grows into the thousands, switch to lazy per-node expansion
// (e.g. GET /invite-tree?parentId=<id> returning only direct invitees) so the
// admin isn't shipping the whole user table on every page load.
export const getInviteTree = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, invite_code, invite_count, invited_by, created_at
       FROM users
       ORDER BY created_at ASC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Invite Tree Error:', err);
    res.status(500).json({ error: 'Failed to fetch invite tree' });
  }
};

// --- 8. Admin submit KYC on behalf of a devotee ---
export const adminSubmitKYC = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!req.files || !req.files.idFront || !req.files.idBack) {
    return res.status(400).json({ error: 'Both ID front and back are required' });
  }

  try {
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

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

    await invalidateCache(CACHE_KEYS.ADMIN_STATS);

    res.json({ message: 'KYC documents uploaded. Status set to SUBMITTED.' });
  } catch (err) {
    console.error('Admin KYC Submit Error:', err);
    res.status(500).json({ error: 'Server error submitting KYC' });
  }
};

// --- 9. Coin Holdings: users with AVG coins > 0 (read-only, paginated + search) ---
// Query params:
//   page  (default 1), limit (default 20), search (name or phone), all=true (no pagination, for CSV export)
export const getCoinHolders = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const exportAll = req.query.all === 'true';
  const kycFilter = req.query.kyc || 'all'; // 'all' | 'APPROVED' | 'NOT_APPROVED'
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.phone_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (kycFilter === 'APPROVED') {
      whereClause += ` AND u.kyc_status = $${paramIndex}`;
      params.push('APPROVED');
      paramIndex++;
    } else if (kycFilter === 'NOT_APPROVED') {
      whereClause += ` AND u.kyc_status != $${paramIndex}`;
      params.push('APPROVED');
      paramIndex++;
    }

    // COUNT: wrap the grouped-by-user subquery so HAVING is applied before counting
    const countQuery = `
      SELECT COUNT(*) FROM (
        SELECT u.id
        FROM users u
        JOIN user_avg_coins c ON c.user_id = u.id
        ${whereClause}
        GROUP BY u.id
        HAVING SUM(c.amount) > 0
      ) t
    `;
    const countResult = await query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Data query — INNER JOIN restricts to holders only; HAVING drops zero/negative sums
    let dataQuery = `
      SELECT u.id, u.full_name, u.phone_number, u.kyc_status,
             COALESCE(SUM(c.amount), 0) AS total_coins
      FROM users u
      JOIN user_avg_coins c ON c.user_id = u.id
      ${whereClause}
      GROUP BY u.id, u.full_name, u.phone_number, u.kyc_status
      HAVING SUM(c.amount) > 0
      ORDER BY SUM(c.amount) DESC, u.full_name ASC
    `;

    let dataParams = [...params];
    if (!exportAll) {
      dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      dataParams = [...params, limit, offset];
    }

    const result = await query(dataQuery, dataParams);

    // node-pg returns NUMERIC as string — normalise to number
    const rows = result.rows.map((r) => ({
      ...r,
      total_coins: parseFloat(r.total_coins),
    }));

    const effectiveLimit = exportAll ? totalItems || 1 : limit;
    res.json({
      data: rows,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / effectiveLimit) || 1,
        currentPage: exportAll ? 1 : page,
        itemsPerPage: effectiveLimit,
      },
    });
  } catch (err) {
    console.error('Coin Holders Error:', err);
    res.status(500).json({ error: 'Server error fetching coin holders' });
  }
};

// --- 10. Generate a pre-signed URL for a private S3 object ---
export const getSignedImageUrl = async (req, res) => {
  const { s3Uri } = req.body;
  if (!s3Uri) {
    return res.status(400).json({ error: 'Missing s3Uri' });
  }
  try {
    const signedUrl = await getS3SignedUrl(s3Uri, 3600); // valid 1 hour
    res.json({ url: signedUrl });
  } catch (err) {
    console.error('Sign URL Error:', err);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
};

// --- 11. Admin resets a devotee's password (ADMIN-only — guarded in routes) ---
// Sets a new bcrypt hash. Existing JWTs stay valid until they expire (tokens are
// stateless); the user simply logs in with the new password from now on.
export const resetUserPassword = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body || {};

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (newPassword.length > 72) {
    // bcrypt silently truncates beyond 72 bytes — reject instead of surprising the user
    return res.status(400).json({ error: 'Password must be at most 72 characters' });
  }

  try {
    const salt = await bcrypt.genSalt(authConfig.bcryptRounds);
    const hash = await bcrypt.hash(newPassword, salt);

    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email',
      [hash, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await invalidateAuthUser(userId);
    console.info(`Password reset for user ${userId} by admin ${req.user.id}`);

    res.json({ message: `Password reset for ${result.rows[0].full_name || result.rows[0].email}` });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

// --- 12. Export devotees (all rows matching the current filter/search, every field incl. KYC) ---
// KYC document links are pre-signed S3 URLs valid for 7 days (S3 maximum) so the
// spreadsheet stays usable; after that, re-export.
const EXPORT_DOC_URL_TTL = 7 * 24 * 60 * 60;

export const exportUsers = async (req, res) => {
  const search = req.query.search || '';
  const kycStatus = req.query.kycStatus || '';
  const role = (req.query.role || '').toUpperCase();

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (kycStatus && kycStatus !== 'ALL') {
      whereClause += ` AND u.kyc_status = $${paramIndex}`;
      params.push(kycStatus);
      paramIndex++;
    }
    if (['USER', 'STAFF', 'ADMIN'].includes(role)) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.invite_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.role,
              u.invite_code, u.invite_count, u.created_at, u.updated_at,
              u.kyc_status, u.kyc_rejection_reason,
              inviter.full_name   AS invited_by_name,
              inviter.invite_code AS invited_by_code,
              kyc_rev.full_name   AS kyc_reviewed_by_name,
              u.details->'kyc_docs' AS kyc_docs,
              COALESCE(coins.total_coins, 0)   AS total_coins,
              COALESCE(dn.confirmed_count, 0)  AS confirmed_seva_count,
              COALESCE(dn.confirmed_amount, 0) AS confirmed_seva_amount,
              COALESCE(dn.pending_count, 0)    AS pending_seva_count,
              dn.statue_numbers
       FROM users u
       LEFT JOIN users inviter ON u.invited_by = inviter.id
       LEFT JOIN users kyc_rev ON u.kyc_reviewed_by = kyc_rev.id
       LEFT JOIN (
         SELECT user_id, SUM(amount) AS total_coins
         FROM user_avg_coins GROUP BY user_id
       ) coins ON coins.user_id = u.id
       LEFT JOIN (
         SELECT user_id,
                COUNT(*) FILTER (WHERE status = 'CONFIRMED')                AS confirmed_count,
                SUM(amount) FILTER (WHERE status = 'CONFIRMED')             AS confirmed_amount,
                COUNT(*) FILTER (WHERE status = 'PENDING')                  AS pending_count,
                STRING_AGG(DISTINCT statue_number::text, ' ')
                  FILTER (WHERE statue_number IS NOT NULL)                  AS statue_numbers
         FROM donations GROUP BY user_id
       ) dn ON dn.user_id = u.id
       ${whereClause}
       ORDER BY u.created_at DESC`,
      params
    );

    const signDoc = async (raw) => {
      if (!raw || typeof raw !== 'string') return '';
      try {
        return await getS3SignedUrl(raw, EXPORT_DOC_URL_TTL);
      } catch {
        return raw;
      }
    };

    const rows = await Promise.all(
      result.rows.map(async (row) => {
        let docs = row.kyc_docs;
        if (typeof docs === 'string') {
          try { docs = JSON.parse(docs); } catch { docs = null; }
        }
        const [front, back] = await Promise.all([signDoc(docs?.front), signDoc(docs?.back)]);
        const { kyc_docs: _omit, ...rest } = row;
        return {
          ...rest,
          total_coins: parseFloat(row.total_coins) || 0,
          confirmed_seva_count: parseInt(row.confirmed_seva_count, 10) || 0,
          confirmed_seva_amount: parseFloat(row.confirmed_seva_amount) || 0,
          pending_seva_count: parseInt(row.pending_seva_count, 10) || 0,
          kyc_doc_front_url: front,
          kyc_doc_back_url: back,
        };
      })
    );

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('Export Users Error:', err);
    res.status(500).json({ error: 'Server error exporting devotees' });
  }
};
