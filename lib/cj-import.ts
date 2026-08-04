import { cjGet } from "@/lib/cj";
import { prisma } from "@/lib/prisma";

/**
 * CJ variant response from product/sku/getSkuList
 */
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

type CJProductDetail = {
  pid?: string;
  variants?: Array<Record<string, unknown>>;
  bigImage?: string;
  productImage?: string;
  nameEn?: string;
  productName?: string;
  productSku?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  categoryName?: string;
};

export type CJImportResult = {
  productId: string;
  existed: boolean;
  variantsSynced: number;
  imagesSynced: number;
};

type CJVariantListResponse = {
  list?: CJVariant[];
};

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Parse a CJ variant property string to extract the size value.
 * CJ variants typically use a format like "Size: M" or "Color: Red, Size: M".
 */
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
 * Ensure the product has at least one ProductImage record (the main image)
 * so the product page gallery is never empty even when no variant-specific
 * photos are available from CJ.
 */
async function ensureMainProductImage(productId: string, mainImage: string): Promise<boolean> {
  if (!mainImage) return false;

  const existing = await prisma.productImage.findFirst({
    where: { productId, color: null },
  });

  if (existing) return false;

  await prisma.productImage.create({
    data: { productId, color: null, url: mainImage },
  });

  return true;
}

async function syncVariants(
  productId: string,
  pid: string
): Promise<{ variantsSynced: number; imagesSynced: number }> {
  let variantsSynced = 0;
  let imagesSynced = 0;

  try {
    const variantsResponse = await cjGet<CJVariantListResponse>("product/sku/getSkuList", {
      pid,
    });
    const variants = variantsResponse.data?.list ?? [];

    for (const variant of variants) {
      const vid = variant.vid;
      if (!vid) continue;

      const size = extractSizeFromVariant(variant);
      if (!size) continue;

      const color = extractColorFromVariant(variant);

      // Upsert the variant — create if not exists, update cjVariantId if exists.
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId,
          size,
          color: color ?? null,
        },
      });

      if (existingVariant) {
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            cjVariantId: vid,
            price: variant.variantSellPrice ?? existingVariant.price,
          },
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId,
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
      imagesSynced += await syncVariantImages(productId, color, variantImageUrls);
    }
  } catch (error) {
    console.error(`Failed to sync variants for product ${pid}:`, error);
  }

  return { variantsSynced, imagesSynced };
}

/**
 * Fetch a CJ product by pid and create/update it in the local store.
 *
 * This is the shared implementation used by:
 * - POST /api/admin/cj/import  (manual admin import)
 * - POST /api/webhook/cj       (automatic import when "List to store" is used on the CJ website)
 *
 * Returns the local product id, whether the product already existed, and how
 * many variants were synced.
 */
export async function importCJProduct(pid: string): Promise<CJImportResult> {
  if (!pid || typeof pid !== "string") {
    throw new Error("Missing CJ product pid.");
  }

  // Fetch product details from CJ
  const response = await cjGet<CJProductDetail>("product/query", {
    pid,
    features: JSON.stringify(["enable_description"]),
  });

  const productData = response.data;

  // Check if product already exists by CJ pid (used as product id) or by sku
  const existingByPid = await prisma.product.findUnique({ where: { id: pid } });
  const existingBySku = await prisma.product.findFirst({
    where: { sku: productData.productSku ?? pid },
  });

  const existingProduct = existingByPid || existingBySku;

  const name = productData.nameEn || productData.productName || "CJ Product";
  const image = productData.bigImage || productData.productImage || "";
  const price = toNumber(productData.sellPrice ?? productData.nowPrice);
  const description = `Imported from CJ Dropshipping: ${productData.categoryName ?? ""}`;

  if (existingProduct) {
    // Product exists — update details, then sync variants
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: { name, image, price, description },
    });

    const { variantsSynced, imagesSynced } = await syncVariants(existingProduct.id, pid);
    await ensureMainProductImage(existingProduct.id, image);

    return {
      productId: existingProduct.id,
      existed: true,
      variantsSynced,
      imagesSynced,
    };
  }

  // Product doesn't exist — create it
  const created = await prisma.product.create({
    data: {
      id: pid,
      name,
      description,
      image,
      price,
      compareAtPrice: null,
      stock: 0,
      sku: productData.productSku ?? pid,
      barcode: "",
      trackInventory: false,
      sellOutOfStock: true,
      weight: 0,
      weightUnit: "kg",
      featured: false,
    },
  });

  const { variantsSynced, imagesSynced } = await syncVariants(created.id, pid);
  await ensureMainProductImage(created.id, image);

  return {
    productId: created.id,
    existed: false,
    variantsSynced,
    imagesSynced,
  };
}
