import { NextResponse } from "next/server";
import { refreshExchangeRates } from "@/lib/exchange-rates";

/**
 * Cron endpoint to refresh live USD->CAD / USD->EUR exchange rates into the
 * ExchangeRate table. Protected by CRON_SECRET — the cron job must pass
 * ?secret=YOUR_CRON_SECRET as a query parameter.
 *
 * Set up cron-job.org (or similar) to call this endpoint every hour:
 *   https://yoursite.com/api/cron/exchange-rates?secret=YOUR_CRON_SECRET
 *
 * Recommended frequency: hourly.
 * - The ECB source rate updates ~once per business day, so hourly fetches
 *   refresh the cache promptly while staying well inside the 24h staleness
 *   gate even if several runs fail.
 * - ~24 requests/day against a free, no-key endpoint.
 *
 * Deploy note: this repo currently runs on Vercel (DEPLOYMENT.md). Vercel
 * Cron (vercel.json `crons`) is the zero-external-dependency alternative but
 * is limited to ~1 run/day on the Hobby tier. External cron (cron-job.org)
 * is the existing pattern in this codebase (see cj-stock-sync) and supports
 * arbitrary cadence on any host.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

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
