"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type CJCategory = {
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
  pid?: string;
  productId?: string;
  id: string;
  nameEn?: string;
  productName?: string;
  productSku?: string;
  bigImage?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
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

const PAGE_SIZE = 20;

export default function AdminCJBrowse() {
  const [categories, setCategories] = useState<CJCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingPid, setImportingPid] = useState<string | null>(null);
  const [importedPids, setImportedPids] = useState<Set<string>>(new Set());
  const [importMessages, setImportMessages] = useState<Record<string, string>>({});
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories once on mount
  useEffect(() => {
    fetch("/api/admin/cj/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data: CJCategory[]) => setCategories(data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Debounce keyword input — only fetch 400ms after the user stops typing
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [keyword]);

  // Fetch products when debounced keyword, category, or page changes
  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(PAGE_SIZE),
    });
    if (debouncedKeyword) params.set("keyword", debouncedKeyword);
    if (categoryId) params.set("categoryId", categoryId);

    setLoading(true);
    setError(null);

    fetch(`/api/admin/cj/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to search CJ products");
        return res.json();
      })
      .then((data: CJSearchResponse) => {
        const productList = data.content.flatMap((item) => item.productList ?? []);
        setProducts(productList);
        setTotalPages(data.totalPages ?? 0);
        setTotalRecords(data.totalRecords ?? 0);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Search failed");
        setProducts([]);
        setTotalPages(0);
        setTotalRecords(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedKeyword, categoryId, page]);

  // Reset to page 1 when search criteria change
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, categoryId]);

  const handleImport = async (product: CJProduct) => {
    // CJ product/listV2 returns the product identifier as `id` (UUID format).
    // The import route expects this as `pid`.
    const pid = product.id || "";
    if (!pid) {
      setImportMessages((prev) => ({
        ...prev,
        [product.id || "unknown"]: "No product identifier found in CJ response",
      }));
      return;
    }

    setImportingPid(pid);
    setImportMessages((prev) => ({ ...prev, [pid]: "" }));

    try {
      const response = await fetch("/api/admin/cj/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: product.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        setImportMessages((prev) => ({
          ...prev,
          [pid]: result.error || "Import failed",
        }));
        return;
      }

      setImportedPids((prev) => new Set(prev).add(pid));
      setImportMessages((prev) => ({
        ...prev,
        [pid]: result.existed ? "Already imported" : "Imported successfully",
      }));
    } catch {
      setImportMessages((prev) => ({
        ...prev,
        [pid]: "Network error during import",
      }));
    } finally {
      setImportingPid(null);
    }
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price == null) return "—";
    const num = typeof price === "number" ? price : Number(price);
    if (Number.isNaN(num)) return "—";
    return `$${num.toFixed(2)}`;
  };

  const isImported = (pid: string) => importedPids.has(pid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
          Browse CJ Products
        </h1>
        <p className="text-stone mt-1 font-body text-sm">
          Search CJ's catalog, import products, then set pricing and featured status.
        </p>
      </div>

      {/* Search controls */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <label className="space-y-1.5 text-sm font-medium text-stone font-body">
          Keyword
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search CJ products, e.g. hoodie"
            className="w-full rounded-lg border border-stone/20 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-stone outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-stone font-body">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-stone/20 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((group) => (
              <optgroup key={group.categoryFirstName} label={group.categoryFirstName}>
                {group.categoryFirstList.map((second) => (
                  <optgroup key={second.categorySecondName} label={`  ${second.categorySecondName}`}>
                    {second.categorySecondList.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between text-sm font-body">
        <p className="text-stone">
          {loading ? "Searching..." : `${totalRecords} product(s) found`}
        </p>
        {error && <p className="text-clay">{error}</p>}
      </div>

      {/* Product grid */}
      {products.length === 0 && !loading ? (
        <div className="rounded-xl border border-stone/20 bg-white px-6 py-12 text-center">
          <p className="text-sm text-stone font-body">
            {error ? "Search failed. Try again." : "No products found. Try a different keyword or category."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            // CJ listV2 may return the product ID under different field names.
            const pid = product.pid || product.productId || product.id || "";
            const imported = isImported(pid);
            const importing = importingPid === pid;
            const message = importMessages[pid] ?? "";
            return (
              <div
                key={pid}
                className="flex flex-col rounded-xl border border-stone/20 bg-white p-4 transition-shadow duration-200 hover:shadow-md"
              >
                {/* Image */}
                <div className="mb-4 h-40 overflow-hidden rounded-lg bg-white">
                  {product.bigImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.bigImage}
                      alt={product.nameEn ?? product.productName ?? "CJ product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-stone/50 font-body">
                      No image
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-ink font-body line-clamp-2">
                  {product.nameEn || product.productName || "CJ Product"}
                </h3>

                {/* SKU + category */}
                <p className="mt-1 text-xs text-stone font-body">
                  SKU: {product.productSku ?? "N/A"}
                </p>
                <p className="mt-0.5 text-xs text-stone font-body">
                  {product.categoryName ?? "Unknown category"}
                </p>

                {/* Price */}
                <p className="mt-2 text-lg font-semibold text-ink font-body">
                  {formatPrice(product.sellPrice ?? product.nowPrice)}
                </p>

                {/* Import status / action */}
                <div className="mt-4 flex flex-col gap-2">
                  {imported ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-moss/5 px-2.5 py-0.5 text-xs font-medium text-green-700 font-body">
                        Imported
                      </span>
                      <Link
                        href={`/admin/products?edit=${pid}`}
                        className="text-xs font-medium text-clay hover:text-[#B57904] transition-colors font-body cursor-pointer"
                      >
                        Edit product →
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleImport(product)}
                      disabled={importing}
                      className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917]/40 disabled:opacity-50"
                    >
                      {importing ? "Importing..." : "Import to Store"}
                    </button>
                  )}
                  {message && !imported && (
                    <p className="text-xs text-stone font-body">{message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="cursor-pointer rounded-lg border border-stone/20 bg-white px-4 py-2 text-sm font-medium text-stone transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-stone font-body">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="cursor-pointer rounded-lg border border-stone/20 bg-white px-4 py-2 text-sm font-medium text-stone transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}