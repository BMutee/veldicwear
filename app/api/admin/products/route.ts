import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

// Lightweight product catalog for the admin block editors (e.g. the
// FEATURED_PRODUCTS picker). Returns active AND inactive products so the
// picker can flag references that are no longer available on the storefront.
export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}
