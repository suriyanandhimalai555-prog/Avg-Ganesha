/**
 * Donations controller - submit, list, admin approve/reject.
 */
import { query } from '../../shared/db.js';
import { uploadToCloudinary } from '../../shared/cloudinary.js';

let cachedCategories = null;
let cachedCategoriesTime = 0;

// --- Get all categories (public) ---
export const getCategories = async (req, res) => {
  try {
    const now = Date.now();
    // 5-minute memory cache
    if (cachedCategories && now - cachedCategoriesTime < 5 * 60 * 1000) {
      return res.json(cachedCategories);
    }

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

    cachedCategories = categories;
    cachedCategoriesTime = now;

    res.json(categories);
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// --- Submit donation (requires auth + KYC approved) ---
export const submitDonation = async (req, res) => {
  const categoryId = req.body.categoryId ?? req.body.category_id;
  const amount = req.body.amount;
  const user_id = req.user.id;

  try {
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof is required' });
    }

    // Upload payment proof to Cloudinary
    const paymentProofUrl = await uploadToCloudinary(req.file.path, 'donations');

    // Force cast to integer to be safe
    const categoryCheck = await query(
      'SELECT name, slug FROM donation_categories WHERE id = $1::int',
      [categoryId]
    );

    const category = categoryCheck.rows[0];

    if (!category) {
      return res.status(400).json({ error: `No category found for id: ${categoryId}` });
    }

    const isStatue = category.slug === 'statue_1_5_ft';

    let result;
    if (isStatue) {
      // Check if this user already has a statue_number from a previous donation
      const existingStatueRes = await query(
        `SELECT statue_number FROM donations
         WHERE user_id = $1
           AND statue_number IS NOT NULL
         ORDER BY created_at ASC
         LIMIT 1`,
        [user_id]
      );

      const alreadyHasStatue = existingStatueRes.rows.length > 0;

      if (alreadyHasStatue) {
        // Repeat statue donation — their seat is already locked in, insert without statue_number
        result = await query(
          `INSERT INTO donations (
            user_id, category_id, amount, payment_proof_path, statue_number, status
          ) VALUES ($1, $2, $3, $4, NULL, 'PENDING') RETURNING *`,
          [user_id, categoryId, amount, paymentProofUrl]
        );
      } else {
        // First statue donation — assign a new unique number from sequence
        result = await query(
          `INSERT INTO donations (
            user_id, category_id, amount, payment_proof_path, statue_number, status
          ) VALUES (
            $1, $2, $3, $4, nextval('statue_number_seq'), 'PENDING'
          ) RETURNING *`,
          [user_id, categoryId, amount, paymentProofUrl]
        );
      }
    } else {
      result = await query(
        `INSERT INTO donations (
          user_id, category_id, amount, payment_proof_path, status
        ) VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *`,
        [user_id, categoryId, amount, paymentProofUrl]
      );
    }

    res.status(201).json({
      message: 'Donation submitted successfully',
      donation: result.rows[0],
    });
  } catch (err) {
    console.error('Error submitting donation:', err);
    res.status(500).json({ message: 'Server error' });
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
    const [totalResult, breakdownResult, statue15Count, globalStatue15Count, myStatueNumbers] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM donations WHERE user_id = $1 AND status = 'CONFIRMED'`,
        [userId]
      ),
      query(
        `SELECT dc.name as category_name, dc.slug, SUM(d.amount) as total
         FROM donations d
         LEFT JOIN donation_categories dc ON d.category_id = dc.id
         WHERE d.user_id = $1 AND d.status = 'CONFIRMED'
         GROUP BY dc.id, dc.name, dc.slug
         ORDER BY total DESC`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as count FROM donations
         WHERE user_id = $1 AND status = 'CONFIRMED'
         AND category_id = (SELECT id FROM donation_categories WHERE slug = 'statue_1_5_ft' LIMIT 1)`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as count FROM donations
         WHERE status = 'CONFIRMED'
         AND category_id = (SELECT id FROM donation_categories WHERE slug = 'statue_1_5_ft' LIMIT 1)`
      ),
      query(
        `SELECT DISTINCT statue_number FROM donations
         WHERE user_id = $1 AND status = 'CONFIRMED' AND statue_number IS NOT NULL
         ORDER BY statue_number ASC`,
        [userId]
      )
    ]);

    res.json({
      totalDonated: parseFloat(totalResult.rows[0]?.total || 0),
      breakdown: breakdownResult.rows.map((r) => ({
        categoryName: r.category_name,
        categorySlug: r.slug,
        total: parseFloat(r.total),
      })),
      statue15FtCount: parseInt(statue15Count.rows[0]?.count || 0),
      globalStatue15FtFunded: parseInt(globalStatue15Count.rows[0]?.count || 0),
      myStatueNumbers: myStatueNumbers.rows.map(r => r.statue_number),
    });
  } catch (err) {
    console.error('Donation stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// --- Admin: list donations (used for pending + history) ---
export const getPendingDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'ALL';

    let conditions = [];
    let values = [];

    if (statusFilter !== 'ALL') {
      values.push(statusFilter);
      conditions.push(`d.status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR dc.name ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*)
       FROM donations d
       LEFT JOIN donation_categories dc ON d.category_id = dc.id
       JOIN users u ON d.user_id = u.id
       ${whereClause}`,
      values
    );
    const totalItems = parseInt(countResult.rows[0].count);

    // Get paginated data
    const result = await query(
      `SELECT d.id, d.user_id, d.amount, d.payment_proof_path, d.status, d.created_at, d.rejection_reason,
              dc.name as category_name, dc.slug as category_slug,
              u.full_name, u.email
       FROM donations d
       LEFT JOIN donation_categories dc ON d.category_id = dc.id
       JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

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
