/**
 * Pure, EDGE-SAFE currency helpers — no DB, no Node-only imports.
 *
 * Importable from proxy.ts (Edge runtime), server components, and route
 * handlers without pulling Prisma into the Edge bundle.
 *
 * Currency is resolved exactly once per request in proxy.ts (IP auto-detect or
 * existing cookie), then forwarded to the request via the x-viewer-currency /
 * x-viewer-currency-source headers so the server layout can render prices and
 * drive the navbar indicator consistently.
 */

export const SUPPORTED_CURRENCIES = ["USD", "CAD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "USD";

/** ISO 3166-1 alpha-2 countries that use the Euro (27 EU member states). */
const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

/**
 * Map a viewer's country to a storefront currency.
 *   US -> USD, CA -> CAD, any EU member -> EUR, everything else -> USD.
 * A missing/unknown country also resolves to USD (the base default).
 */
export function countryToCurrency(country?: string | null): SupportedCurrency {
  if (!country) return DEFAULT_CURRENCY;
  const c = country.toUpperCase();
  if (c === "US") return "USD";
  if (c === "CA") return "CAD";
  if (EU_COUNTRY_CODES.has(c)) return "EUR";
  return DEFAULT_CURRENCY;
}

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  name: string;
}

/** Display metadata for the picker + any future price formatting. */
export const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", label: "USD", name: "US Dollar" },
  CAD: { code: "CAD", symbol: "C$", label: "CAD", name: "Canadian Dollar" },
  EUR: { code: "EUR", symbol: "€", label: "EUR", name: "Euro" },
};

/** Currency code cookie. */
export const CURRENCY_COOKIE = "currency";
/** Origin marker cookie: "ip" (auto-set) vs "manual" (user-chosen). */
export const CURRENCY_SOURCE_COOKIE = "currency_source";
export const CURRENCY_SOURCE_IP = "ip";
export const CURRENCY_SOURCE_MANUAL = "manual";

export type CurrencySource = "ip" | "manual";

/**
 * Checkout disclaimer copy, BRANCHED PER CURRENCY (checkout phase):
 *
 *   USD — no disclaimer. Base charge currency.
 *   CAD — no disclaimer: CAD is now a REAL charge currency; prices shown
 *         are converted with the same locked rate used at checkout, so the
 *         displayed amount IS the charged amount.
 *   EUR — display-only for now (legal/tax decision pending). The customer
 *         browses EUR estimates but checkout always completes in USD.
 */
export const EUR_ESTIMATE_DISCLAIMER =
  "EUR pricing is an estimate — checkout will complete in USD.";

/** Shown only when a stale CAD rate forces a USD charge at checkout time. */
export const STALE_RATE_FALLBACK_NOTICE =
  "CAD pricing is temporarily unavailable — your checkout will complete in USD.";

/**
 * Per-currency disclaimer for the picker / checkout UI.
 * Returns null when no disclaimer applies (USD, and CAD as a real charge
 * currency).
 */
export function disclaimerForCurrency(
  currency: SupportedCurrency,
): string | null {
  if (currency === "EUR") return EUR_ESTIMATE_DISCLAIMER;
  return null;
}