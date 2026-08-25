import { NextResponse } from "next/server";
import {
  CURRENCY_COOKIE,
  CURRENCY_SOURCE_COOKIE,
  CURRENCY_SOURCE_MANUAL,
  isSupportedCurrency,
} from "@/lib/currency-map";

/**
 * Manually set the visitor's currency (called by the navbar dropdown).
 *
 * CRITICAL contract (see proxy.ts): writing `currency_source=manual` here makes
 * this a PERMANENT, user-chosen preference. Once this cookie is present, IP
 * auto-detection is permanently bypassed — proxy.ts honors any existing
 * recognised `currency` cookie and never overwrites it. This is what lets a
 * manually-chosen currency survive subsequent visits from any country.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const currency = (body as { currency?: string } | null)?.currency;
  if (!currency || !isSupportedCurrency(currency)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  const response = NextResponse.json({ currency });
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  };
  response.cookies.set(CURRENCY_COOKIE, currency, cookieOptions);
  response.cookies.set(CURRENCY_SOURCE_COOKIE, CURRENCY_SOURCE_MANUAL, cookieOptions);

  return response;
}