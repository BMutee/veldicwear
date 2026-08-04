import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const items = await prisma.wishlistItem.findMany({
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