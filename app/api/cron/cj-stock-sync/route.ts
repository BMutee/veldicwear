import { NextResponse } from "next/server";
import { syncAllCjProductStock } from "@/lib/cj-stock-sync";

/**
 * Cron endpoint to sync CJ stock levels for all imported products.
 * Protected by CRON_SECRET environment variable — the cron job must pass
 * ?secret=YOUR_CRON_SECRET as a query parameter.
 *
 * Set up cron-job.org (or similar) to call this endpoint every 6 hours:
 *   https://yoursite.com/api/cron/cj-stock-sync?secret=YOUR_CRON_SECRET
 *
 * Recommended frequency: every 6 hours (4 times per day).
 * - CJ stock doesn't change every minute
 * - Too frequent wastes API calls / risks rate limits
 * - Too infrequent risks overselling out-of-stock items
 * - 6 hours balances both concerns
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error(
      "CRON_SECRET environment variable is not set. Skipping CJ stock sync."
    );
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server." },
      { status: 500 }
    );
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  try {
    const result = await syncAllCjProductStock();

    console.log(
      `Cron: CJ stock sync completed. Total: ${result.total}, Updated: ${result.updated}, Unchanged: ${result.unchanged}, Errors: ${result.errors}, Variants updated: ${result.totalVariantsUpdated}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: result.total,
        updated: result.updated,
        unchanged: result.unchanged,
        errors: result.errors,
        totalVariantsUpdated: result.totalVariantsUpdated,
      },
      results: result.results,
    });
  } catch (error) {
    console.error("Cron: CJ stock sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "CJ stock sync failed.",
      },
      { status: 500 }
    );
  }
}