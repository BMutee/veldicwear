import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { syncProductVariantsByPid } from "@/lib/cj-import";

/**
 * Backfill CJ variant IDs for all existing products that were imported from CJ
 * but don't have variant records with cjVariantId set yet.
 *
 * Scans all products whose id is a numeric string (CJ pid format) and runs the
 * SHARED syncVariants() implementation from lib/cj-import.ts (the same code
 * path used by importCJProduct) so the two paths can never drift apart.
 */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    // Find all products that look like CJ imports (numeric id)
    const cjProducts = await prisma.product.findMany({
      where: {
        id: {
          // CJ product IDs are numeric strings
          not: undefined,
        },
      },
      select: { id: true, name: true },
    });

    // Filter to only numeric IDs (CJ products)
    const cjPids = cjProducts.filter((p: { id: string; name: string }) => /^\d+$/.test(p.id));

    const results: Array<{
      pid: string;
      name: string;
      variantsSynced: number;
      imagesSynced: number;
      error?: string;
    }> = [];

    for (const product of cjPids) {
      try {
        const synced = await syncProductVariantsByPid(product.id);

        results.push({
          pid: product.id,
          name: product.name,
          variantsSynced: synced?.variantsSynced ?? 0,
          imagesSynced: synced?.imagesSynced ?? 0,
          ...(synced ? {} : { error: "Product not found locally" }),
        });
      } catch (err) {
        results.push({
          pid: product.id,
          name: product.name,
          variantsSynced: 0,
          imagesSynced: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.variantsSynced, 0);
    const failed = results.filter((r) => r.error).length;

    return NextResponse.json({
      total: results.length,
      totalVariantsSynced: totalSynced,
      failed,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync CJ variants." },
      { status: 500 }
    );
  }
}