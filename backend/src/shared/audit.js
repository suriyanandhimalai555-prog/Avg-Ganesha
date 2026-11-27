/**
 * Console-wide audit trail ("who changed what").
 *
 * Every console write (ADMIN or STAFF) should call logAudit() once. Rows are
 * append-only — there is deliberately no update/delete endpoint.
 *
 * Robustness contract: an audit failure must NEVER break the business action.
 *   • Inside a transaction (pass the client): the insert runs under a SAVEPOINT, so it
 *     commits atomically with the change, but if the insert itself fails (e.g. the
 *     table is not created yet during the boot window) we roll back to the savepoint
 *     and the surrounding transaction carries on.
 *   • Outside a transaction (pass null): uses the pool; failures are only logged.
 *
 * The operator's name/email are snapshotted onto the row, so the log still says who
 * did it even if that operator's account is later deleted (actor_id → NULL).
 */
import { query } from './db.js';

const INSERT_SQL = `
  INSERT INTO admin_audit_log
    (actor_id, actor_name, actor_email, actor_role, action, entity_type, entity_id,
     target_user_id, summary, details)
  SELECT $1::int, u.full_name, COALESCE(u.email, $2::text), $3::varchar,
         $4::varchar, $5::varchar, $6::int, $7::int, $8::text, $9::jsonb
  FROM (SELECT 1) one
  LEFT JOIN users u ON u.id = $1::int`;

/**
 * @param {import('pg').PoolClient|null} client  open transaction client, or null
 * @param {object}  e
 * @param {object}  e.req           Express request (actor = req.user)
 * @param {string}  e.action        e.g. 'COIN_ADJUST', 'KYC_REVIEW'
 * @param {string}  e.entityType    'USER' | 'DONATION' | 'SETTINGS' | 'PLANS'
 * @param {number}  [e.entityId]
 * @param {number}  [e.targetUserId] devotee affected (drives per-devotee history)
 * @param {string}  e.summary       readable one-liner — include the devotee's name
 * @param {object}  [e.details]     old/new values (never secrets/passwords)
 */
export async function logAudit(client, { req, action, entityType, entityId = null, targetUserId = null, summary, details = null }) {
  const actor = req?.user || {};
  const params = [
    actor.id ?? null,
    actor.email ?? null,
    actor.role ?? null,
    action,
    entityType,
    entityId != null ? Number(entityId) : null,
    targetUserId != null ? Number(targetUserId) : null,
    summary,
    details ? JSON.stringify(details) : null,
  ];

  if (!client) {
    try {
      await query(INSERT_SQL, params);
    } catch (err) {
      console.error(`Audit log write failed (${action}):`, err.message);
    }
    return;
  }

  try {
    await client.query('SAVEPOINT audit_log');
    await client.query(INSERT_SQL, params);
    await client.query('RELEASE SAVEPOINT audit_log');
  } catch (err) {
    console.error(`Audit log write failed (${action}):`, err.message);
    try {
      await client.query('ROLLBACK TO SAVEPOINT audit_log');
    } catch (rbErr) {
      console.error('Audit savepoint rollback failed:', rbErr.message);
    }
  }
}

/** Convenience: a devotee label for summaries ("Ravi Kumar (#42)"). */
export const devoteeLabel = (row, id) =>
  `${row?.full_name || row?.email || 'Devotee'} (#${row?.id ?? id})`;
