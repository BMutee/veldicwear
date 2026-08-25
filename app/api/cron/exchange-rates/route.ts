import { NextResponse } from "next/server";
import { refreshExchangeRates } from "@/lib/exchange-rates";

/**
 * Cron endpoint that refreshes live USD->CAD / USD->EUR exchange rates into the
 * ExchangeRate table. Protected by CRON_SECRET.
 *
 * AUTH: the caller must present CRON_SECRET as EITHER
 *   a) a query param  — ?secret=YOUR_CRON_SECRET  (cron-job.org et al.), or
 *   b) an `Authorization: Bearer ${CRON_SECRET}` header — what Vercel Cron
 *      attaches automatically, so the path in vercel.json needs NO secret.
 *
 * SETUP OPTION A — External cron (recommended, hourly, any host):
 *   Point cron-job.org at this route every hour:
 *     https://yoursite.com/api/cron/exchange-rates?secret=YOUR_CRON_SECRET
 *   ~24 requests/day against a free, no-key endpoint. Matches the existing
 *   cj-stock-sync / cj-tracking-sync cron pattern in this codebase.
 *
 * SETUP OPTION B — Vercel Cron (native, zero external dependency):
 *   The `crons` block in vercel.json calls `GET /api/cron/exchange-rates`.
 *   Vercel auto-sends `Authorization: Bearer $CRON_SECRET`, so no secret is
 *   committed to the repo. Caveat: the Hobby tier caps this at ~1 run/day,
 *   which satisfies the 24h staleness gate but with less refresh buffer than
 *   the hourly schedule (Option A).
 *
 * Both options enjoy the same Cadence logic below; Option A is preferred when
 * hourly-refresh robustness beats zero external dependencies.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // Accept the secret via query param OR Vercel's automatic bearer header.
  const querySecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  const secret = querySecret ?? bearerSecret;

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("CRON_SECRET environment variable is not set. Skipping exchange-rate refresh.");
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server." },
      { status: 500 },
    );
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  try {
    const { rates, fetchedAt } = await refreshExchangeRates();
    console.log(`Cron: exchange rates refreshed at ${fetchedAt.toISOString()}:`, rates);
    return NextResponse.json({
      success: true,
      base: "USD",
      rates,
      fetchedAt: fetchedAt.toISOString(),
    });
  } catch (error) {
    console.error("Cron: exchange-rate refresh failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Exchange-rate refresh failed.",
      },
      { status: 502 },
    );
  }
}
