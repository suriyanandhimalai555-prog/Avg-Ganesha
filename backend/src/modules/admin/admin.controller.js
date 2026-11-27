import { query, withTransaction } from '../../shared/db.js';
import { getCachedData, invalidateCache } from '../../shared/redis.js';
import { invalidateAuthUser } from '../../middleware/authMiddleware.js';
import { logAudit, devoteeLabel } from '../../shared/audit.js';

import {
  ADMIN_ADJUSTMENT_SOURCE,
  MAX_COIN_ADJUSTMENT,
  STATUE_15FT_LOCK_YEARS,
  summarizeCoins,
} from '../donations/coinRules.js';
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
             u.details->'kyc_docs' as kyc_docs,
             COALESCE(coins.total_coins, 0)   AS total_coins,
             COALESCE(dn.confirmed_count, 0)  AS confirmed_seva_count,
             COALESCE(dn.confirmed_amount, 0) AS confirmed_seva_amount,
             COALESCE(dn.pending_count, 0)    AS pending_seva_count
      FROM users u
      LEFT JOIN users inviter ON u.invited_by = inviter.id
      LEFT JOIN users kyc_rev ON u.kyc_reviewed_by = kyc_rev.id
      LEFT JOIN (
        SELECT user_id, SUM(amount) AS total_coins
        FROM user_avg_coins GROUP BY user_id
      ) coins ON coins.user_id = u.id
      LEFT JOIN (
        SELECT user_id,
               COUNT(*) FILTER (WHERE status = 'CONFIRMED')    AS confirmed_count,
               SUM(amount) FILTER (WHERE status = 'CONFIRMED') AS confirmed_amount,
               COUNT(*) FILTER (WHERE status = 'PENDING')      AS pending_count
        FROM donations GROUP BY user_id
      ) dn ON dn.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, offset];
    const result = await query(dataQuery, dataParams);

    const rows = result.rows.map((row) => {
      const r = {
        ...row,
        total_coins: parseFloat(row.total_coins) || 0,
        confirmed_seva_count: parseInt(row.confirmed_seva_count, 10) || 0,
        confirmed_seva_amount: parseFloat(row.confirmed_seva_amount) || 0,
        pending_seva_count: parseInt(row.pending_seva_count, 10) || 0,
      };
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
    const before = await query('SELECT id, full_name, email, role FROM users WHERE id = $1', [userId]);
    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);
    const u = before.rows[0];
    if (u && u.role !== role) {
      await logAudit(null, {
        req,
        action: 'ROLE_CHANGE',
        entityType: 'USER',
        entityId: u.id,
        targetUserId: u.id,
        summary: `Role of ${devoteeLabel(u, userId)} changed ${u.role} → ${role}`,
        details: { from: u.role, to: role },
      });
    }

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
    const before = await query('SELECT id, full_name, email, kyc_status FROM users WHERE id = $1', [userId]);
    await query(
      'UPDATE users SET kyc_status = $1, kyc_rejection_reason = $2, kyc_reviewed_by = $3, updated_at = NOW() WHERE id = $4',
      [status, status === 'REJECTED' ? rejectionReason || null : null, req.user.id, userId]
    );

    // Invalidate admin stats cache
    await invalidateCache(CACHE_KEYS.ADMIN_STATS);

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

    const beforeRes = await query('SELECT id, full_name, email, phone_number FROM users WHERE id = $1', [userId]);
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

    const prev = beforeRes.rows[0] || {};
    const next = updateRes.rows[0];
    const diff = {};
    if ((prev.email || null) !== (next.email || null)) diff.email = { from: prev.email || null, to: next.email };
    if ((prev.phone_number || null) !== (next.phone_number || null)) {
      diff.phone_number = { from: prev.phone_number || null, to: next.phone_number || null };
    }
    if (Object.keys(diff).length > 0) {
      await logAudit(null, {
        req,
        action: 'USER_EDIT',
        entityType: 'USER',
        entityId: next.id,
        targetUserId: next.id,
        summary: `Edited contact details of ${devoteeLabel(next, userId)} (${Object.keys(diff).join(', ')})`,
        details: diff,
      });
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
    const userCheck = await query('SELECT id, full_name, email, kyc_status FROM users WHERE id = $1', [userId]);
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

    const u = userCheck.rows[0];
    await logAudit(null, {
      req,
      action: 'KYC_SUBMIT_ON_BEHALF',
      entityType: 'USER',
      entityId: u.id,
      targetUserId: u.id,
      summary: `Uploaded KYC documents on behalf of ${devoteeLabel(u, userId)}`,
      details: { from: u.kyc_status, to: 'SUBMITTED' },
    });

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
    // Never log the password itself.
    await logAudit(null, {
      req,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: result.rows[0].id,
      targetUserId: result.rows[0].id,
      summary: `Reset password of ${devoteeLabel(result.rows[0], userId)}`,
    });

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

// ============================================================================
// Audit feed — shared by the Audit Log page and the devotee overview
// ============================================================================
// admin_audit_log UNION legacy donation_audit_log (seva date changes made before the
// console-wide log existed). A date change made after it exists is written to BOTH
// tables in one transaction (same NOW()), so the legacy copy is skipped via NOT EXISTS.
const AUDIT_FEED_CTE = `
  WITH feed AS (
    SELECT a.id::text AS id, a.created_at, a.actor_id, a.actor_name, a.actor_email, a.actor_role,
           a.action, a.entity_type, a.entity_id, a.target_user_id, a.summary, a.details
    FROM admin_audit_log a
    UNION ALL
    SELECT 'legacy-' || dal.id, dal.created_at, dal.changed_by, cu.full_name, cu.email, cu.role::text,
           'SEVA_DATE_CHANGE', 'DONATION', dal.donation_id, d.user_id,
           'Seva #' || dal.donation_id || ' — ' || COALESCE(dal.note, 'date changed'),
           jsonb_build_object('from', dal.old_value, 'to', dal.new_value,
                              'coinsFrom', dal.coin_old, 'coinsTo', dal.coin_new, 'legacy', true)
    FROM donation_audit_log dal
    LEFT JOIN donations d ON d.id = dal.donation_id
    LEFT JOIN users cu ON cu.id = dal.changed_by
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_log a2
      WHERE a2.action = 'SEVA_DATE_CHANGE'
        AND a2.entity_id = dal.donation_id
        AND a2.created_at = dal.created_at
    )
  )`;

const mapAuditRow = (r) => ({
  id: r.id,
  createdAt: r.created_at,
  actorId: r.actor_id,
  actorName: r.actor_name,
  actorEmail: r.actor_email,
  actorRole: r.actor_role,
  action: r.action,
  entityType: r.entity_type,
  entityId: r.entity_id,
  targetUserId: r.target_user_id,
  targetName: r.target_name,
  targetEmail: r.target_email,
  summary: r.summary,
  details: r.details,
});

const IST_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// --- 13. Audit log (ADMIN only) ---
// GET /api/admin/audit-log?page&limit&action&actorId&targetUserId&from&to&search
// from/to are IST calendar dates (inclusive).
export const getAuditLog = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 200);
  const offset = (page - 1) * limit;
  const { action, actorId, targetUserId, from, to, search } = req.query;

  const conds = [];
  const params = [];
  const add = (sql, v) => { params.push(v); conds.push(sql.replace('?', `$${params.length}`)); };

  if (action && action !== 'ALL') add('f.action = ?', String(action));
  if (actorId && /^\d+$/.test(actorId)) add('f.actor_id = ?::int', actorId);
  if (targetUserId && /^\d+$/.test(targetUserId)) add('f.target_user_id = ?::int', targetUserId);
  if (from && IST_DATE_RE.test(from)) add(`f.created_at >= (?::date::timestamp AT TIME ZONE 'Asia/Kolkata')`, from);
  if (to && IST_DATE_RE.test(to)) add(`f.created_at < ((?::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`, to);
  if (search) {
    add(`(f.summary ILIKE ? OR f.actor_name ILIKE $${params.length + 1} OR t.full_name ILIKE $${params.length + 1})`, `%${search}%`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  try {
    const [countRes, dataRes, actorsRes] = await Promise.all([
      query(`${AUDIT_FEED_CTE} SELECT COUNT(*) FROM feed f LEFT JOIN users t ON t.id = f.target_user_id ${where}`, params),
      query(
        `${AUDIT_FEED_CTE}
         SELECT f.*, t.full_name AS target_name, t.email AS target_email
         FROM feed f LEFT JOIN users t ON t.id = f.target_user_id
         ${where}
         ORDER BY f.created_at DESC, f.id DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT DISTINCT ON (actor_id) actor_id, actor_name, actor_role
         FROM admin_audit_log WHERE actor_id IS NOT NULL
         ORDER BY actor_id, created_at DESC`
      ),
    ]);
    const totalItems = parseInt(countRes.rows[0].count);
    res.json({
      data: dataRes.rows.map(mapAuditRow),
      actors: actorsRes.rows.map((a) => ({ id: a.actor_id, name: a.actor_name, role: a.actor_role })),
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
    res.status(500).json({ error: 'Server error fetching audit log' });
  }
};

// --- 14. Devotee overview: everything about one devotee (ADMIN + STAFF) ---
// GET /api/admin/users/:userId/overview
export const getUserOverview = async (req, res) => {
  const { userId } = req.params;
  if (!/^\d+$/.test(String(userId))) return res.status(400).json({ error: 'Invalid user id' });

  try {
    const userRes = await query(
      `SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.invite_code, u.invite_count,
              u.kyc_status, u.kyc_rejection_reason, u.created_at, u.updated_at,
              u.details->'kyc_docs' AS kyc_docs,
              inviter.id AS invited_by_id, inviter.full_name AS invited_by_name,
              kyc_rev.full_name AS kyc_reviewed_by_name,
              (SELECT COUNT(*) FROM users x WHERE x.invited_by = u.id) AS invitees_count
       FROM users u
       LEFT JOIN users inviter ON inviter.id = u.invited_by
       LEFT JOIN users kyc_rev ON kyc_rev.id = u.kyc_reviewed_by
       WHERE u.id = $1::int`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Devotee not found' });

    let docs = user.kyc_docs;
    if (typeof docs === 'string') {
      try { docs = JSON.parse(docs); } catch { docs = null; }
    }
    user.kyc_docs = docs && typeof docs === 'object'
      ? { front: toRelativeUploadPath(docs.front) || null, back: toRelativeUploadPath(docs.back) || null }
      : null;
    user.invitees_count = parseInt(user.invitees_count, 10) || 0;

    const [sevaRes, coinRes, activityRes] = await Promise.all([
      query(
        `SELECT d.id, d.amount, d.status, d.statue_number, d.created_at, d.updated_at,
                d.rejection_reason, d.payment_proof_path,
                dc.name AS category_name, dc.slug AS category_slug,
                rec.full_name AS recorded_by_name, rev.full_name AS reviewed_by_name,
                c.amount AS coins
         FROM donations d
         LEFT JOIN donation_categories dc ON dc.id = d.category_id
         LEFT JOIN users rec ON rec.id = d.recorded_by
         LEFT JOIN users rev ON rev.id = d.reviewed_by
         LEFT JOIN user_avg_coins c ON c.donation_id = d.id
         WHERE d.user_id = $1::int
         ORDER BY d.created_at DESC`,
        [userId]
      ),
      query(
        `SELECT c.id, c.donation_id, c.amount, c.source, c.earned_at, c.locked_until,
                c.is_withdrawable, c.created_at, c.note, g.full_name AS granted_by_name
         FROM user_avg_coins c
         LEFT JOIN users g ON g.id = c.granted_by
         WHERE c.user_id = $1::int
         ORDER BY c.earned_at DESC, c.id DESC`,
        [userId]
      ),
      // Audit trail is ADMIN-only (enforced here, not just hidden in the UI).
      req.user?.role === 'ADMIN'
        ? query(
            `${AUDIT_FEED_CTE}
             SELECT f.*, t.full_name AS target_name, t.email AS target_email
             FROM feed f LEFT JOIN users t ON t.id = f.target_user_id
             WHERE f.target_user_id = $1::int
             ORDER BY f.created_at DESC, f.id DESC
             LIMIT 50`,
            [userId]
          )
        : Promise.resolve({ rows: [] }),
    ]);

    const sevas = sevaRes.rows.map((d) => ({
      ...d,
      amount: parseFloat(d.amount),
      coins: d.coins != null ? parseFloat(d.coins) : null,
    }));
    const confirmed = sevas.filter((d) => d.status === 'CONFIRMED');
    const sevaSummary = {
      total: sevas.length,
      confirmedCount: confirmed.length,
      pendingCount: sevas.filter((d) => d.status === 'PENDING').length,
      rejectedCount: sevas.filter((d) => d.status === 'REJECTED').length,
      confirmedAmount: confirmed.reduce((s, d) => s + d.amount, 0),
      pendingAmount: sevas.filter((d) => d.status === 'PENDING').reduce((s, d) => s + d.amount, 0),
      statueNumbers: [...new Set(sevas.map((d) => d.statue_number).filter((n) => n != null))].sort((a, b) => a - b),
      lastSevaAt: sevas[0]?.created_at || null,
    };

    const coinEntries = coinRes.rows.map((r) => ({
      id: r.id,
      donationId: r.donation_id,
      amount: parseFloat(r.amount),
      source: r.source,
      earnedAt: r.earned_at,
      lockedUntil: r.locked_until,
      isWithdrawable: r.is_withdrawable,
      createdAt: r.created_at,
      note: r.note,
      grantedByName: r.granted_by_name,
    }));

    res.json({
      user,
      sevaSummary,
      sevas,
      coins: { ...summarizeCoins(coinEntries), entries: coinEntries },
      activity: activityRes.rows.map(mapAuditRow),
    });
  } catch (err) {
    console.error('User Overview Error:', err);
    res.status(500).json({ error: 'Server error fetching devotee overview' });
  }
};

// --- 15. Manual AVG-coin adjustment (ADMIN only — guarded in routes) ---
// POST /api/admin/users/:userId/coins   body: { amount, reason }
// amount: non-zero integer (negative = deduction). Locked 5 years like statue coins.
// The balance may never go below 0. Ledger row + audit row commit together.
export const adjustUserCoins = async (req, res) => {
  const { userId } = req.params;
  const amount = Number(req.body?.amount);
  const reason = String(req.body?.reason ?? '').trim();

  if (!/^\d+$/.test(String(userId))) return res.status(400).json({ error: 'Invalid user id' });
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_COIN_ADJUSTMENT) {
    return res.status(400).json({
      error: `Amount must be a non-zero whole number between -${MAX_COIN_ADJUSTMENT} and ${MAX_COIN_ADJUSTMENT}`,
    });
  }
  if (reason.length < 3) return res.status(400).json({ error: 'A reason is required' });
  if (reason.length > 500) return res.status(400).json({ error: 'Reason must be at most 500 characters' });

  try {
    const result = await withTransaction(async (client) => {
      // Row lock on the devotee serialises concurrent adjustments / statue awards.
      const uRes = await client.query(
        'SELECT id, full_name, email FROM users WHERE id = $1::int FOR UPDATE',
        [userId]
      );
      const u = uRes.rows[0];
      if (!u) {
        const err = new Error('Devotee not found');
        err.status = 404;
        throw err;
      }

      const balRes = await client.query(
        'SELECT COALESCE(SUM(amount), 0) AS total FROM user_avg_coins WHERE user_id = $1::int',
        [userId]
      );
      const before = parseFloat(balRes.rows[0].total);
      const after = before + amount;
      if (after < 0) {
        const err = new Error(`Cannot deduct ${-amount} coins — the devotee only has ${before}.`);
        err.status = 400;
        throw err;
      }

      const ins = await client.query(
        `INSERT INTO user_avg_coins
           (user_id, donation_id, amount, source, earned_at, locked_until, is_withdrawable, granted_by, note)
         VALUES ($1::int, NULL, $2::numeric, $3::varchar, NOW(),
                 NOW() + ($4::text || ' years')::interval, FALSE, $5::int, $6::text)
         RETURNING id, amount, earned_at, locked_until`,
        [userId, amount, ADMIN_ADJUSTMENT_SOURCE, STATUE_15FT_LOCK_YEARS, req.user.id, reason]
      );

      await logAudit(client, {
        req,
        action: 'COIN_ADJUST',
        entityType: 'USER',
        entityId: u.id,
        targetUserId: u.id,
        summary:
          `${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} AVG coins ` +
          `${amount > 0 ? 'to' : 'from'} ${devoteeLabel(u, userId)} (${before} → ${after}) — ${reason}`,
        details: { amount, balanceBefore: before, balanceAfter: after, reason, coinRowId: ins.rows[0].id },
      });

      return { entry: ins.rows[0], balanceBefore: before, balanceAfter: after, name: u.full_name };
    });

    await invalidateCache(CACHE_KEYS.ADMIN_STATS);

    res.status(201).json({
      message: `${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} AVG coins. New balance: ${result.balanceAfter}.`,
      ...result,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Adjust Coins Error:', err);
    res.status(500).json({ error: 'Server error adjusting coins' });
  }
};
