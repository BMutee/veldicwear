import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Prisma P2003 is a foreign key constraint violation
    if (err?.code === "P2003" || err?.code === "P2014") {
      // The product has existing OrderItems — prevent deletion, suggest deactivation
      return NextResponse.json(
        {
          error:
            "This product has existing orders and cannot be deleted. " +
            "To remove it from the storefront, set it to Inactive in the edit form instead.",
        },
        { status: 409 }
      );
    }

    console.error("Error deleting product:", err);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}