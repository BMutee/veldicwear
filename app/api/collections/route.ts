import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const collections = await prisma.collection.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(collections);
}