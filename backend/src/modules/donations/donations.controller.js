/**
 * Donations controller - submit, list, admin approve/reject.
 */
import { query, withTransaction } from '../../shared/db.js';
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

// Assign the statue seat number and award 100 AVG coins for a confirmed 1.5 Ft Statue
// donation, both inside a single transaction.
//
// Race-safety: we lock the user row (SELECT ... FOR UPDATE) as a per-user mutex.
// Because the user row always exists, the lock is always acquired — unlike locking
// donation rows with statue_number IS NOT NULL, which acquires nothing when the user
// has no prior statue rows and leaves two concurrent first-confirmations unprotected.
//
// Both writes sharing one transaction means a coin-award failure can never leave a
// committed statue number with no corresponding coin row.
//
// Called by reviewDonation and createAdminEntry.
async function confirmStatueSeva(donation) {
  await withTransaction(async (client) => {
    // Per-user mutex: serialises all concurrent statue confirmations for this devotee.
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [donation.user_id]);

    // Assign seat number on first confirmed statue only.
    const existing = await client.query(
      `SELECT statue_number FROM donations
       WHERE user_id = $1 AND status = 'CONFIRMED' AND statue_number IS NOT NULL AND id <> $2
       LIMIT 1`,
      [donation.user_id, donation.id]
    );
    if (existing.rows.length === 0) {
      await client.query(
        `UPDATE donations SET statue_number = nextval('statue_number_seq')
         WHERE id = $1 AND statue_number IS NULL`,
        [donation.id]
      );
    }

    // Award 100 coins, once per devotee. The user-row lock above makes the
    // NOT EXISTS check atomic with the INSERT for the same user.
    await client.query(
      `INSERT INTO user_avg_coins
         (user_id, donation_id, amount, source, earned_at, locked_until, is_withdrawable)
       SELECT $1, $2, $3, 'STATUE_1_5_FT_DONATION', $4,
              ($4::timestamptz + ($5 || ' years')::interval), FALSE
       WHERE NOT EXISTS (
         SELECT 1 FROM user_avg_coins
         WHERE user_id = $1 AND source = 'STATUE_1_5_FT_DONATION'
       )
       ON CONFLICT (donation_id) DO NOTHING`,
      [donation.user_id, donation.id, STATUE_15FT_COIN_REWARD, donation.created_at, STATUE_15FT_LOCK_YEARS]
    );
  });
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

    const isStatue = category.slug === STATUE_SLUG;

    let result;
    if (isStatue) {
      // statue_number is assigned at CONFIRMATION, not here — so submissions never
      // consume a sequence value and rejections can never create gaps.
      result = await query(
        `INSERT INTO donations (
           user_id, category_id, amount, payment_proof_path, statue_number, status
         ) VALUES ($1, $2, $3, $4, NULL, 'PENDING') RETURNING *`,
        [user_id, categoryId, amount, paymentProofUrl]
      );
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

    // On CONFIRMED 1.5 Ft Statue donation: assign a seat number (first time only)
    // then award 100 AVG coins locked for 5 years from the purchase date (created_at).
    // Coin award is idempotent via UNIQUE(donation_id).
    if (status === 'CONFIRMED') {
      const donation = updateResult.rows[0];
      const categoryRes = await query(
        'SELECT slug FROM donation_categories WHERE id = $1::int',
        [donation.category_id]
      );
      if (categoryRes.rows[0]?.slug === STATUE_SLUG) {
        await confirmStatueSeva(donation);
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

    // Upload proof only after all validation passes so we never orphan S3 objects.
    const paymentProofPath = req.file ? await uploadToS3(req.file.path, 'proofs') : '';

    // Insert donation. statue_number is always NULL at insert; it is assigned at
    // confirmation below (no gaps from rejected entries — see confirmStatueSeva).
    let donation;
    if (isStatue) {
      const insertRes = await query(
        `INSERT INTO donations (user_id, category_id, amount, payment_proof_path, statue_number, status)
         VALUES ($1, $2, $3, $4, NULL, $5) RETURNING *`,
        [userId, categoryId, amount, paymentProofPath, status]
      );
      donation = insertRes.rows[0];
    } else {
      const result = await query(
        `INSERT INTO donations (user_id, category_id, amount, payment_proof_path, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, categoryId, amount, paymentProofPath, status]
      );
      donation = result.rows[0];
    }

    // Assign seat number + award coins for a confirmed statue seva
    if (status === 'CONFIRMED' && isStatue) {
      await confirmStatueSeva(donation);
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

// --- Admin: roster of all statue numbers (1.5 Ft) ---
// Returns every donation in the statue category that either has a number assigned
// or is CONFIRMED (catches devotees who somehow ended up without a number so the
// admin can use updateStatueNumber to fix them). Frontend derives gap rows from this.
export const getStatueNumbers = async (_req, res) => {
  try {
    const result = await query(
      `SELECT d.id AS donation_id, d.statue_number, d.status, d.created_at,
              u.id AS user_id, u.full_name, u.email
       FROM donations d
       JOIN users u ON u.id = d.user_id
       JOIN donation_categories dc ON dc.id = d.category_id
       WHERE dc.slug = $1
         AND (
           d.statue_number IS NOT NULL
           OR (
             d.status = 'CONFIRMED'
             AND d.statue_number IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM donations d2
               WHERE d2.user_id = d.user_id
                 AND d2.statue_number IS NOT NULL
             )
           )
         )
       ORDER BY d.statue_number ASC NULLS LAST, d.created_at ASC`,
      [STATUE_SLUG]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get statue numbers error:', err);
    res.status(500).json({ error: 'Failed to fetch statue numbers' });
  }
};

// --- Admin: reassign / correct a statue number ---
// PATCH /admin/statue-number/:donationId  body: { statueNumber }
//
// If the target number is free  → set it directly.
// If the target number is taken → swap the two rows (src gets target, occupant gets
//   src's old number). Swapping is safe whether or not a UNIQUE constraint exists
//   because the three steps are wrapped in a single transaction.
// If the target is taken AND src has no number → 409 (no number to give to the occupant).
export const updateStatueNumber = async (req, res) => {
  const donationId = parseInt(req.params.donationId);
  const num = parseInt(req.body.statueNumber);

  if (!Number.isInteger(num) || num < 1) {
    return res.status(400).json({ error: 'statueNumber must be a positive integer' });
  }

  try {
    await withTransaction(async (client) => {
      // Lock + fetch the source donation
      const srcRes = await client.query(
        `SELECT d.id, d.statue_number, dc.slug
         FROM donations d
         JOIN donation_categories dc ON dc.id = d.category_id
         WHERE d.id = $1
         FOR UPDATE`,
        [donationId]
      );
      const src = srcRes.rows[0];
      if (!src) {
        const err = new Error('Donation not found');
        err.status = 404;
        throw err;
      }
      if (src.slug !== STATUE_SLUG) {
        const err = new Error('Not a 1.5 Ft statue donation');
        err.status = 400;
        throw err;
      }
      if (src.statue_number === num) {
        return; // no-op: already correct
      }

      // Lock + fetch whoever currently holds the target number (if anyone)
      const occupantRes = await client.query(
        `SELECT id, statue_number FROM donations WHERE statue_number = $1 FOR UPDATE`,
        [num]
      );
      const occupant = occupantRes.rows[0];

      if (!occupant) {
        // Target is free — simple set
        await client.query(
          `UPDATE donations SET statue_number = $1 WHERE id = $2`,
          [num, donationId]
        );
      } else {
        // Target is occupied — swap
        const oldSrcNumber = src.statue_number;
        if (oldSrcNumber === null) {
          const err = new Error(
            `#${num} is already assigned to another devotee. ` +
            `This donation has no number to give in return — pick a free number instead.`
          );
          err.status = 409;
          throw err;
        }
        // Three-step swap to avoid any intermediate duplicate
        await client.query(`UPDATE donations SET statue_number = NULL WHERE id = $1`, [occupant.id]);
        await client.query(`UPDATE donations SET statue_number = $1 WHERE id = $2`, [num, donationId]);
        await client.query(`UPDATE donations SET statue_number = $1 WHERE id = $2`, [oldSrcNumber, occupant.id]);
      }
    });

    await invalidateCache(CACHE_KEYS.GLOBAL_STATUE_COUNT);
    res.json({ message: `Statue number updated to #${num}` });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Update statue number error:', err);
    res.status(500).json({ error: 'Failed to update statue number' });
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
