import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { importCJProduct } from "@/lib/cj-import";

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const pid = body.pid;

    if (!pid || typeof pid !== "string") {
      return NextResponse.json({ error: "Missing CJ product pid." }, { status: 400 });
    }

    const result = await importCJProduct(pid);
    const stockNote = result.stockSynced
      ? " Stock synced."
      : result.stockSyncError
        ? ` Stock sync skipped: ${result.stockSyncError}`
        : " Stock sync pending.";

    return NextResponse.json({
      product: { id: result.productId },
      existed: result.existed,
      variantsSynced: result.variantsSynced,
      imagesSynced: result.imagesSynced,
      stockSynced: result.stockSynced,
      stockSyncError: result.stockSyncError ?? null,
      message: result.existed
        ? `Product already exists. ${result.variantsSynced > 0 ? `Synced ${result.variantsSynced} variant(s).` : "No variants synced."}${result.imagesSynced > 0 ? ` ${result.imagesSynced} image(s) synced.` : ""}${stockNote}`
        : `Product imported. ${result.variantsSynced > 0 ? `Imported ${result.variantsSynced} variant(s).` : "No variants imported."}${result.imagesSynced > 0 ? ` ${result.imagesSynced} image(s) imported.` : ""}${stockNote}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import CJ product." },
      { status: 500 }
    );
  }
}