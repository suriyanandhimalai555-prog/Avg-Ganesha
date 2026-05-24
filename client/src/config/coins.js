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
