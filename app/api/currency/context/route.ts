import { NextRequest, NextResponse } from "next/server";
import { CURRENCY_COOKIE } from "@/lib/currency-map";
import { resolveCheckoutCurrencyPlan } from "@/lib/checkout-currency";
import { getConversionRate } from "@/lib/exchange-rates";

/**
 * GET /api/currency/context
 *
 * Tells the client how the current cart/checkout should DISPLAY and CHARGE:
 *   - displayCurrency: what the visitor is browsing in (cookie).
 *   - chargeCurrency : USD | CAD — what checkout would actually charge
 *                      (EUR display-only -> USD).
 *   - rate           : locked-style USD->charge multiplier usable right now;
 *                      null means stale/unavailable -> client falls back to
 *                      USD display.
 */
export async function GET(request: NextRequest) {
  const display =
    request.cookies.get(CURRENCY_COOKIE)?.value ?? "USD";
  const plan = await resolveCheckoutCurrencyPlan(display);

  return NextResponse.json(
    {
      displayCurrency: plan.displayCurrency,
      chargeCurrency: plan.chargeCurrency,
      // Rate used for DISPLAY conversion in the visitor's browsing currency:
      //   USD -> 1, CAD -> live CAD rate (or null if stale), EUR -> EUR rate
      //   (display-only estimates; checkout itself still charges USD).
      rate: await (async () => {
        if (plan.displayCurrency === "USD") return 1;
        const cur = plan.displayCurrency === "CAD" ? "CAD" : "EUR";
        return getConversionRate(cur);
      })(),
      fallbackToUsd: plan.fallbackToUsd,
      notice: plan.notice,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
