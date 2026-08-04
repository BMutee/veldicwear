import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const collections = await prisma.collection.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();

  // ── Validation ──
  const errors: string[] = [];
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
  }
  if (!body.slug || typeof body.slug !== "string" || body.slug.trim().length === 0) {
    errors.push("Slug is required.");
  } else if (!/^[a-z0-9-]+$/.test(body.slug)) {
    errors.push("Slug can only contain lowercase letters, numbers, and hyphens.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // Check duplicate slug
  const existing = await prisma.collection.findUnique({ where: { slug: body.slug.trim() } });
  if (existing) {
    return NextResponse.json({ error: `A collection with slug "${body.slug}" already exists.` }, { status: 409 });
  }

  const collection = await prisma.collection.create({
    data: {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description?.trim() || null,
      image: body.image?.trim() || null,
    },
  });

  return NextResponse.json(collection, { status: 201 });
}