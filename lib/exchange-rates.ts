import { prisma } from "@/lib/prisma";
import type { Currency } from "@prisma/client";
// Pure, DB-free conversion helpers (edge/browser-safe). Re-exported below so
// existing `import ... from "@/lib/exchange-rates"` call sites keep working.
import {
  BASE_CURRENCY,
  SUPPORTED_CONVERSION_CURRENCIES,
  STALE_RATE_THRESHOLD_MS,
  type SupportedCurrency,
  convertPrice,
  roundConvertedPrice,
} from "@/lib/currency-convert";

export {
  BASE_CURRENCY,
  STALE_RATE_THRESHOLD_MS,
  SUPPORTED_CONVERSION_CURRENCIES,
  type SupportedCurrency,
  convertPrice,
  roundConvertedPrice,
} from "@/lib/currency-convert";

/**
 * Multi-currency rate infrastructure (data model phase only).
 *
 * Base currency is USD. Product prices are stored in USD and stay in USD —
 * nothing is rewritten. CAD and EUR prices are DERIVED at render time via
 * `convertPrice(usdPrice, rate)` using a rate from the ExchangeRate table.
 *
 * RATE SOURCE
 * -----------
 * Frankfurter (https://api.frankfurter.dev) — ECB reference rates.
 *   - Free, no API key, no signup, open licence.
 *   - The European Central Bank publishes one reference rate per business day
 *     (~16:00 CET) for EUR/USD and CAD/USD; Frankfurter proxies it.
 *   - Perfect fit for a storefront display conversion: rates move ~1x/day and
 *     nobody needs sub-minute FX precision on a product grid.
 *   - Override the endpoint with EXCHANGE_RATES_API_URL if you ever swap
 *     providers (e.g. a paid intraday feed).
 *   - If truly live intraday rates are ever required, the standard paid
 *     sources are Open Exchange Rates, CurrencyAPI or Exchangerate-API
 *     (all require an API key) — swap the fetch below, nothing else changes.
 *
 * FETCH CADENCE & WHERE IT RUNS
 * -----------------------------
 * Recommended: fetch HOURLY. The source data only changes ~once per day, so
 * an hourly cron effectively refreshes the cached copy every time the ECB
 * publishes, while keeping a healthy buffer under the 24h staleness gate if a
 * few fetches fail. Cost: ~24 hits/day against a free endpoint.
 *
 * The repo deploys on VERCEL today (DEPLOYMENT.md — Netlify was removed), but
 * the mechanism is host-agnostic:
 *   a) External cron (recommended, matches this repo's existing CJ-sync
 *      pattern): cron-job.org (or GitHub Actions / cronitor) hits
 *      `GET /api/cron/exchange-rates?secret=CRON_SECRET` hourly. Works on any
 *      host, arbitrary cadence, zero cost. Route is secret-guarded.
 *   b) Vercel Cron (native alternative): add a `crons` entry to vercel.json
 *      hitting the same route. No external service, but the Vercel Hobby tier
 *      is limited to ~1 run/day (not hourly); hourly needs Pro.
 *   c) Netlify Scheduled Functions (if ever migrated back): `schedule`
 *      export on a serverless function — native hourly runs, but adds a
 *      Netlify-specific file.
 * Tradeoff summary: (a) is zero-cost, host-agnostic, and already proven in
 * this codebase; (b) is the only zero-external-dependency option; (c) only
 * matters if the platform changes back to Netlify.
 *
 * STALENESS
 * ---------
 * getConversionRate() NEVER serves a rate older than STALE_RATE_THRESHOLD_MS:
 * it returns null and the caller decides the fallback (e.g. show USD). The
 * threshold is a hard gate — a stale rate is treated exactly like no rate.
 */

// Read lazily (per call) so tests and runtime env changes are honored,
// mirroring lib/prisma.ts's lazy-construction pattern.
// NOTE: STALE_RATE_THRESHOLD_MS / SUPPORTED_CONVERSION_CURRENCIES /
// BASE_CURRENCY / SupportedCurrency / convertPrice / roundConvertedPrice live
// in lib/currency-convert.ts (edge/browser-safe) and are re-exported above.
function ratesApiUrl(): string {
  return process.env.EXCHANGE_RATES_API_URL ?? "https://api.frankfurter.dev/v1/latest";
}

const isSupported = (value: string): value is SupportedCurrency =>
  (SUPPORTED_CONVERSION_CURRENCIES as readonly string[]).includes(value);

/**
 * Pull current USD->CAD and USD->EUR rates from the live API.
 * Returns the raw rates as JS numbers; throws on any non-2xx/parse/range error
 * so callers never persist garbage.
 */
export async function fetchUsdRates(): Promise<Record<SupportedCurrency, number>> {
  const url = new URL(ratesApiUrl());
  url.searchParams.set("base", "USD");
  url.searchParams.set("symbols", SUPPORTED_CONVERSION_CURRENCIES.join(","));

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(
      `Exchange-rate API responded ${res.status} ${res.statusText} for ${url.toString()}`,
    );
  }

  const data = (await res.json()) as { rates?: Record<string, unknown> };
  if (!data.rates || typeof data.rates !== "object") {
    throw new Error("Exchange-rate API returned an unexpected payload (no `rates`).");
  }

  const rates = {} as Record<SupportedCurrency, number>;
  for (const currency of SUPPORTED_CONVERSION_CURRENCIES) {
    const raw = data.rates[currency];
    const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Exchange-rate API returned an invalid rate for ${currency}: ${String(raw)}`);
    }
    rates[currency] = value;
  }
  return rates;
}

/**
 * Fetch live rates and upsert them into the ExchangeRate table.
 * One row per currency, stamped with a single `fetchedAt` so both rows share
 * the same freshness timestamp. Safe to run from the cron route or manually.
 */
export async function refreshExchangeRates(): Promise<{
  rates: Record<SupportedCurrency, number>;
  fetchedAt: Date;
}> {
  const rates = await fetchUsdRates();
  const fetchedAt = new Date();

  // Two independent upserts — deliberately NOT wrapped in $transaction.
  // On Vercel serverless every invocation is a cold start, and array
  // transactions over Neon's pooled connections intermittently fail to BEGIN
  // (Prisma P2028). Each upsert is atomic on its own row, and a partial
  // failure is safe by design: the affected currency keeps its previous
  // fetchedAt, the 24h staleness gate decides whether it's still servable,
  // and the next cron run self-heals. Atomicity across the two rows is
  // unnecessary because getConversionRate() is per-currency.
  for (const currency of SUPPORTED_CONVERSION_CURRENCIES) {
    await prisma.exchangeRate.upsert({
      where: { currency },
      update: { rate: rates[currency], fetchedAt },
      create: { currency, rate: rates[currency], fetchedAt },
    });
  }

  return { rates, fetchedAt };
}

/**
 * Server-side rate lookup: returns the cached rate ONLY if fresh.
 *   - USD        -> 1 (base currency; never stale, no DB read).
 *   - CAD / EUR  -> DB row rate if fetchedAt is within STALE_RATE_THRESHOLD_MS.
 *   - stale / missing -> null (never silently serves a stale rate).
 *   - any other currency string -> throws (programmer error, not a data state).
 */
export async function getConversionRate(currency: Currency): Promise<number | null> {
  if (currency === BASE_CURRENCY) return 1;
  if (!isSupported(currency)) {
    throw new Error(`getConversionRate: unsupported currency "${currency}".`);
  }

  const row = await prisma.exchangeRate.findUnique({ where: { currency } });
  if (!row) return null;

  if (Date.now() - row.fetchedAt.getTime() > STALE_RATE_THRESHOLD_MS) {
    return null; // stale — treat as no rate; caller decides the fallback.
  }
  return Number(row.rate);
}
// NOTE: roundConvertedPrice() and convertPrice() moved to
// lib/currency-convert.ts (edge/browser-safe) and are re-exported above.

