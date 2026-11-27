/**
 * Idempotent schema bootstrap for feature-specific tables.
 * Runs on server startup; safe to re-run.
 */
import { query } from './db.js';

// Run one DDL step in isolation so a failure can't skip the steps after it.
const step = async (label, sql) => {
  try {
    await query(sql);
  } catch (err) {
    console.error(`❌ Schema step failed (${label}):`, err.message);
  }
};

export const initDb = async () => {
  // Console-wide audit trail — created FIRST and in isolation: console writes log to
  // it (see shared/audit.js), so it must not depend on any later step succeeding.
  // actor_name/actor_email are snapshots so the log survives operator deletion.
  await step('admin_audit_log', `
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id             SERIAL       PRIMARY KEY,
      actor_id       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
      actor_name     TEXT,
      actor_email    TEXT,
      actor_role     VARCHAR(16),
      action         VARCHAR(48)  NOT NULL,
      entity_type    VARCHAR(24)  NOT NULL,
      entity_id      INTEGER,
      target_user_id INTEGER      REFERENCES users(id) ON DELETE SET NULL,
      summary        TEXT         NOT NULL,
      details        JSONB,
      created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);
  await step('idx_admin_audit_created', `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);`);
  await step('idx_admin_audit_target', `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_user_id);`);
  await step('idx_admin_audit_actor', `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON admin_audit_log(actor_id);`);
  await step('idx_admin_audit_action', `CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);`);

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
  } catch (err) {
    console.error('❌ Schema bootstrap failed:', err.message);
  }

  // Manual AVG-coin adjustments (ADMIN only) have no donation: donation_id becomes
  // nullable (UNIQUE still allows many NULLs), and we record who granted it and why.
  await step('user_avg_coins.donation_id nullable', `ALTER TABLE user_avg_coins ALTER COLUMN donation_id DROP NOT NULL;`);
  await step('user_avg_coins.granted_by', `ALTER TABLE user_avg_coins ADD COLUMN IF NOT EXISTS granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  await step('user_avg_coins.note', `ALTER TABLE user_avg_coins ADD COLUMN IF NOT EXISTS note TEXT;`);

  // NOTE: the one-time AVG-coin backfill that used to run here on EVERY boot has been
  // removed. It (a) always inserted 100 coins, even for seva dated in the 500-coin
  // promotional window, and (b) re-awarded coins to devotees for whom an admin had
  // deliberately chosen 0 coins, on the next restart. The backfill already ran on
  // production long ago; new statue coin rows are written only by confirmStatueSeva(),
  // and manual adjustments only by adjustUserCoins() (ADMIN).

  console.log('✅ Schema bootstrap complete');
};
