/**
 * Pure, EDGE/BROWSER-SAFE currency-conversion helpers — no DB, no Node-only
 * imports (Prisma / pg / fs / net / dns).
 *
 * This is the split-off pure half of `lib/exchange-rates.ts`. Conversion math
 * (rate constants + price rounding/convert) must never pull the Prisma client
 * into a Client Component bundle, so it lives here as a self-contained module.
 * `lib/exchange-rates.ts` (server-only) re-exports these and adds the DB-backed
 * rate source on top.
 *
 * Import from THIS module anywhere a price is converted for DISPLAY in a
 * Client Component (e.g. `lib/use-viewer-currency.ts`).
 */

export const STALE_RATE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SUPPORTED_CONVERSION_CURRENCIES = ["CAD", "EUR"] as const;
export type SupportedCurrency =
  (typeof SUPPORTED_CONVERSION_CURRENCIES)[number];

export const BASE_CURRENCY = "USD" as const;

/**
 * Rounding rule for CONVERTED prices (shared utility — use this EVERYWHERE a
 * converted price is shown, never inline Math.round):
 *
 *   round to the nearest whole unit of the target currency.
 *
 * Rationale: USD prices use 2 decimals; a raw multiplication yields awkward
 * fractional prices (e.g. $49.99 -> CAD 68.49 -> EUR 45.57). Whole units keep
 * converted prices clean and consistent across the catalog, which is the
 * standard approach for cross-border display. This is the DISPLAY/quote
 * rounding; the exact rounding at charge time is a later checkout-phase
 * decision and belongs in the checkout wiring, not here.
 */
export function roundConvertedPrice(value: number): number {
  return Math.round(value);
}

/** Convert a USD price to the target currency, applying roundConvertedPrice. */
export function convertPrice(usdPrice: number, rate: number): number {
  return roundConvertedPrice(usdPrice * rate);
}