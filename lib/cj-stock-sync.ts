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
      inventories?: Array<{
        totalInventoryNum?: number;
        cjInventoryNum?: number;
        factoryInventoryNum?: number;
      }>;
      variantInventories?: Array<{
        vid?: string;
        inventory?: Array<{
          totalInventory?: number;
          cjInventory?: number;
          factoryInventory?: number;
        }>;
      }>;
    }>("product/stock/getInventoryByPid", { pid: product.id });

    const data = inventoryResponse.data ?? {};
    const cjInventoryList = data.variantInventories ?? [];

    const changes: Array<{
      variantId: string;
      size: string;
      oldStock: number;
      newStock: number;
      cjVariantId: string | null;
    }> = [];

    // If CJ returns no per-variant inventory, fall back to the product-level total
    // (single-stock products); if there's no data at all, treat as out of stock.
    if (cjInventoryList.length === 0) {
      const fallbackStock = Number(inventoryResponse.data?.inventories?.[0]?.totalInventoryNum ?? 0);
      for (const variant of product.variants as Array<{
        id: string;
        size: string;
        stock: number;
        cjVariantId: string | null;
      }>) {
        if (variant.stock !== fallbackStock) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: fallbackStock },
          });
          changes.push({
            variantId: variant.id,
            size: variant.size,
            oldStock: variant.stock,
            newStock: fallbackStock,
            cjVariantId: variant.cjVariantId,
          });
        }
      }
    } else {
      // Map CJ variant IDs to stock quantities. CJ returns per-variant entries as
      // variantInventories[].inventory[] — sum the available quantity across each
      // warehouse entry for a variant. Prefer totalInventory (CJ + factory), which
      // matches the "in stock" figure CJ's catalog shows; fall back to cj+factory.
      const cjStockByVid = new Map<string, number>();
      for (const vi of cjInventoryList) {
        if (!vi.vid) continue;
        let total = 0;
        for (const inv of vi.inventory ?? []) {
          const entryValue =
            inv.totalInventory ??
            (inv.cjInventory ?? 0) + (inv.factoryInventory ?? 0);
          total += Number(entryValue ?? 0);
        }
        cjStockByVid.set(vi.vid, total);
      }

      // Update each of our variants
      for (const variant of product.variants as Array<{
        id: string;
        size: string;
        stock: number;
        cjVariantId: string | null;
      }>) {
        // Find the matching CJ stock by cjVariantId
        let newStock: number | null = null;

        if (variant.cjVariantId && cjStockByVid.has(variant.cjVariantId)) {
          newStock = cjStockByVid.get(variant.cjVariantId)!;
        }

        // If we can't match by cjVariantId, fall back to the product-level total
        // (for products without size variants / single-variant products).
        if (newStock === null && !variant.cjVariantId) {
          newStock = Number(inventoryResponse.data?.inventories?.[0]?.totalInventoryNum ?? 0);
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

    // Mirror CJ's product-level total onto Product.stock so the field (and the
    // extension response) reflects real availability even without a size selected.
    const productTotal = Number(inventoryResponse.data?.inventories?.[0]?.totalInventoryNum ?? 0);
    if (productTotal !== product.stock) {
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: productTotal },
      });
    }

    return {
      productId,
      productName: product.name,
      updated: changes.length > 0 || productTotal !== product.stock,
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

  const cjProducts = allProducts.filter((p: { id: string; name: string }) => isCjProductId(p.id));

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

  for (const product of cjProducts as Array<{ id: string; name: string }>) {
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