// backend/utils/shippingCalculator.js

/**
 * Professional tiered shipping strategy:
 * - $0-$35: $6.99 flat rate
 * - $35-$75: $4.99 flat rate
 * - $75+: FREE shipping
 */
function calculateShipping(cartTotal, itemCount) {
  if (cartTotal >= 75) return 0;
  if (cartTotal >= 35) return 4.99;
  return 6.99;
}

module.exports = { calculateShipping };
