import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ProductWithVariants = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  image: string;
  stock: number;
  variants: Array<{
    id: string;
    size: string;
    color: string | null;
    stock: number;
    price: number | null;
    costPrice: number | null;
    productId: string;
    cjVariantId: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { id: string; size: string }[] = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ prices: [] });
    }

    const productIds = [...new Set(items.map((item) => item.id))];
    const dbProducts: ProductWithVariants[] = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const prices: Record<string, { price: number; variantStock: number }> = {};

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) continue;

      const variant = dbProduct.variants.find((v) => v.size === item.size);
      if (!variant) continue;

      prices[`${item.id}:${item.size}`] = {
        price: variant.price ?? 0,
        variantStock: variant.stock,
      };
    }

    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prices." },
      { status: 500 },
    );
  }
}