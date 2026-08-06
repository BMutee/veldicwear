import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

type ProductVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  costPrice: number | null;
  productId: string;
  cjVariantId: string | null;
};

type WishlistItemWithProduct = {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    sku: string | null;
    barcode: string | null;
    trackInventory: boolean;
    sellOutOfStock: boolean;
    weight: number | null;
    weightUnit: string | null;
    featured: boolean;
    active: boolean;
    createdAt: Date;
    collectionId: string | null;
    variants: ProductVariant[];
  };
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const items: WishlistItemWithProduct[] = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { variants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const products = items.map((item) => item.product);
    const wishlistedIds = items.map((item) => item.productId);

    return NextResponse.json({ products, wishlistedIds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wishlist." },
      { status: 500 },
    );
  }
}