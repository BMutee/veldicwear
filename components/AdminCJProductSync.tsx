"use client";

import { useState } from "react";

type CJCategoryGroup = {
  categoryFirstName: string;
  categoryFirstList: Array<{
    categorySecondName: string;
    categorySecondList: Array<{
      categoryId: string;
      categoryName: string;
    }>;
  }>;
};

type CJProduct = {
  pid: string;
  id: string;
  nameEn?: string;
  productName?: string;
  productSku?: string;
  bigImage?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  warehouseInventoryNum?: number;
  categoryName?: string;
};

type CJSearchResponse = {
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  totalPages: number;
  content: Array<{
    productList: CJProduct[];
  }>;
};

export default function AdminCJProductSync() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [categories, setCategories] = useState<CJCategoryGroup[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [syncingVariants, setSyncingVariants] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/cj/products?keyword=${encodeURIComponent(keyword)}&page=1&size=20`
      );
      if (!response.ok) {
        throw new Error("Unable to search CJ products.");
      }

      const data = (await response.json()) as CJSearchResponse;
      const productList = data.content.flatMap((item) => item.productList ?? []);
      setProducts(productList);
      setMessage(`Found ${productList.length} product(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (pid: string) => {
    setImporting(pid);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pid }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to import product.");
      }

      setMessage(
        `Imported product ${result.product?.name || pid} successfully. ${
          result.variantsSynced > 0
            ? `Synced ${result.variantsSynced} variant(s).`
            : "No variants synced."
        }`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(null);
    }
  };

  const handleSyncStock = async () => {
    setSyncingStock(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/stock-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sync CJ stock.");
      }

      const s = result.summary;
      setMessage(
        `Stock sync complete. ${s.total} product(s) checked, ${s.updated} updated, ${s.unchanged} unchanged, ${s.errors} errors. ${s.totalVariantsUpdated} variant(s) stock updated.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock sync failed.");
    } finally {
      setSyncingStock(false);
    }
  };

  const handleSyncAllVariants = async () => {
    setSyncingVariants(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/variants/sync", {
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sync CJ variants.");
      }

      setMessage(
        `Synced variants for ${result.total} product(s). ${result.totalVariantsSynced} total variant(s) added/updated. ${result.failed} product(s) failed.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncingVariants(false);
    }
  };

  const loadCategories = async () => {
    setCategoryLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/categories");
      if (!response.ok) {
        throw new Error("Unable to load CJ categories.");
      }
      const data = (await response.json()) as CJCategoryGroup[];
      setCategories(data ?? []);
      setMessage(`Loaded ${data?.length ?? 0} category groups.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Category load failed.");
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchProductDetails = async (pid: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/cj/product/details?pid=${encodeURIComponent(pid)}`);
      if (!response.ok) {
        throw new Error("Unable to fetch CJ product details.");
      }
      const data = await response.json();
      setMessage(`Product details for ${pid}: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fetch details failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductVariants = async (pid: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/cj/product/variants?pid=${encodeURIComponent(pid)}`);
      if (!response.ok) {
        throw new Error("Unable to fetch CJ product variants.");
      }
      const data = await response.json();
      setMessage(`Variants for ${pid}: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fetch variants failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-slate-100 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">CJ Product Sync</h2>
          <p className="mt-2 text-black/70">
            Search CJ Dropshipping products and import them into your local store catalog.
          </p>
          <div className="mt-3 rounded-3xl border border-black/10 bg-white p-4 text-sm text-black/80">
            <h3 className="text-base font-semibold">Product Sync Process</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Authenticate with CJ and obtain a backend access token.</li>
              <li>Optionally sync CJ categories to map product taxonomy.</li>
              <li>Search the CJ product list and choose products to import.</li>
              <li>Importing now also fetches variants with CJ variant IDs automatically.</li>
              <li>Use "Sync CJ Variants for All Products" to backfill variants for past imports.</li>
            </ol>
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncAllVariants}
              disabled={syncingVariants}
              className="rounded-full bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingVariants ? "Syncing..." : "Sync CJ Variants for All Products"}
            </button>
            <p className="text-xs text-black/60">
              Fetches variant IDs from CJ for all existing imported products. Required for auto-fulfillment to work correctly with size variants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncStock}
              disabled={syncingStock}
              className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingStock ? "Syncing..." : "Sync Stock Now"}
            </button>
            <p className="text-xs text-black/60">
              Fetches current stock levels from CJ for all imported products and updates local variant stock. If CJ stock is 0, local stock is set to 0 immediately to prevent overselling.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search keyword, e.g. hoodie"
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none"
          />
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search CJ Products"}
          </button>
        </form>

        {message && <p className="text-sm text-black/70">{message}</p>}

        {products.length > 0 && (
          <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.pid} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="mb-4 h-40 overflow-hidden rounded-2xl bg-slate-100">
                  {product.bigImage ? (
                    <img
                      src={product.bigImage}
                      alt={product.nameEn ?? product.productName ?? "CJ product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-black/40">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-black">
                  {product.nameEn || product.productName || "CJ Product"}
                </h3>
                <p className="mt-2 text-sm text-black/60">SKU: {product.productSku ?? "N/A"}</p>
                {product.sellPrice != null && (
                  <p className="mt-2 text-lg font-semibold text-black">
                    ${typeof product.sellPrice === "number"
                      ? product.sellPrice.toFixed(2)
                      : Number(product.sellPrice).toFixed(2)}
                  </p>
                )}
                <p className="mt-2 text-sm text-black/60">Category: {product.categoryName ?? "Unknown"}</p>
                <button
                  type="button"
                  onClick={() => handleImport(product.pid)}
                  disabled={importing === product.pid}
                  className="mt-4 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing === product.pid ? "Importing…" : "Import to Store"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}