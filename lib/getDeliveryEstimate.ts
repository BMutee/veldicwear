/**
 * Delivery-estimate math for CJ Dropshipping fulfillment.
 *
 * Processing ("preparing your order") time:
 *   - In stock, ships fast ............ 2 calendar days
 *   - Must be sourced from supplier ... 3–5 calendar days
 * Shipping ("on its way") time: 6–11 calendar days — CJ's observed transit
 * spread, with 11 days the 90th-percentile (worst-case) estimate.
 *
 * Every window here is in CALENDAR days, weekends included. That is deliberate:
 * CJ quotes transit percentiles in calendar days, so an "11 day" promise means
 * 11 real days rather than 11 business days.
 *
 * There is intentionally NO `sourcingRequired` column on Product. Whether an
 * item has to be sourced is derived from its live CJ-synced stock instead:
 * `stock > 0` means CJ is holding it and it ships fast, `stock <= 0` means it
 * must be sourced from the supplier. See `sourcingRequiredFromStock()` /
 * `sourcingRequiredFromStocks()` — those are the single source of truth for the
 * derivation, so no parallel flag can drift out of sync with stock.
 */

export const PROCESSING_DAYS_IN_STOCK = 2;
export const PROCESSING_DAYS_SOURCED_MIN = 3;
export const PROCESSING_DAYS_SOURCED_MAX = 5;
export const SHIPPING_DAYS_MIN = 6;
export const SHIPPING_DAYS_MAX = 11;

export type DeliveryEstimate = {
  /** Earliest the order can finish processing and be ready to ship. */
  preparedByMin: Date;
  /** Latest the order can finish processing and be ready to ship. */
  preparedByMax: Date;
  /** Earliest possible arrival at the customer. */
  arrivalMin: Date;
  /** Latest expected arrival (processing max + slowest transit). */
  arrivalMax: Date;
};

/** Add whole calendar days while keeping the time of day. Weekends included. */
function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Derive whether an item must be sourced from the supplier from its stock.
 *
 * `stock > 0` -> CJ holds it, ships fast. `stock <= 0` -> must be sourced.
 * Non-finite input is treated as "needs sourcing" so we never over-promise.
 */
export function sourcingRequiredFromStock(stock: number): boolean {
  return !Number.isFinite(stock) || stock <= 0;
}

/**
 * Derive sourcing status across several stock figures for one product (its
 * product-level stock plus each variant's). If ANY figure is positive the item
 * is on hand and ships fast. An empty list is treated as "needs sourcing".
 */
export function sourcingRequiredFromStocks(
  stocks: readonly number[],
): boolean {
  return !stocks.some((stock) => stock > 0);
}

/**
 * Estimate the preparation and arrival windows for a single sourcing status.
 *
 * All four returned dates are `orderDate` plus processing plus shipping, so the
 * caller can render a staged timeline rather than one combined number.
 */
export function getDeliveryEstimate(
  orderDate: Date,
  sourcingRequired: boolean,
): DeliveryEstimate {
  const processingMin = sourcingRequired
    ? PROCESSING_DAYS_SOURCED_MIN
    : PROCESSING_DAYS_IN_STOCK;
  const processingMax = sourcingRequired
    ? PROCESSING_DAYS_SOURCED_MAX
    : PROCESSING_DAYS_IN_STOCK;

  const preparedByMin = addCalendarDays(orderDate, processingMin);
  const preparedByMax = addCalendarDays(orderDate, processingMax);

  return {
    preparedByMin,
    preparedByMax,
    // Best case: fastest processing + fastest transit.
    arrivalMin: addCalendarDays(preparedByMin, SHIPPING_DAYS_MIN),
    // Worst case: slowest processing + slowest transit.
    arrivalMax: addCalendarDays(preparedByMax, SHIPPING_DAYS_MAX),
  };
}

/**
 * Estimate for a whole cart or order.
 *
 * A shared order ships together, so it can never arrive faster than its slowest
 * item: if ANY item has to be sourced, the conservative (sourced) timeline
 * applies to the entire order. An empty list is also treated as conservative.
 */
export function getEstimateForItems(
  items: readonly { sourcingRequired: boolean }[],
  orderDate: Date,
): DeliveryEstimate {
  const sourcingRequired =
    items.length === 0 || items.some((item) => item.sourcingRequired);
  return getDeliveryEstimate(orderDate, sourcingRequired);
}

/**
 * Convenience wrapper for call sites that hold raw stock numbers rather than a
 * pre-derived sourcing flag (storefront product page, cart, order confirm).
 *
 * IMPORTANT: pass ONE entry per line item, with the stock numbers for that item
 * already collapsed (see `sourcingRequiredFromStocks`). A single product with a
 * zero product-level stock but an in-stock variant is therefore "on hand", while
 * two separate line items where only one is on hand still has to wait for the
 * out-of-stock one — which is the desired conservative behaviour.
 */
export function getEstimateForStockItems(
  items: readonly { stock: number }[],
  orderDate: Date,
): DeliveryEstimate {
  return getEstimateForItems(
    items.map((item) => ({
      sourcingRequired: sourcingRequiredFromStock(item.stock),
    })),
    orderDate,
  );
}