import { prisma } from "@/lib/prisma";
import { cjGet } from "@/lib/cj";

/**
 * Determine if a product ID looks like a CJ product ID.
 * CJ product IDs are typically numeric strings.
 */
function isCjProductId(productId: string): boolean {
  return /^\d+$/.test(productId);
}

/**
 * Sync stock for a single CJ-imported product.
 *
 * 1. Fetches CJ inventory via product/stock/getInventoryByPid
 * 2. Updates our ProductVariant.stock to match CJ's stock per variant
 * 3. If CJ stock is 0, sets our stock to 0 immediately (prevents overselling)
 * 4. Returns a log of what changed
 */
export async function syncSingleProductStock(
  productId: string
): Promise<{
  productId: string;
  productName: string;
  updated: boolean;
  variantsUpdated: number;
  changes: Array<{
    variantId: string;
    size: string;
    oldStock: number;
    newStock: number;
    cjVariantId: string | null;
  }>;
  error?: string;
}> {
  // Fetch the product with its variants
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product) {
    return {
      productId,
      productName: "Unknown",
      updated: false,
      variantsUpdated: 0,
      changes: [],
      error: "Product not found",
    };
  }

  // Only sync CJ products (numeric IDs)
  if (!isCjProductId(product.id)) {
    return {
      productId,
      productName: product.name,
      updated: false,
      variantsUpdated: 0,
      changes: [],
      error: "Not a CJ product (non-numeric ID)",
    };
  }

  try {
    // Fetch CJ inventory for this product
    const inventoryResponse = await cjGet<{
      inventoryList?: Array<{
        vid?: string;
        quantity?: number;
        warehouseInventoryNum?: number;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>("product/stock/getInventoryByPid", { pid: product.id });

    const cjInventoryList = inventoryResponse.data?.inventoryList ?? [];

    const changes: Array<{
      variantId: string;
      size: string;
      oldStock: number;
      newStock: number;
      cjVariantId: string | null;
    }> = [];

    // If CJ returns no inventory data, set all variants to 0 (out of stock)
    if (cjInventoryList.length === 0) {
      for (const variant of product.variants) {
        if (variant.stock !== 0) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: 0 },
          });
          changes.push({
            variantId: variant.id,
            size: variant.size,
            oldStock: variant.stock,
            newStock: 0,
            cjVariantId: variant.cjVariantId,
          });
        }
      }
    } else {
      // Map CJ variant IDs to stock quantities
      const cjStockByVid = new Map<string, number>();
      for (const item of cjInventoryList) {
        const vid = item.vid;
        const qty = item.quantity ?? item.warehouseInventoryNum ?? 0;
        if (vid) {
          cjStockByVid.set(vid, Number(qty));
        }
      }

      // Update each of our variants
      for (const variant of product.variants) {
        // Find the matching CJ stock by cjVariantId
        let newStock: number | null = null;

        if (variant.cjVariantId && cjStockByVid.has(variant.cjVariantId)) {
          newStock = cjStockByVid.get(variant.cjVariantId)!;
        }

        // If we can't match by cjVariantId, try to use the first inventory item
        // (for products without size variants)
        if (newStock === null && cjInventoryList.length > 0 && !variant.cjVariantId) {
          newStock = Number(cjInventoryList[0].quantity ?? cjInventoryList[0].warehouseInventoryNum ?? 0);
        }

        // If still no match, skip this variant
        if (newStock === null) {
          continue;
        }

        // Only update if stock changed
        if (variant.stock !== newStock) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: newStock },
          });
          changes.push({
            variantId: variant.id,
            size: variant.size,
            oldStock: variant.stock,
            newStock,
            cjVariantId: variant.cjVariantId,
          });
        }
      }
    }

    return {
      productId,
      productName: product.name,
      updated: changes.length > 0,
      variantsUpdated: changes.length,
      changes,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown CJ stock sync error";
    console.error(
      `syncSingleProductStock: Failed for product ${product.name} (${productId}): ${errorMessage}`
    );
    return {
      productId,
      productName: product.name,
      updated: false,
      variantsUpdated: 0,
      changes: [],
      error: errorMessage,
    };
  }
}

/**
 * Sync stock for ALL CJ-imported products.
 * Called by the cron job to batch-process all products.
 *
 * Recommended frequency: every 6 hours (4 times per day).
 * - CJ stock doesn't change every minute
 * - Too frequent wastes API calls / risks rate limits
 * - Too infrequent risks overselling out-of-stock items
 * - 6 hours balances both concerns
 */
export async function syncAllCjProductStock(): Promise<{
  total: number;
  updated: number;
  unchanged: number;
  errors: number;
  totalVariantsUpdated: number;
  results: Array<{
    productId: string;
    productName: string;
    variantsUpdated: number;
    changes: Array<{
      size: string;
      oldStock: number;
      newStock: number;
    }>;
    error?: string;
  }>;
}> {
  // Find all CJ-imported products (numeric IDs)
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  const cjProducts = allProducts.filter((p) => isCjProductId(p.id));

  const results: Array<{
    productId: string;
    productName: string;
    variantsUpdated: number;
    changes: Array<{
      size: string;
      oldStock: number;
      newStock: number;
    }>;
    error?: string;
  }> = [];

  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  let totalVariantsUpdated = 0;

  for (const product of cjProducts) {
    try {
      const result = await syncSingleProductStock(product.id);

      results.push({
        productId: product.id,
        productName: product.name,
        variantsUpdated: result.variantsUpdated,
        changes: result.changes.map((c) => ({
          size: c.size,
          oldStock: c.oldStock,
          newStock: c.newStock,
        })),
        error: result.error,
      });

      if (result.updated) {
        updated++;
        totalVariantsUpdated += result.variantsUpdated;
      } else if (result.error) {
        errors++;
      } else {
        unchanged++;
      }
    } catch (err) {
      results.push({
        productId: product.id,
        productName: product.name,
        variantsUpdated: 0,
        changes: [],
        error: err instanceof Error ? err.message : "Unknown error",
      });
      errors++;
    }
  }

  return {
    total: cjProducts.length,
    updated,
    unchanged,
    errors,
    totalVariantsUpdated,
    results,
  };
}