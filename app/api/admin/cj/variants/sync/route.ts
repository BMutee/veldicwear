import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

type CJVariant = {
  vid?: string;
  variantName?: string;
  variantNameEn?: string;
  variantSku?: string;
  variantProperty?: string;
  variantKey?: string;
  variantSellPrice?: number;
  variantImage?: string | string[];
  // CJ sometimes nests image data under these keys
  imgs?: Array<string | Record<string, unknown>>;
  images?: Array<string | Record<string, unknown>>;
};

function extractSizeFromVariant(variant: CJVariant): string | null {
  if (variant.variantProperty) {
    const sizeMatch = variant.variantProperty.match(/Size:\s*([^,]+)/i);
    if (sizeMatch) return sizeMatch[1].trim();
  }
  if (variant.variantName) return variant.variantName.trim();
  if (variant.variantNameEn) return variant.variantNameEn.trim();
  if (variant.variantKey) return variant.variantKey.trim();
  return null;
}

function extractColorFromVariant(variant: CJVariant): string | null {
  if (variant.variantProperty) {
    const colorMatch = variant.variantProperty.match(/(?:Color|Colour):\s*([^,]+)/i);
    if (colorMatch) return colorMatch[1].trim();
  }
  return null;
}

/**
 * Extract image URL strings from a CJ variant's image fields.
 * CJ may return a direct URL (`variantImage`), an array of strings, or an
 * array of objects with `url` / `imageUrl` / `src` / `image` properties.
 */
function extractVariantImageUrls(variant: CJVariant): string[] {
  const urls: string[] = [];

  // Direct string URL
  if (typeof variant.variantImage === "string") {
    const trimmed = variant.variantImage.trim();
    if (trimmed) urls.push(trimmed);
  } else if (Array.isArray(variant.variantImage)) {
    for (const item of variant.variantImage) {
      if (typeof item === "string" && item.trim()) urls.push(item.trim());
    }
  }

  // Nested arrays (strings or objects)
  const nested = [...(variant.imgs ?? []), ...(variant.images ?? [])];
  for (const item of nested) {
    if (typeof item === "string" && item.trim()) {
      urls.push(item.trim());
    } else if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      for (const key of ["url", "imageUrl", "src", "image"]) {
        const val = obj[key];
        if (typeof val === "string" && val.trim()) {
          urls.push(val.trim());
          break;
        }
      }
    }
  }

  return urls;
}

/**
 * Replace the ProductImage records for a given color with the CJ-provided URLs.
 * Returns how many images were stored (0 when no URLs are provided).
 */
async function syncVariantImages(
  productId: string,
  color: string | null,
  imageUrls: string[],
): Promise<number> {
  if (imageUrls.length === 0) return 0;

  // Replace this color's images so stale/removed URLs don't linger.
  await prisma.productImage.deleteMany({
    where: { productId, color: color ?? null },
  });

  await prisma.productImage.createMany({
    data: imageUrls.map((url) => ({
      productId,
      color,
      url,
    })),
  });

  return imageUrls.length;
}

/**
 * Backfill CJ variant IDs for all existing products that were imported from CJ
 * but don't have variant records with cjVariantId set yet.
 *
 * Scans all products whose id is a numeric string (CJ pid format),
 * fetches their variants from CJ, and creates/updates ProductVariant records.
 */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    // Find all products that look like CJ imports (numeric id)
    const cjProducts = await prisma.product.findMany({
      where: {
        id: {
          // CJ product IDs are numeric strings
          not: undefined,
        },
      },
      select: { id: true, name: true },
    });

    // Filter to only numeric IDs (CJ products)
    const cjPids = cjProducts.filter((p) => /^\d+$/.test(p.id));

    const results: Array<{
      pid: string;
      name: string;
      variantsSynced: number;
      imagesSynced: number;
      error?: string;
    }> = [];

    for (const product of cjPids) {
      try {
        let variantsSynced = 0;
        let imagesSynced = 0;

        const variantsResponse = await cjGet<{ list?: CJVariant[] }>(
          "product/sku/getSkuList",
          { pid: product.id }
        );
        const variants = variantsResponse.data?.list ?? [];

        for (const variant of variants) {
          const vid = variant.vid;
          if (!vid) continue;

          const size = extractSizeFromVariant(variant);
          if (!size) continue;

          const color = extractColorFromVariant(variant);

          // Upsert the variant
          // Using findFirst instead of findUnique because Prisma composite unique keys
          // with nullable fields don't support null in the where clause for findUnique.
          const existingVariant = await prisma.productVariant.findFirst({
            where: {
              productId: product.id,
              size,
              color: color ?? null,
            },
          });

          if (existingVariant) {
            await prisma.productVariant.update({
              where: { id: existingVariant.id },
              data: { cjVariantId: vid, price: variant.variantSellPrice ?? existingVariant.price },
            });
          } else {
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                size,
                color,
                cjVariantId: vid,
                stock: 0,
                price: variant.variantSellPrice ?? null,
              },
            });
          }
          variantsSynced++;

          // Sync color-specific images from the CJ variant (if CJ provides them).
          const variantImageUrls = extractVariantImageUrls(variant);
          imagesSynced += await syncVariantImages(product.id, color, variantImageUrls);
        }

        results.push({
          pid: product.id,
          name: product.name,
          variantsSynced,
          imagesSynced,
        });
      } catch (err) {
        results.push({
          pid: product.id,
          name: product.name,
          variantsSynced: 0,
          imagesSynced: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.variantsSynced, 0);
    const failed = results.filter((r) => r.error).length;

    return NextResponse.json({
      total: results.length,
      totalVariantsSynced: totalSynced,
      failed,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync CJ variants." },
      { status: 500 }
    );
  }
}