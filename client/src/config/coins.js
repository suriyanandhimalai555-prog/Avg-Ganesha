/**
 * AVG coin economics — single source of truth for the per-coin USD price
 * displayed across the app. Update this value to roll a new market price.
 */
export const AVG_COIN_USD_PRICE = 12.267;

/**
 * USD → INR exchange rate. Update this when the rate changes.
 * 1 USD = USD_TO_INR INR
 */
export const USD_TO_INR = 96;

/** Derived per-coin INR price */
export const AVG_COIN_INR_PRICE = AVG_COIN_USD_PRICE * USD_TO_INR;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdRateFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrRateFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a dollar amount as e.g. "$1,226.70". */
export const formatUsd = (amount) => usdFormatter.format(Number(amount) || 0);

/** Format the per-coin rate keeping 3 decimals (e.g. "$12.267"). */
export const formatUsdRate = (amount) => usdRateFormatter.format(Number(amount) || 0);

/** Convert an AVG coin balance to its current USD value. */
export const avgToUsd = (coins) => (Number(coins) || 0) * AVG_COIN_USD_PRICE;

/** Convert an AVG coin balance to its current INR value. */
export const avgToInr = (coins) => (Number(coins) || 0) * AVG_COIN_INR_PRICE;

/** Format an INR amount as e.g. "₹1,03,456.78". */
export const formatInr = (amount) => inrFormatter.format(Number(amount) || 0);

/** Format the per-coin INR rate. */
export const formatInrRate = (amount) => inrRateFormatter.format(Number(amount) || 0);

/*
 * 1.5 Ft statue seva coin rule — mirrors backend/src/modules/donations/coinRules.js.
 * 500 coins for seva dated up to 7 Sep 2026, 100 from 8 Sep 2026, judged by the
 * seva's calendar date in India (IST). The backend is authoritative; this is only
 * used to pre-fill / preview values in the console.
 */
export const STATUE_COIN_CUTOFF_IST = '2026-09-08';
const IST_OFFSET_MS = 330 * 60 * 1000;

/** YYYY-MM-DD of an instant (or date string) as seen in India. */
export const istDateString = (value) => {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
};

/** Today's date in India, YYYY-MM-DD (for date-picker max bounds). */
export const istToday = () => istDateString(Date.now());

/** Automatic statue coin reward for a seva date. */
export const statueCoinRate = (sevaDate) =>
  istDateString(sevaDate ?? Date.now()) < STATUE_COIN_CUTOFF_IST ? 500 : 100;

/** Format a date as "05 Sep 2026" in IST. */
export const formatIstDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      })
    : '—';
