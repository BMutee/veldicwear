import { cjGet } from "@/lib/cj";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { syncSingleProductStock } from "@/lib/cj-stock-sync";

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
  bigImage?: string;
  productImage?: string;
  // Full gallery array returned by CJ product/query (all supplier photos)
  productImageSet?: string[];
  productNameEn?: string;
  productName?: string;
  productSku?: string;
  // Rich HTML description — only present when features=["enable_description"]
  description?: string;
  descriptionEn?: string;
  // Pricing: sellPrice = current price. listPrice/suggestSellPrice = MSRP /
  // CJ's suggested retail price (used for the strikethrough price).
  sellPrice?: number | string;
  nowPrice?: number | string;
  discountPrice?: number | string;
  listPrice?: number | string;
  suggestSellPrice?: number | string;
  // Weights in grams: productWeight = product only, packingWeight = incl.
  // packaging. (Note: CJ's docs call it packWeight, the API returns
  // packingWeight.)
  productWeight?: number | string;
  packWeight?: number | string;
  packingWeight?: number | string;
  // Video: CJ's docs say videoUrl, the API actually returns productVideo.
  videoUrl?: string;
  productVideo?: string;
  // product/query itself embeds the full variant list (the separate
  // product/sku/getSkuList endpoint has been removed by CJ).
  variants?: CJVariant[];
  categoryName?: string;
};

export type CJImportResult = {
  productId: string;
  existed: boolean;
  variantsSynced: number;
  imagesSynced: number;
  stockSynced: boolean;
  stockSyncError?: string | null;
};

type CJVariantListResponse = {
  list?: CJVariant[];
};

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Build the Product.description value from CJ's real description fields.
 * CJ returns rich HTML (only when features=["enable_description"] is passed),
 * so it is sanitized with the same sanitizeHtml() used for CMS rich text.
 * Falls back to the legacy placeholder only when CJ provides no description.
 */
function buildDescription(productData: CJProductDetail): string {
  const raw = productData.descriptionEn || productData.description || "";
  if (raw.trim()) return sanitizeHtml(raw);
  return `Imported from CJ Dropshipping: ${productData.categoryName ?? ""}`;
}

/**
 * Compute Product.compareAtPrice from CJ price fields. CJ semantics:
 * - listPrice: original / MSRP (strikethrough price)
 * - discountPrice: the current discounted selling price
 * Only store it when the list price is actually higher than the current
 * price, otherwise the storefront would show a meaningless strikethrough.
 */
function buildCompareAtPrice(productData: CJProductDetail, currentPrice: number): number | null {
  // Prefer listPrice (MSRP); fall back to suggestSellPrice (CJ's suggested
  // retail price) since the API does not always return listPrice.
  const raw = productData.listPrice ?? productData.suggestSellPrice;
  const listPrice = raw != null ? toNumber(raw) : null;
  if (listPrice == null || listPrice <= 0) return null;
  return listPrice > currentPrice ? listPrice : null;
}

/**
 * Normalize a CJ variantProperty value to a plain comma-joined string.
 * CJ sometimes returns "Color: Red, Size: M" and sometimes a JSON string
 * like '[{"propertyName":"Color","propertyValueName":"Red"}]'.
 */
function normalizeVariantProperty(variant: CJVariant): string {
  const raw = variant.variantProperty;
  if (!raw) return "";
  if (!raw.trim().startsWith("[")) return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return raw;
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return String(item ?? "");
        const obj = item as Record<string, unknown>;
        const value =
          obj.propertyValueName ?? obj.propertyValueEnName ?? obj.valueName ?? obj.name;
        return typeof value === "string" ? value : "";
      })
      .filter(Boolean)
      .join(", ");
  } catch {
    return raw;
  }
}

/**
 * Known apparel size tokens, ordered longest-first so matching "2XL" wins
 * over a naive suffix match on "XL".
 */
const SIZE_TOKENS = [
  "XXXL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "XXXS",
  "XXS",
  "2XS",
  "3XS",
  "ONE SIZE",
  "OS",
  "XS",
  "SM",
  "MD",
  "LG",
  "XL",
  "S",
  "M",
  "L",
];

/**
 * Split a CJ variantKey like "Black Zone2-M" or "Wine Red-XXL" into
 * { color, size }. CJ encodes these as "<color>-<size>" but the color part
 * itself may contain spaces (and even hyphens, e.g. "T-shirt-Red-M").
 *
 * Strategy: look for a trailing "-<SIZE>" segment (also tolerating "/",
 * whitespace, or ":" separators) where SIZE is a known apparel token.
 * Returns null when no size suffix is found.
 */
function splitVariantKey(variantKey: string): { color: string | null; size: string } | null {
  const key = variantKey.trim();
  if (!key) return null;

  for (const token of SIZE_TOKENS) {
    // Separators CJ uses between color and size: "-", "/", " ", ":"
    const pattern = new RegExp(`[\\-/:\\s]+(${token})$`, "i");
    const match = key.match(pattern);
    if (match) {
      const size = match[1].toUpperCase();
      const colorPart = key.slice(0, match.index).trim().replace(/[\-/:,\s]+$/, "").trim();
      return { color: colorPart || null, size };
    }
  }

  // Single-variant products with a bare size key ("M") or "One Size".
  const bare = key.toUpperCase();
  if (SIZE_TOKENS.includes(bare)) return { color: null, size: bare };

  return null;
}

/**
 * Parse a CJ variant property string to extract the size value.
 * CJ variants typically use a format like "Size: M" or "Color: Red, Size: M".
 */
function extractSizeFromVariant(variant: CJVariant): string | null {
  const property = normalizeVariantProperty(variant);
  if (property) {
    const sizeMatch = property.match(/Size:\s*([^,]+)/i);
    if (sizeMatch) return sizeMatch[1].trim();
  }
  // CJ's modern format: variantProperty is "[]" and all info lives in
  // variantKey as "<color>-<size>" (e.g. "Dark Grey-XL", "Black Zone2-M").
  if (variant.variantKey) {
    const split = splitVariantKey(variant.variantKey);
    if (split) return split.size;
    return variant.variantKey.trim();
  }
  if (variant.variantName) return variant.variantName.trim();
  // variantNameEn is the entire product name for some single-variant
  // products — only usable as a last resort.
  if (variant.variantNameEn) return variant.variantNameEn.trim();
  return null;
}

function extractColorFromVariant(variant: CJVariant): string | null {
  const property = normalizeVariantProperty(variant);
  if (property) {
    const colorMatch = property.match(/(?:Color|Colour):\s*([^,]+)/i);
    if (colorMatch) return colorMatch[1].trim();
  }
  // CJ's modern format: color is the prefix of variantKey ("Black Zone2-M"
  // -> "Black Zone2"). variantNameEn is NOT used here — for many products
  // it is the full product title, not a color.
  if (variant.variantKey) {
    const split = splitVariantKey(variant.variantKey);
    if (split) return split.color;
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

/**
 * Sync the full CJ gallery (productImageSet) into ProductImage rows.
 *
 * Gallery images have no color association, so they use color: null — the
 * same convention as the main image today. We ADD missing URLs rather than
 * delete-and-recreate, because variant sync also writes color: null rows
 * (for variants with no Color property) and a blanket delete on null would
 * clobber those. URLs already present are skipped, so re-running the import
 * is idempotent.
 */
async function syncGalleryImages(productId: string, galleryUrls: string[]): Promise<number> {
  if (galleryUrls.length === 0) return 0;

  const existing = await prisma.productImage.findMany({
    where: { productId, color: null },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((img) => img.url));

  const newUrls = [...new Set(galleryUrls.map((url) => url.trim()).filter(Boolean))].filter(
    (url) => !existingUrls.has(url)
  );
  if (newUrls.length === 0) return 0;

  await prisma.productImage.createMany({
    data: newUrls.map((url) => ({ productId, color: null, url })),
  });
  return newUrls.length;
}

export async function syncVariants(
  productId: string,
  pid: string,
  embeddedVariants?: CJVariant[]
): Promise<{ variantsSynced: number; imagesSynced: number }> {
  let variantsSynced = 0;
  let imagesSynced = 0;

  try {
    let variants: CJVariant[] = [];
    if (embeddedVariants && embeddedVariants.length > 0) {
      // Preferred source: the variants array already returned by product/query
      // (CJ removed the separate product/sku/getSkuList endpoint).
      variants = embeddedVariants;
    } else {
      // Legacy path — kept for robustness if CJ restores the endpoint.
      try {
        const variantsResponse = await cjGet<CJVariantListResponse>(
          "product/sku/getSkuList",
          { pid }
        );
        variants = variantsResponse.data?.list ?? [];
      } catch {
        // Endpoint removed by CJ (1600101) — fall back to product/query.
        const detail = await cjGet<CJProductDetail>("product/query", {
          pid,
          features: JSON.stringify(["enable_description"]),
        });
        variants = detail.data?.variants ?? [];
      }
    }

    for (const variant of variants) {
      const vid = variant.vid;
      if (!vid) continue;

      const size = extractSizeFromVariant(variant);
      if (!size) continue;

      const color = extractColorFromVariant(variant);

      // Match by CJ variant id first, then by the original CJ color, and only
      // then by the current display color (manual products / legacy rows). The
      // size is included in every branch so a full (size × color) grid can
      // never collapse two rows into one.
      const colorMatch: Prisma.ProductVariantWhereInput[] = color
        ? [{ sourceColor: color }, { color }]
        : [{ color: null }];
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId,
          size,
          OR: [{ cjVariantId: vid }, ...colorMatch],
        },
      });

      if (existingVariant) {
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            cjVariantId: vid,
            price: variant.variantSellPrice ?? existingVariant.price,
            sku: variant.variantSku ?? existingVariant.sku,
            // `color` stays untouched: an admin may have renamed it in
            // Admin → Products. sourceColor tracks CJ's original name.
            sourceColor: color,
          },
        });
      } else {
        const created = await prisma.productVariant.create({
          data: {
            productId,
            size,
            color,
            sourceColor: color,
            cjVariantId: vid,
            sku: variant.variantSku ?? null,
            stock: 0,
            price: variant.variantSellPrice ?? null,
          },
        });
        // Sync color-specific images from the CJ variant (if CJ provides them).
        // Use the local display color so a renamed variant's images stay linked.
        const variantImageUrls = extractVariantImageUrls(variant);
        imagesSynced += await syncVariantImages(
          productId,
          created.color,
          variantImageUrls
        );
        variantsSynced++;
        continue;
      }
      variantsSynced++;

      // Sync color-specific images from the CJ variant (if CJ provides them).
      // For existing rows use the current (possibly admin-renamed) display
      // color so the images keep matching the storefront selection.
      const variantImageUrls = extractVariantImageUrls(variant);
      imagesSynced += await syncVariantImages(
        productId,
        existingVariant.color,
        variantImageUrls
      );
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
/**
 * Re-sync variants (and their images) for an existing locally-stored CJ
 * product, without re-importing the product itself. Used by the admin
 * variants/sync backfill route. Resolves the local product by pid or SKU.
 */
export async function syncProductVariantsByPid(
  pid: string
): Promise<{
  productId: string;
  variantsSynced: number;
  imagesSynced: number;
  stockSynced: boolean;
  stockSyncError?: string | null;
} | null> {
  const existingProduct =
    (await prisma.product.findUnique({ where: { id: pid } })) ??
    (await prisma.product.findFirst({ where: { sku: pid } }));
  if (!existingProduct) return null;

  // product/query is the only source for variants now (getSkuList removed by
  // CJ) — fetch it and pass the embedded variants straight through.
  const response = await cjGet<CJProductDetail>("product/query", {
    pid,
    features: JSON.stringify(["enable_description"]),
  });
  const productData = response.data;

  const { variantsSynced, imagesSynced } = await syncVariants(
    existingProduct.id,
    pid,
    productData?.variants
  );

  // Variant sync for colorless variants replaces the whole color:null bucket
  // (main image + gallery included). Restore the main image and the CJ gallery
  // afterwards so a variant refresh never shrinks the product gallery.
  const mainImage = productData?.bigImage || productData?.productImage || "";
  await ensureMainProductImage(existingProduct.id, mainImage);
  const galleryUrls =
    productData?.productImageSet && productData.productImageSet.length > 0
      ? productData.productImageSet
      : mainImage
        ? [mainImage]
        : [];
  await syncGalleryImages(existingProduct.id, galleryUrls);

  const stockSync = await tryStockSyncAfterImport(existingProduct.id);
  return {
    productId: existingProduct.id,
    variantsSynced,
    imagesSynced,
    stockSynced: stockSync.synced,
    stockSyncError: stockSync.error ?? null,
  };
}

/**
 * Best-effort stock sync immediately after import/refresh so stock is live
 * right away instead of waiting for the 6-hour cron or a manual click. Never
 * throws — if CJ's inventory endpoint fails, the import itself already
 * succeeded and we only report the failure separately.
 */
async function tryStockSyncAfterImport(
  productId: string
): Promise<{ synced: boolean; error?: string }> {
  try {
    const result = await syncSingleProductStock(productId);
    return result.error ? { synced: false, error: result.error } : { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown stock sync error";
    console.error(`[cj-import] Post-import stock sync failed for ${productId}: ${msg}`);
    return { synced: false, error: msg };
  }
}

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

  const name = productData.productNameEn || productData.productName || "CJ Product";
  const image = productData.bigImage || productData.productImage || "";
  const price = toNumber(productData.sellPrice ?? productData.nowPrice);
  const description = buildDescription(productData);
  const compareAtPrice = buildCompareAtPrice(productData, price);
  const videoUrl = productData.productVideo?.trim() || productData.videoUrl?.trim() || null;
  // Weights: CJ returns grams (docs unit: g). Product.weight is stored in kg
  // (weightUnit defaults to "kg"), so convert. productWeight = the product
  // itself; packingWeight adds packaging (used only as fallback).
  const weightGrams =
    toNumber(productData.productWeight) || toNumber(productData.packingWeight ?? productData.packWeight) || 0;
  const weight = weightGrams > 0 ? weightGrams / 1000 : null;
  // Gallery: full CJ image set, falling back to the main image so the
  // gallery is never empty when CJ provides no productImageSet.
  const galleryUrls =
    productData.productImageSet && productData.productImageSet.length > 0
      ? productData.productImageSet
      : image
        ? [image]
        : [];

  if (existingProduct) {
    // Product exists — update details, then sync variants
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: { name, image, price, description, compareAtPrice, videoUrl, weight },
    });

    const { variantsSynced, imagesSynced } = await syncVariants(
      existingProduct.id,
      pid,
      productData.variants
    );
    await ensureMainProductImage(existingProduct.id, image);
    await syncGalleryImages(existingProduct.id, galleryUrls);

    const stockSync = await tryStockSyncAfterImport(existingProduct.id);
    return {
      productId: existingProduct.id,
      existed: true,
      variantsSynced,
      imagesSynced,
      stockSynced: stockSync.synced,
      stockSyncError: stockSync.error ?? null,
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
      compareAtPrice,
      videoUrl,
      stock: 0,
      sku: productData.productSku ?? pid,
      barcode: "",
      trackInventory: true,
      sellOutOfStock: false,
      weight: weight ?? 0,
      weightUnit: "kg",
      featured: false,
    },
  });

  const { variantsSynced, imagesSynced } = await syncVariants(
    created.id,
    pid,
    productData.variants
  );
  await ensureMainProductImage(created.id, image);
  await syncGalleryImages(created.id, galleryUrls);

  const stockSync = await tryStockSyncAfterImport(created.id);
  return {
    productId: created.id,
    existed: false,
    variantsSynced,
    imagesSynced,
    stockSynced: stockSync.synced,
    stockSyncError: stockSync.error ?? null,
  };
}
