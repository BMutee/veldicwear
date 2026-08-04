import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: typeof reviews[number]) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      average: Math.round(avg * 10) / 10,
      count: reviews.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch reviews." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { productId, rating, comment } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    if (!comment?.trim() || comment.trim().length < 5) {
      return NextResponse.json({ error: "Comment must be at least 5 characters." }, { status: 400 });
    }

    // Check for existing review — unique constraint at DB level too
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: { userId: session.user.id, productId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating: ratingNum,
        comment: comment.trim(),
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit review." },
      { status: 500 },
    );
  }
}