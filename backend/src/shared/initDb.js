/**
 * Idempotent schema bootstrap for feature-specific tables.
 * Runs on server startup; safe to re-run.
 */
import { query } from './db.js';

export const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_avg_coins (
        id            SERIAL        PRIMARY KEY,
        user_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        donation_id   INTEGER       NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        amount        NUMERIC(12,2) NOT NULL,
        source        VARCHAR(64)   NOT NULL,
        earned_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        locked_until  TIMESTAMPTZ   NOT NULL,
        is_withdrawable BOOLEAN     NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT user_avg_coins_donation_unique UNIQUE (donation_id)
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_user_avg_coins_user_id ON user_avg_coins(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_avg_coins_locked_until ON user_avg_coins(locked_until);`);

    // Backfill: award 100 AVG coins for already-CONFIRMED 1.5 Ft Statue donations.
    // Locked for 5 years from the donation's created_at (purchase date).
    // Idempotent via UNIQUE(donation_id).
    const backfill = await query(`
      INSERT INTO user_avg_coins
        (user_id, donation_id, amount, source, earned_at, locked_until, is_withdrawable)
      SELECT d.user_id, d.id, 100, 'STATUE_1_5_FT_DONATION', d.created_at,
             d.created_at + INTERVAL '5 years', FALSE
      FROM donations d
      JOIN donation_categories dc ON dc.id = d.category_id
      WHERE d.status = 'CONFIRMED'
        AND dc.slug = 'statue_1_5_ft'
      ON CONFLICT (donation_id) DO NOTHING
      RETURNING id
    `);
    if (backfill.rowCount > 0) {
      console.log(`✅ Backfilled AVG coins for ${backfill.rowCount} confirmed 1.5 Ft Statue donation(s)`);
    }

    console.log('✅ Schema bootstrap: user_avg_coins ready');
  } catch (err) {
    console.error('❌ Schema bootstrap failed:', err.message);
  }
};
