import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { htmlToPlainText } from "@/lib/html-text";

type AdminVariantInput = {
  size: string;
  stock?: number | string | null;
  price?: number | string | null;
  costPrice?: number | string | null;
  /** Display name shown in Admin and on the storefront. */
  color?: string | null;
  /** Original CJ color. Only ever set for CJ imports; never changed by a rename. */
  sourceColor?: string | null;
  /** Stable local id so edits keep the existing row instead of replacing it. */
  id?: string | null;
  /** CJ variant id (vid). Preserved across admin edits so re-syncs keep matching. */
  cjVariantId?: string | null;
  /** CJ variant SKU. Preserved across admin edits. */
  sku?: string | null;
};

type AdminImageInput = {
  color?: string | null;
  url: string;
};

/** A single label change applied to every variant and image of one color. */
type ProductColorRename = {
  from: string;
  to: string;
};

function normalizedColor(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Rename a color across the whole product: every variant row and every
 * color-specific image that currently uses the old label. The original CJ
 * sourceColor is deliberately left untouched so later CJ syncs still match
 * the right variant and do not undo the rename.
 */
function applyColorRenames<T extends { color?: string | null }>(
  entries: T[],
  renames: ProductColorRename[]
): T[] {
  return entries.map((entry) => {
    const current = normalizedColor(entry.color)?.toLowerCase() ?? null;
    const rename = renames.find((r) => normalizedColor(r.from)?.toLowerCase() === current);
    if (!rename || current === null) return entry;
    return { ...entry, color: normalizedColor(rename.to) };
  });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  }

  // ── Server-side validation ──
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
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
  if (body.colorRenames !== undefined && !Array.isArray(body.colorRenames)) {
    errors.push("Color renames must be an array.");
  }
  const renames: ProductColorRename[] = Array.isArray(body.colorRenames)
    ? body.colorRenames
    : [];
  if (renames.some((r) => !r || typeof r !== "object")) {
    errors.push("Color renames must be objects with from and to.");
  } else {
    for (let i = 0; i < renames.length; i++) {
      const rename = renames[i];
      if (!rename.from || typeof rename.from !== "string" || rename.from.trim().length === 0) {
        errors.push("Color rename " + (i + 1) + ": original color is required.");
      }
      if (!rename.to || typeof rename.to !== "string" || rename.to.trim().length === 0) {
        errors.push("Color rename " + (i + 1) + ": new color is required.");
      }
    }
  }
  if (body.images && Array.isArray(body.images)) {
    for (let i = 0; i < body.images.length; i++) {
      const img = body.images[i];
      if (img.color !== null && img.color !== undefined && img.color !== "" && typeof img.color !== "string")
        errors.push("Image " + (i + 1) + ": color must be text.");
      if (img.url === undefined || img.url === null || (typeof img.url === "string" && img.url.trim().length === 0))
        errors.push("Image " + (i + 1) + ": URL is required.");
    }
  }
  if (
    body.sizeChart !== undefined &&
    body.sizeChart !== null &&
    (typeof body.sizeChart !== "object" || Array.isArray(body.sizeChart))
  ) {
    errors.push("Size chart must be an object.");
  }
  const description =
    typeof body.description === "string" ? htmlToPlainText(body.description) : "";
  if (typeof body.description !== "string" || !description) {
    errors.push("Description is required.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // ── Auto-populate main image from first color image if not provided ──
  const mainImage = body.image?.trim() || (body.images?.[0]?.url) || "";

  // ── Per-product size chart (JSON); null falls back to the default chart ──
  const sizeChartJson =
    body.sizeChart && typeof body.sizeChart === "object" && !Array.isArray(body.sizeChart)
      ? (body.sizeChart as Prisma.InputJsonValue)
      : null;

  // ── Compute stock from variant totals ──
  const rawVariants = (body.variants ?? []) as unknown;
  const variants = (Array.isArray(rawVariants) ? rawVariants : []) as AdminVariantInput[];
  const renamedVariants = applyColorRenames(variants, renames);
  const renamedImages = applyColorRenames(
    ((body.images ?? []) as AdminImageInput[]),
    renames
  );
  const totalStock = renamedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  // Renames must not merge two different colors of the same size into one row.
  const variantKeys = renamedVariants.map(
    (v) => `${v.size?.trim() ?? ""}|||${normalizedColor(v.color) ?? ""}`
  );
  const duplicateKeys = variantKeys.filter(
    (key, index) => variantKeys.indexOf(key) !== index
  );
  if (duplicateKeys.length > 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: [
          "Color rename would merge variants with the same size and color. Choose a different color name.",
        ],
      },
      { status: 400 }
    );
  }

  // ── Update product with variant & image replacement ──
  // Sequential top-level statements (NOT an interactive $transaction — those
  // intermittently fail to BEGIN on Neon's pooled connections, and a nested
  // deleteMany+create with the same ids can trip the PK/unique constraint
  // depending on statement ordering). Deletes run first, then the product
  // fields are updated, then fresh variant/image rows are created — with CJ
  // linkage (sourceColor/cjVariantId/sku) and display colors carried over so
  // re-syncs keep matching. Fresh ids are intentional: this replaces the rows.
  try {
    const variantCreates = renamedVariants.map((variant) => ({
      size: variant.size,
      color: normalizedColor(variant.color),
      sourceColor: normalizedColor(variant.sourceColor),
      cjVariantId: normalizedColor(variant.cjVariantId),
      sku: normalizedColor(variant.sku),
      stock: Number(variant.stock) || 0,
      price: Number(variant.price) || 0,
      costPrice: variant.costPrice != null && variant.costPrice !== "" ? Number(variant.costPrice) : null,
    }));
    const imageCreates = renamedImages.map((img) => ({
      color: normalizedColor(img.color),
      url: img.url,
    }));

    await prisma.productVariant.deleteMany({ where: { productId: body.id } });
    await prisma.productImage.deleteMany({ where: { productId: body.id } });

    await prisma.product.update({
      where: { id: body.id },
      data: {
        name: body.name.trim(),
        // Stored as plain text — supplier HTML is converted on the way in.
        description,
        image: mainImage,
        price: Number(body.price),
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
        stock: totalStock,
        sku: body.sku || null,
        barcode: body.barcode || null,
        trackInventory: body.trackInventory ?? true,
        // Always false — products must never sell past zero stock.
        sellOutOfStock: false,
        weight: body.weight ? Number(body.weight) : null,
        weightUnit: body.weightUnit || "kg",
        featured: body.featured ?? false,
        active: body.active ?? true,
        collectionId: body.collectionId || null,
        ...(body.sizeChart !== undefined
          ? { sizeChart: sizeChartJson ?? Prisma.DbNull }
          : {}),
      },
    });

    if (variantCreates.length > 0) {
      await prisma.productVariant.createMany({
        data: variantCreates.map((v) => ({ ...v, productId: body.id as string })),
      });
    }
    if (imageCreates.length > 0) {
      await prisma.productImage.createMany({
        data: imageCreates.map((img) => ({ ...img, productId: body.id as string })),
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: body.id },
      include: { variants: true, images: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found. It may have been deleted." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2002") {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: [
            "Two variants have the same size and color. Merge or rename the duplicates, then save again.",
          ],
        },
        { status: 400 }
      );
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Product not found. It may have been deleted." }, { status: 404 });
    }
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Failed to update product. Please try again." }, { status: 500 });
  }
}
