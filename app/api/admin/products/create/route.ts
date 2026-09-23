import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

type AdminVariantInput = {
  size: string;
  stock?: number | string | null;
  price?: number | string | null;
  costPrice?: number | string | null;
};

type AdminImageInput = {
  color: string;
  url: string;
};

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();

  // ── Server-side validation ──
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
  }
  if (!body.description || typeof body.description !== "string") {
    errors.push("Description is required.");
  }
  if (body.price === undefined || body.price === null || isNaN(Number(body.price))) {
    errors.push("Price is required and must be a number.");
  }
  if (Number(body.price) < 0) errors.push("Price cannot be negative.");
  if (body.compareAtPrice !== null && body.compareAtPrice !== undefined && body.compareAtPrice !== "") {
    if (isNaN(Number(body.compareAtPrice))) errors.push("Compare-at price must be a number.");
    else if (Number(body.compareAtPrice) < 0) errors.push("Compare-at price cannot be negative.");
  }
  if (body.stock !== undefined && body.stock !== null && body.stock !== "") {
    if (isNaN(Number(body.stock))) errors.push("Stock must be a number.");
    else if (Number(body.stock) < 0) errors.push("Stock cannot be negative.");
  }
  if (body.weight !== null && body.weight !== undefined && body.weight !== "") {
    if (isNaN(Number(body.weight))) errors.push("Weight must be a number.");
    else if (Number(body.weight) < 0) errors.push("Weight cannot be negative.");
  }
  if (body.variants && Array.isArray(body.variants)) {
    for (let i = 0; i < body.variants.length; i++) {
      const v = body.variants[i];
      if (!v.size) errors.push("Variant " + (i + 1) + ": size is required.");
      if (v.stock !== undefined && (isNaN(Number(v.stock)) || Number(v.stock) < 0))
        errors.push("Variant " + (i + 1) + ' ("' + (v.size || "?") + '"): stock cannot be negative.');
      if (v.price !== undefined && (isNaN(Number(v.price)) || Number(v.price) < 0))
        errors.push("Variant " + (i + 1) + ' ("' + (v.size || "?") + '"): price cannot be negative.');
      if (v.costPrice !== undefined && v.costPrice !== null && v.costPrice !== "" && (isNaN(Number(v.costPrice)) || Number(v.costPrice) < 0))
        errors.push("Variant " + (i + 1) + ' ("' + (v.size || "?") + '"): cost price cannot be negative.');
    }
  }
  if (body.images && Array.isArray(body.images)) {
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      if (!img.color) errors.push("Image " + (i + 1) + ": color is required.");
      if (!img.url) errors.push("Image " + (i + 1) + ": URL is required.");
    }
  }
  if (
    body.sizeChart !== undefined &&
    body.sizeChart !== null &&
    (typeof body.sizeChart !== "object" || Array.isArray(body.sizeChart))
  ) {
    errors.push("Size chart must be an object.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // ── Compute stock from variant totals ──
  const rawVariants = (body.variants ?? []) as unknown;
  const variants = (Array.isArray(rawVariants) ? rawVariants : []) as AdminVariantInput[];
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  // ── Auto-populate main image from first color image if not provided ──
  const mainImage = body.image?.trim() || (body.images?.[0]?.url) || "";

  // ── Per-product size chart (JSON); null falls back to the default chart ──
  const sizeChartJson =
    body.sizeChart && typeof body.sizeChart === "object" && !Array.isArray(body.sizeChart)
      ? (body.sizeChart as Prisma.InputJsonValue)
      : null;

  // ── Create product ──
  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      description: body.description,
      image: mainImage,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      stock: totalStock,
      sku: body.sku || null,
      barcode: body.barcode || null,
      trackInventory: body.trackInventory ?? true,
      sellOutOfStock: body.sellOutOfStock ?? false,
      weight: body.weight ? Number(body.weight) : null,
      weightUnit: body.weightUnit || "kg",
      featured: body.featured ?? false,
      active: body.active ?? true,
      collectionId: body.collectionId || null,
      ...(body.sizeChart !== undefined
        ? { sizeChart: sizeChartJson ?? Prisma.DbNull }
        : {}),
      variants: {
        create: ((body.variants ?? []) as AdminVariantInput[]).map((variant) => ({
          size: variant.size,
          stock: Number(variant.stock) || 0,
          price: Number(variant.price) || 0,
          costPrice: variant.costPrice != null && variant.costPrice !== "" ? Number(variant.costPrice) : null,
        })),
      },
      images: {
        create: ((body.images ?? []) as AdminImageInput[]).map((img) => ({
          color: img.color,
          url: img.url,
        })),
      },
    },
    include: {
      variants: true,
      images: true,
    },
  });

  return NextResponse.json(product);
}