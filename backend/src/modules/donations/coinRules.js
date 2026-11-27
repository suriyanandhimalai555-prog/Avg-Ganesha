/**
 * AVG coin rules for the 1.5 Ft Statue seva — single source of truth.
 *
 * Promotional rate : 500 coins for seva dated up to 7 Sep 2026 (IST, inclusive).
 * Standard rate    : 100 coins for seva dated 8 Sep 2026 (IST) onward.
 * Coins are locked (non-withdrawable) for 5 years from the seva date.
 *
 * "Seva date" is donations.created_at, judged by its calendar date in India
 * (Asia/Kolkata, UTC+05:30) — the business runs on IST, so a seva made at
 * 01:00 IST on 8 Sep is a standard-rate seva even though it is still 7 Sep in UTC.
 */
export const STATUE_SLUG = 'statue_1_5_ft';
export const STATUE_COIN_SOURCE = 'STATUE_1_5_FT_DONATION';
export const STATUE_15FT_COIN_REWARD = 100;       // standard rate
export const STATUE_15FT_COIN_REWARD_PROMO = 500; // promotional rate
export const STATUE_COIN_CUTOFF_IST = '2026-09-08'; // first IST day of the standard rate
export const STATUE_15FT_LOCK_YEARS = 5;

const IST_OFFSET_MS = 330 * 60 * 1000; // +05:30, India has no DST

/** Calendar date (YYYY-MM-DD) of an instant, as seen in India. */
export function istDateString(value) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Time of day (HH:MM:SS.mmm) of an instant, as seen in India. */
export function istTimeString(value) {
  const t = new Date(value).getTime();
  return new Date(t + IST_OFFSET_MS).toISOString().slice(11, 23);
}

/** Today's calendar date in India. */
export const istToday = () => istDateString(Date.now());

/** Automatic coin reward for a statue seva on the given date/instant. */
export function statueCoinReward(sevaDate) {
  return istDateString(sevaDate) < STATUE_COIN_CUTOFF_IST
    ? STATUE_15FT_COIN_REWARD_PROMO
    : STATUE_15FT_COIN_REWARD;
}

/** Strict YYYY-MM-DD check that also rejects impossible dates like 2026-02-30. */
export function isValidIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Ledger source for manual ADMIN coin adjustments (no donation attached). */
export const ADMIN_ADJUSTMENT_SOURCE = 'ADMIN_ADJUSTMENT';
export const MAX_COIN_ADJUSTMENT = 100000;

/**
 * Balance math for a devotee's coin ledger — single place for both the devotee's
 * /my-coins view and the admin devotee overview.
 *
 * entries: [{ amount:number, lockedUntil, isWithdrawable }]
 *   • total        = sum of every row (deductions are negative rows)
 *   • locked       = positive rows still inside their lock, capped at total (≥ 0).
 *                    Deductions don't carry a lock of their own — they reduce the
 *                    balance, and the cap keeps locked ≤ total.
 *   • withdrawable = total − locked (≥ 0)
 *   • nextUnlockAt = earliest future unlock among positive locked rows
 */
export function summarizeCoins(entries, now = new Date()) {
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const lockedRows = entries.filter(
    (e) => e.amount > 0 && !e.isWithdrawable && new Date(e.lockedUntil) > now
  );
  const lockedRaw = lockedRows.reduce((sum, e) => sum + e.amount, 0);
  const locked = Math.max(Math.min(lockedRaw, total), 0);
  const nextUnlockAt =
    lockedRows.map((e) => new Date(e.lockedUntil)).sort((a, b) => a - b)[0] || null;
  return {
    totalBalance: total,
    lockedBalance: locked,
    withdrawableBalance: Math.max(total - locked, 0),
    nextUnlockAt,
  };
}
