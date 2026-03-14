import { query } from '../../shared/db.js';

// --- 1. Get My Invite Stats ---
export const getMyInviteStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT invite_code, invite_count FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user_id: userId,
      invite_code: user.invite_code,
      invite_count: user.invite_count || 0,
    });

  } catch (err) {
    console.error('Invite Stats Error:', err);
    res.status(500).json({ error: 'Server error fetching invite stats' });
  }
};

// --- 2. Get People I Invited ---
export const getMyInvitees = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT id, full_name, email, created_at, kyc_status
       FROM users
       WHERE invited_by = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      count: result.rows.length,
      invitees: result.rows
    });
  } catch (err) {
    console.error('Invitees Error:', err);
    res.status(500).json({ error: 'Server error fetching invitees' });
  }
};
