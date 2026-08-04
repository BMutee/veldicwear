import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { NextRequest, NextResponse } from "next/server";

// GET: list all sections (for admin)
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const sections = await prisma.siteSection.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

// POST: create a new section
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { key, label, content, published } = body;

    if (!key || !label || !content) {
      return NextResponse.json(
        { error: "key, label, and content are required" },
        { status: 400 }
      );
    }

    const section = await prisma.siteSection.create({
      data: {
        key,
        label,
        content: typeof content === "string" ? content : JSON.stringify(content),
        published: published ?? true,
      },
    });

    return NextResponse.json(section);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A section with this key already exists" }, { status: 409 });
    }
    console.error("Failed to create section:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}

// PUT: update a section
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, key, label, content, published } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: any = {};
    if (key !== undefined) data.key = key;
    if (label !== undefined) data.label = label;
    if (content !== undefined) data.content = typeof content === "string" ? content : JSON.stringify(content);
    if (published !== undefined) data.published = published;

    const section = await prisma.siteSection.update({
      where: { id },
      data,
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Failed to update section:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

// DELETE: delete a section
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.siteSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete section:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}