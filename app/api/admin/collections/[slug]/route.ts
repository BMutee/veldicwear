import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: { variants: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json(collection);
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { slug } = await params;
  const body = await request.json();

  // ── Validation ──
  const errors: string[] = [];
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
  }

  const newSlug = body.slug?.trim() || slug;
  if (!/^[a-z0-9-]+$/.test(newSlug)) {
    errors.push("Slug can only contain lowercase letters, numbers, and hyphens.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // Check duplicate slug if changed
  if (newSlug !== slug) {
    const existing = await prisma.collection.findUnique({ where: { slug: newSlug } });
    if (existing) {
      return NextResponse.json({ error: `A collection with slug "${newSlug}" already exists.` }, { status: 409 });
    }
  }

  // Update collection fields + product assignments
  const productIds: string[] = body.productIds || [];

  const collection = await prisma.collection.update({
    where: { slug },
    data: {
      name: body.name.trim(),
      slug: newSlug,
      description: body.description?.trim() || null,
      image: body.image?.trim() || null,
      products: {
        set: productIds.map((id: string) => ({ id })),
      },
    },
    include: {
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json(collection);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { slug } = await params;

  // First, disconnect all products (this preserves the products themselves)
  await prisma.collection.update({
    where: { slug },
    data: {
      products: { set: [] },
    },
  });

  // Then delete the collection
  // Products remain untouched — the FK defaults to Restrict but we disconnected first
  await prisma.collection.delete({
    where: { slug },
  });

  return NextResponse.json({ ok: true });
}