import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ summary: {} });
    }

    const productIds = idsParam.split(",").filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({ summary: {} });
    }

    const reviews = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const summary: Record<string, { average: number; count: number }> = {};
    for (const r of reviews) {
      summary[r.productId] = {
        average: Math.round((r._avg.rating ?? 0) * 10) / 10,
        count: r._count.rating,
      };
    }

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch review summaries." },
      { status: 500 },
    );
  }
}