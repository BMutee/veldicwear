import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CURRENCY_COOKIE,
  CURRENCY_SOURCE_COOKIE,
  CURRENCY_SOURCE_IP,
  CURRENCY_SOURCE_MANUAL,
  countryToCurrency,
  isSupportedCurrency,
} from "@/lib/currency-map";

/**
 * Edge middleware (proxy — Next.js 16's middleware entry).
 *
 * AUDIT / MECHANISM (Vercel geolocation):
 * Vercel injects the `x-vercel-ip-country` request header on every request to its
 * Edge AND Node functions, and exposes the same value via the Edge `request.geo`
 * object. We read the header directly (with `request.geo?.country` as a fallback)
 * because the header is both the documented Vercel surface AND easily simulated in
 * local dev / tests (a plain custom header) — whereas `request.geo` exists only on
 * the Vercel Edge runtime.
 *
 * IMPORTANT — deployment reality:
 *   - In Vercel's actual deployment the header is injected automatically, so
 *     country -> currency detection just works.
 *   - On localhost dev (and any non-Vercel host) the header is ABSENT, so this
 *     falls back to the USD default (same default as the underlying picker).
 *     The header can still be simulated explicitly for testing.
 *
 * CURRENCY RESOLUTION (first-request sticky, manual override wins forever):
 *   1. If a recognised `currency` cookie exists, that value is used verbatim and
 *      is NEVER overwritten by IP detection — this is what lets a manual choice
 *      persist across visits from any country.
 *   2. Otherwise (FIRST visit, no cookie) we IP-detect: map country -> currency,
 *      and set `currency` + `currency_source=ip` cookies so it sticks for
 *      subsequent requests.
 *   A manual selection (via POST /api/currency) writes `currency_source=manual`;
 *   once present, IP detection is permanently bypassed (step 1 always wins).
 *   The resolved value + its origin are forwarded as request headers for SSR.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);

  // Keep the existing x-pathname behaviour for the root layout.
  requestHeaders.set("x-pathname", pathname);

  // ── Currency resolution ──
  // Vercel injects x-vercel-ip-country on every request (Edge AND Node); we
  // read the header directly because it is the documented surface and is also
  // simulatable in local dev / tests. (request.geo exposes the same value on
  // the Edge runtime, but the header is sufficient and type-safe.)
  const geoCountry = request.headers.get("x-vercel-ip-country");

  const existingCurrency = request.cookies.get(CURRENCY_COOKIE)?.value;
  const existingSource = request.cookies.get(CURRENCY_SOURCE_COOKIE)?.value ||
    CURRENCY_SOURCE_MANUAL; // if a currency cookie exists but no source, assume manual-cowboy-safe

  let currency: string;
  let source: string;
  let shouldSetCookie = false;

  if (existingCurrency && isSupportedCurrency(existingCurrency)) {
    // A (recognised) cookie is present — user/visitor preference wins.
    currency = existingCurrency;
    source =
      existingSource === CURRENCY_SOURCE_MANUAL ? CURRENCY_SOURCE_MANUAL : CURRENCY_SOURCE_IP;
  } else {
    // First visit: IP-detect, or fall back to USD.
    currency = countryToCurrency(geoCountry);
    source = CURRENCY_SOURCE_IP;
    shouldSetCookie = true;
  }

  requestHeaders.set("x-viewer-currency", currency);
  requestHeaders.set("x-viewer-currency-source", source);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (shouldSetCookie) {
    const cookieOptions = {
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    };
    response.cookies.set(CURRENCY_COOKIE, currency, cookieOptions);
    response.cookies.set(CURRENCY_SOURCE_COOKIE, source, cookieOptions);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, api routes, and _next
    "/((?!api|_next/static|_next/image|favicon.ico|products/.*).*)",
  ],
};
