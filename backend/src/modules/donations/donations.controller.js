/**
 * Donations controller - submit, list, admin approve/reject.
 */
import { query } from '../../shared/db.js';
import { uploadToS3 } from '../../shared/s3.js';
import { getCachedData, invalidateCache } from '../../shared/redis.js';

const CACHE_KEYS = {
  CATEGORIES: 'donations:categories',
  GLOBAL_STATUE_COUNT: 'donations:global_statue_count',
  ADMIN_STATS: 'admin:stats'
};

// AVG Coin reward config for the 1.5 Ft Statue donation.
// Coins are locked (non-withdrawable) for 5 years from the donation purchase date.
const STATUE_15FT_COIN_REWARD = 100;
const STATUE_15FT_LOCK_YEARS = 5;
const STATUE_SLUG = 'statue_1_5_ft';

// Award 100 AVG coins for a 1.5 Ft Statue donation, locked for 5 years from the
// donation's purchase date (created_at). Idempotent via UNIQUE(donation_id).
// Shared by admin review (reviewDonation) and admin on-behalf entry (createAdminEntry).
async function awardStatueCoins(donation) {
  await query(
    `INSERT INTO user_avg_coins
       (user_id, donation_id, amount, source, earned_at, locked_until, is_withdrawable)
     VALUES (
       $1, $2, $3, 'STATUE_1_5_FT_DONATION', $4,
       ($4::timestamptz + ($5 || ' years')::interval), FALSE
     )
     ON CONFLICT (donation_id) DO NOTHING`,
    [donation.user_id, donation.id, STATUE_15FT_COIN_REWARD, donation.created_at, STATUE_15FT_LOCK_YEARS]
  );
}

// Insert a statue (1.5 Ft) donation, assigning a statue_number only on the user's
// FIRST statue donation (their seat is locked in); repeat statue donations reuse it
// (NULL number). Shared by submit + admin entry. Returns the inserted donation row.
async function insertStatueDonation({ userId, categoryId, amount, paymentProofPath, status }) {
  const existingStatueRes = await query(
    `SELECT statue_number FROM donations
     WHERE user_id = $1 AND statue_number IS NOT NULL
     ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  const alreadyHasStatue = existingStatueRes.rows.length > 0;
  const numberExpr = alreadyHasStatue ? 'NULL' : `nextval('statue_number_seq')`;
  const result = await query(
    `INSERT INTO donations (user_id, category_id, amount, payment_proof_path, statue_number, status)
     VALUES ($1, $2, $3, $4, ${numberExpr}, $5) RETURNING *`,
    [userId, categoryId, amount, paymentProofPath, status]
  );
  return result.rows[0];
}


// --- Get all categories (public) ---
export const getCategories = async (req, res) => {
  try {
    const categories = await getCachedData(CACHE_KEYS.CATEGORIES, async () => {
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

      return catResult.rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        hasFixedPrice: c.has_fixed_price,
        fixedPrice: c.has_fixed_price && prices[c.slug] ? prices[c.slug] : null,
        displayOrder: c.display_order,
      }));
    }, 3600); // 1 hour cache

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

    // Upload payment proof to S3
    const paymentProofUrl = await uploadToS3(req.file.path, 'proofs');

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

    // Invalidate admin stats cache (new pending donation)
    await invalidateCache(CACHE_KEYS.ADMIN_STATS);

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
      getCachedData(CACHE_KEYS.GLOBAL_STATUE_COUNT, async () => {
        const res = await query(
          `SELECT COUNT(*) as count FROM donations
           WHERE status = 'CONFIRMED'
           AND category_id = (SELECT id FROM donation_categories WHERE slug = 'statue_1_5_ft' LIMIT 1)`
        );
        return parseInt(res.rows[0].count);
      }, 300), // 5 minute cache
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
      globalStatue15FtFunded: globalStatue15Count,
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
       RETURNING id, user_id, category_id, created_at`,
      [status, status === 'REJECTED' ? rejectionReason || null : null, donationId]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found or already reviewed' });
    }

    // On CONFIRMED 1.5 Ft Statue donation: award 100 AVG coins locked for 5 years
    // from the purchase date (donation.created_at). Idempotent via UNIQUE(donation_id).
    if (status === 'CONFIRMED') {
      const donation = updateResult.rows[0];
      const categoryRes = await query(
        'SELECT slug FROM donation_categories WHERE id = $1::int',
        [donation.category_id]
      );
      if (categoryRes.rows[0]?.slug === STATUE_SLUG) {
        await awardStatueCoins(donation);
      }
    }

    // Invalidate relevant caches
    await Promise.all([
      invalidateCache(CACHE_KEYS.GLOBAL_STATUE_COUNT),
      invalidateCache(CACHE_KEYS.ADMIN_STATS)
    ]);

    res.json({ message: `Donation ${status.toLowerCase()}` });
  } catch (err) {
    console.error('Review donation error:', err);
    res.status(500).json({ error: 'Failed to review donation' });
  }
};

// --- Admin: record a seva/donation entry on behalf of a user ---
// The admin picks a devotee + category + amount and records the seva directly
// (e.g. offline cash/bank). Entries default to CONFIRMED and are indistinguishable
// from user submissions: same statue-number assignment + 100-coin award for a
// confirmed 1.5 Ft statue seva. No payment proof (stored as empty string).
export const createAdminEntry = async (req, res) => {
  const userId = req.body.userId ?? req.body.user_id;
  const categoryId = req.body.categoryId ?? req.body.category_id;
  const amount = parseFloat(req.body.amount);
  const status = (req.body.status || 'CONFIRMED').toUpperCase();

  try {
    if (!userId || !categoryId) {
      return res.status(400).json({ error: 'userId and categoryId are required' });
    }
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required' });
    }
    if (!['CONFIRMED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: "status must be CONFIRMED or PENDING" });
    }

    // Validate devotee exists
    const userRes = await query('SELECT id FROM users WHERE id = $1::int', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Devotee not found' });
    }

    // Validate category
    const categoryRes = await query(
      'SELECT id, name, slug FROM donation_categories WHERE id = $1::int',
      [categoryId]
    );
    const category = categoryRes.rows[0];
    if (!category) {
      return res.status(400).json({ error: `No category found for id: ${categoryId}` });
    }

    const isStatue = category.slug === STATUE_SLUG;

    // Insert (empty proof — admin-recorded offline entry)
    let donation;
    if (isStatue) {
      donation = await insertStatueDonation({
        userId,
        categoryId,
        amount,
        paymentProofPath: '',
        status,
      });
    } else {
      const result = await query(
        `INSERT INTO donations (user_id, category_id, amount, payment_proof_path, status)
         VALUES ($1, $2, $3, '', $4) RETURNING *`,
        [userId, categoryId, amount, status]
      );
      donation = result.rows[0];
    }

    // Award coins immediately for a confirmed statue seva (mirrors reviewDonation)
    if (status === 'CONFIRMED' && isStatue) {
      await awardStatueCoins(donation);
    }

    await Promise.all([
      invalidateCache(CACHE_KEYS.GLOBAL_STATUE_COUNT),
      invalidateCache(CACHE_KEYS.ADMIN_STATS),
    ]);

    res.status(201).json({
      message: `Seva entry recorded (${status.toLowerCase()})`,
      donation,
    });
  } catch (err) {
    console.error('Admin create entry error:', err);
    res.status(500).json({ error: 'Failed to record seva entry' });
  }
};

// --- User's AVG coin balance + locked entries ---
export const getMyCoins = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT c.id, c.donation_id, c.amount, c.source, c.earned_at, c.locked_until, c.is_withdrawable
       FROM user_avg_coins c
       WHERE c.user_id = $1
       ORDER BY c.earned_at ASC`,
      [userId]
    );

    const entries = result.rows.map((r) => ({
      id: r.id,
      donationId: r.donation_id,
      amount: parseFloat(r.amount),
      source: r.source,
      earnedAt: r.earned_at,
      lockedUntil: r.locked_until,
      isWithdrawable: r.is_withdrawable,
    }));

    const totalBalance = entries.reduce((sum, e) => sum + e.amount, 0);
    const lockedBalance = entries
      .filter((e) => !e.isWithdrawable && new Date(e.lockedUntil) > new Date())
      .reduce((sum, e) => sum + e.amount, 0);
    const nextUnlockAt = entries
      .filter((e) => !e.isWithdrawable && new Date(e.lockedUntil) > new Date())
      .map((e) => new Date(e.lockedUntil))
      .sort((a, b) => a - b)[0] || null;

    res.json({
      totalBalance,
      lockedBalance,
      withdrawableBalance: totalBalance - lockedBalance,
      nextUnlockAt,
      entries,
    });
  } catch (err) {
    console.error('Get my coins error:', err);
    res.status(500).json({ error: 'Failed to fetch AVG coins' });
  }
};
