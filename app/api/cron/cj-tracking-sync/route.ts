import { NextResponse } from "next/server";
import { checkAllCjTracking } from "@/lib/cj-tracking";

/**
 * Cron endpoint to check CJ tracking for all pending orders.
 * Protected by CRON_SECRET environment variable — the cron job must pass
 * ?secret=YOUR_CRON_SECRET as a query parameter.
 *
 * Set up cron-job.org (or similar) to call this endpoint every hour:
 *   https://yoursite.com/api/cron/cj-tracking-sync?secret=YOUR_CRON_SECRET
 *
 * The CRON_SECRET should be a long, random, securely-generated value.
 * Generate one with: openssl rand -hex 32
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error(
      "CRON_SECRET environment variable is not set. Skipping CJ tracking sync."
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
    const result = await checkAllCjTracking();

    console.log(
      `Cron: CJ tracking sync completed. Total: ${result.total}, Updated: ${result.updated}, Not yet shipped: ${result.notYetShipped}, Errors: ${result.errors}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: result.total,
        updated: result.updated,
        alreadyShipped: result.alreadyShipped,
        notYetShipped: result.notYetShipped,
        errors: result.errors,
      },
      results: result.results,
    });
  } catch (error) {
    console.error("Cron: CJ tracking sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "CJ tracking sync failed.",
      },
      { status: 500 }
    );
  }
}