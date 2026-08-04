import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { syncAllCjProductStock, syncSingleProductStock } from "@/lib/cj-stock-sync";

/**
 * Admin-triggered endpoint to sync CJ stock levels.
 * Protected by requireAdminApi — only authenticated admins can call this.
 *
 * Two modes:
 * - No body: Sync ALL CJ-imported products
 * - { productId: "..." }: Sync a single product
 *
 * Returns a detailed log of what changed (which variants had stock updated).
 */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const productId = body?.productId;

    // Single product sync
    if (productId && typeof productId === "string") {
      const result = await syncSingleProductStock(productId);
      return NextResponse.json({
        success: !result.error,
        result,
      });
    }

    // Sync all CJ products
    const result = await syncAllCjProductStock();

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
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "CJ stock sync failed.",
      },
      { status: 500 }
    );
  }
}