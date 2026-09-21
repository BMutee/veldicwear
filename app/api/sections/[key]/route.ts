import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Public: get a single section by key
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  try {
    const section = await prisma.siteSection.findUnique({
      where: { key },
    });

    if (!section || !section.published) {
      return NextResponse.json(null);
    }

    return NextResponse.json(JSON.parse(section.content ?? ""));
  } catch {
    return NextResponse.json(null);
  }
}