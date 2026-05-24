/**
 * AVG coin economics — single source of truth for the per-coin USD price
 * displayed across the app. Update this value to roll a new market price.
 */
export const AVG_COIN_USD_PRICE = 12.267;

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

/** Format a dollar amount as e.g. "$1,226.70". */
export const formatUsd = (amount) => usdFormatter.format(Number(amount) || 0);

/** Format the per-coin rate keeping 3 decimals (e.g. "$12.267"). */
export const formatUsdRate = (amount) => usdRateFormatter.format(Number(amount) || 0);

/** Convert an AVG coin balance to its current USD value. */
export const avgToUsd = (coins) => (Number(coins) || 0) * AVG_COIN_USD_PRICE;
