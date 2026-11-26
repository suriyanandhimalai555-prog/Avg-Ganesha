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

    // Attribution: stamp WHO performed console actions, so a mistake can be traced to a
    // specific ADMIN or STAFF operator. ON DELETE SET NULL — removing the operator must
    // never cascade-delete the donation/user it points at.
    await query(`ALTER TABLE donations ADD COLUMN IF NOT EXISTS recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
    await query(`ALTER TABLE donations ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`);

    // Audit trail for admin edits that change money-like data (e.g. seva date changes,
    // which re-price AVG coins). Append-only; ON DELETE CASCADE with the donation.
    await query(`
      CREATE TABLE IF NOT EXISTS donation_audit_log (
        id           SERIAL        PRIMARY KEY,
        donation_id  INTEGER       NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        action       VARCHAR(32)   NOT NULL,
        changed_by   INTEGER       REFERENCES users(id) ON DELETE SET NULL,
        old_value    TEXT,
        new_value    TEXT,
        coin_old     NUMERIC(12,2),
        coin_new     NUMERIC(12,2),
        note         TEXT,
        created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_donation_audit_log_donation ON donation_audit_log(donation_id);`);

    // NOTE: the one-time AVG-coin backfill that used to run here on EVERY boot has been
    // removed. It (a) always inserted 100 coins, even for seva dated in the 500-coin
    // promotional window, and (b) re-awarded coins to devotees for whom an admin had
    // deliberately chosen 0 coins, on the next restart. The backfill already ran on
    // production long ago; new coin rows are written only by confirmStatueSeva().

    console.log('✅ Schema bootstrap: user_avg_coins ready');
  } catch (err) {
    console.error('❌ Schema bootstrap failed:', err.message);
  }
};
