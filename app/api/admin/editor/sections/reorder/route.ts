import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { NextRequest, NextResponse } from "next/server";

// Theme-editor reorder: persists the new homepage section order. Mirrors the
// Shopify editor saving the JSON template's "order" array — each section id
// arrives in display order and gets a spaced position (10, 20, 30, ...) so
// future insertions don't require renumbering every row.

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "ids must be a non-empty array of section ids" }, { status: 400 });
    }

    await prisma.$transaction(
      (ids as string[]).map((id, index) =>
        prisma.siteSection.update({
          where: { id },
          data: { position: (index + 1) * 10 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder sections:", error);
    return NextResponse.json({ error: "Failed to reorder sections" }, { status: 500 });
  }
}
