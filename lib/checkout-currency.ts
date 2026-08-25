import { getConversionRate } from "@/lib/exchange-rates";
import { convertPrice } from "@/lib/exchange-rates";
import {
  DEFAULT_CURRENCY,
  STALE_RATE_FALLBACK_NOTICE,
  type SupportedCurrency,
} from "@/lib/currency-map";

/**
 * Resolve HOW a checkout should actually charge, given the visitor's DISPLAY
 * currency (from the `currency` cookie set by proxy.ts / the picker):
 *
 *   USD -> charge USD, rate 1.
 *   CAD -> charge CAD at the live rate — UNLESS the rate is stale/missing,
 *          in which case fall back to charging USD (never block checkout)
 *          with a clear notice.
 *   EUR -> ALWAYS charge USD. EUR is display-only (legal/tax decision
 *          pending); the customer browsed EUR estimates, checkout converts
 *          back to USD for the actual charge.
 *
 * The rate returned here is THE rate that gets locked into the Stripe session
 * metadata and later into Order.currency / Order.exchangeRateUsed. It is never
 * recomputed afterwards.
 */
export interface CheckoutCurrencyPlan {
  /** What the visitor was browsing in. */
  displayCurrency: SupportedCurrency;
  /** What Stripe will actually charge in. */
  chargeCurrency: "USD" | "CAD";
  /** Locked USD->chargeCurrency multiplier (1 when charging USD). */
  rate: number;
  /** True when CAD was requested but a stale rate forced a USD charge. */
  fallbackToUsd: boolean;
  /** Post-checkout notice for the customer (stale-rate fallback only). */
  notice: string | null;
}

export async function resolveCheckoutCurrencyPlan(
  displayCurrency: string | null | undefined,
): Promise<CheckoutCurrencyPlan> {
  const display = (displayCurrency ?? DEFAULT_CURRENCY).toUpperCase();

  if (display === "CAD") {
    const cadRate = await getConversionRate("CAD");
    if (cadRate !== null && Number.isFinite(cadRate) && cadRate > 0) {
      return {
        displayCurrency: "CAD",
        chargeCurrency: "CAD",
        rate: cadRate,
        fallbackToUsd: false,
        notice: null,
      };
    }
    // Stale or missing CAD rate — graceful fallback to USD, never block.
    return {
      displayCurrency: "CAD",
      chargeCurrency: "USD",
      rate: 1,
      fallbackToUsd: true,
      notice: STALE_RATE_FALLBACK_NOTICE,
    };
  }

  // USD and EUR (display-only) both charge USD.
  return {
    displayCurrency: display === "EUR" ? "EUR" : "USD",
    chargeCurrency: "USD",
    rate: 1,
    fallbackToUsd: false,
    notice: null,
  };
}

/**
 * Convert a USD amount into the charge currency's STRIPE unit amount (cents),
 * using the LOCKED rate. Matches what the customer saw:
 *   - USD charges keep exact cents ($49.99 -> 4999).
 *   - CAD/EUR-style display uses whole-unit rounding via convertPrice(), so
 *     CAD charges use round(usd * rate) * 100 — identical to the displayed
 *     price, so displayed == charged.
 */
export function toStripeUnitAmount(
  usdPrice: number,
  chargeCurrency: "USD" | "CAD",
  rate: number,
): number {
  if (chargeCurrency === "USD") return Math.round(usdPrice * 100);
  // convertPrice() rounds to whole units of the target currency (the same
  // shared helper used everywhere a converted price is displayed).
  return convertPrice(usdPrice, rate) * 100;
}
