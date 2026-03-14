/**
 * Donations controller - submit, list, admin approve/reject.
 */
import { query } from '../../shared/db.js';

// --- Get all categories (public) ---
export const getCategories = async (req, res) => {
  try {
    const catResult = await query(
      `SELECT c.id, c.slug, c.name, c.has_fixed_price, c.display_order
       FROM donation_categories c
       WHERE c.is_active = true
       ORDER BY c.display_order ASC`
    );

    const priceResult = await query(
      `SELECT key, value FROM system_settings WHERE key IN ('statue_1_5_ft_price', 'statue_250_ft_price')`
    );
    const prices = Object.fromEntries(priceResult.rows.map((r) => [r.key.replace('_price', ''), parseFloat(r.value) || null]));

    const categories = catResult.rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      hasFixedPrice: c.has_fixed_price,
      fixedPrice: c.has_fixed_price && prices[c.slug] ? prices[c.slug] : null,
      displayOrder: c.display_order,
    }));

    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// --- Submit donation (requires auth + KYC approved) ---
export const submitDonation = async (req, res) => {
  const userId = req.user.id;
  const { categoryId, amount } = req.body;

  if (!categoryId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Category and valid amount are required' });
  }

  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Payment proof screenshot is required' });
  }

  try {
    const userRow = await query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [userId]
    );
    if (userRow.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userRow.rows[0].kyc_status !== 'APPROVED') {
      return res.status(403).json({
        error: 'KYC must be approved before donating',
        kycStatus: userRow.rows[0].kyc_status,
      });
    }

    const amountNum = parseFloat(amount);
    const proofPath = `donations/${req.file.filename}`;
    await query(
      `INSERT INTO donations (user_id, category_id, amount, payment_proof_path, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [userId, categoryId, amountNum, proofPath]
    );

    res.status(201).json({ message: 'Donation submitted. Pending admin approval.' });
  } catch (err) {
    console.error('Submit donation error:', err);
    res.status(500).json({ error: 'Failed to submit donation' });
  }
};

// --- User's own donations ---
export const getMyDonations = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT d.id, d.amount, d.status, d.created_at, d.rejection_reason,
              dc.slug as category_slug, dc.name as category_name
       FROM donations d
       LEFT JOIN donation_categories dc ON d.category_id = dc.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('My donations error:', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

// --- User donation stats (total, breakdown, 1.5ft count) ---
export const getMyDonationStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const totalResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM donations WHERE user_id = $1 AND status = 'CONFIRMED'`,
      [userId]
    );
    const breakdownResult = await query(
      `SELECT dc.name as category_name, dc.slug, SUM(d.amount) as total
       FROM donations d
       LEFT JOIN donation_categories dc ON d.category_id = dc.id
       WHERE d.user_id = $1 AND d.status = 'CONFIRMED'
       GROUP BY dc.id, dc.name, dc.slug
       ORDER BY total DESC`,
      [userId]
    );
    const statue15Count = await query(
      `SELECT COUNT(*) as count FROM donations
       WHERE user_id = $1 AND status = 'CONFIRMED'
       AND category_id = (SELECT id FROM donation_categories WHERE slug = 'statue_1_5_ft' LIMIT 1)`,
      [userId]
    );
    const globalStatue15Count = await query(
      `SELECT COUNT(*) as count FROM donations
       WHERE status = 'CONFIRMED'
       AND category_id = (SELECT id FROM donation_categories WHERE slug = 'statue_1_5_ft' LIMIT 1)`
    );

    res.json({
      totalDonated: parseFloat(totalResult.rows[0]?.total || 0),
      breakdown: breakdownResult.rows.map((r) => ({
        categoryName: r.category_name,
        categorySlug: r.slug,
        total: parseFloat(r.total),
      })),
      statue15FtCount: parseInt(statue15Count.rows[0]?.count || 0),
      globalStatue15FtFunded: parseInt(globalStatue15Count.rows[0]?.count || 0),
    });
  } catch (err) {
    console.error('Donation stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// --- Admin: list donations (used for pending + history) ---
export const getPendingDonations = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.user_id, d.amount, d.payment_proof_path, d.status, d.created_at, d.rejection_reason,
              dc.name as category_name, dc.slug as category_slug,
              u.full_name, u.email
       FROM donations d
       LEFT JOIN donation_categories dc ON d.category_id = dc.id
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Pending donations error:', err);
    res.status(500).json({ error: 'Failed to fetch pending donations' });
  }
};

// --- Admin: approve/reject donation ---
export const reviewDonation = async (req, res) => {
  const { donationId } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['CONFIRMED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be CONFIRMED or REJECTED' });
  }

  try {
    const updateResult = await query(
      `UPDATE donations SET status = $1, rejection_reason = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'PENDING'
       RETURNING id`,
      [status, status === 'REJECTED' ? rejectionReason || null : null, donationId]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found or already reviewed' });
    }
    res.json({ message: `Donation ${status.toLowerCase()}` });
  } catch (err) {
    console.error('Review donation error:', err);
    res.status(500).json({ error: 'Failed to review donation' });
  }
};
