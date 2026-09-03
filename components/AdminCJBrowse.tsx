"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/admin-ui/primitives";
import { useToast } from "@/components/admin-ui/toast";

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
  const { toast } = useToast();
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

  // Debounce keyword input â€” only fetch 400ms after the user stops typing
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
    // Async IIFE keeps setState() out of the effect's synchronous body.
    void (async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (debouncedKeyword) params.set("keyword", debouncedKeyword);
      if (categoryId) params.set("categoryId", categoryId);

      try {
        const res = await fetch(`/api/admin/cj/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to search CJ products");
        const data: CJSearchResponse = await res.json();
        const productList = data.content.flatMap((item) => item.productList ?? []);
        setProducts(productList);
        setTotalPages(data.totalPages ?? 0);
        setTotalRecords(data.totalRecords ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setProducts([]);
        setTotalPages(0);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedKeyword, categoryId, page]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  const handleImport = async (product: CJProduct) => {
    // CJ product/listV2 returns the product identifier as `id` (UUID format).
    // The import route expects this as `pid`.
    const pid = product.id || "";
    if (!pid) {
      toast("error", "No product identifier found in CJ response");
      return;
    }

    setImportingPid(pid);

    try {
      const response = await fetch("/api/admin/cj/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: product.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast("error", result.error || "Import failed");
        return;
      }

      setImportedPids((prev) => new Set(prev).add(pid));
      toast("success", result.existed ? "Product was already imported." : "Product imported to store.");
    } catch {
      toast("error", "Network error during import");
    } finally {
      setImportingPid(null);
    }
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price == null) return "â€”";
    const num = typeof price === "number" ? price : Number(price);
    if (Number.isNaN(num)) return "â€”";
    return `$${num.toFixed(2)}`;
  };

  const isImported = (pid: string) => importedPids.has(pid);

  /** Nested CJ categories â†’ optgroups: "First â€” Second" with third-level ids. */
  const categoryGroups = useMemo(
    () =>
      categories.map((first) => ({
        label: first.categoryFirstName,
        options: first.categoryFirstList.flatMap((second) =>
          second.categorySecondList.map((third) => ({
            value: third.categoryId,
            label: `${second.categorySecondName} â€” ${third.categoryName}`,
          }))
        ),
      })),
    [categories]
  );

  // __PART2__
  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse CJ Products"
        description="Search CJ's catalog and import products into your store."
      />

      {/* Search controls */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <Field label="Keyword">
          <Input
            value={keyword}
            onChange={handleKeywordChange}
            placeholder="Search CJ products, e.g. hoodie"
          />
        </Field>
        <Field label="Category">
          <Select
            value={categoryId}
            onChange={handleCategoryChange}
            ariaLabel="Category"
            options={[{ value: "", label: "All Categories" }]}
            groups={categoryGroups}
          />
        </Field>
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-stone">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4" /> Searchingâ€¦
            </span>
          ) : (
            `${totalRecords} product(s) found`
          )}
        </p>
        {error && <p className="text-clay">{error}</p>}
      </div>

      {/* Product grid */}
      {products.length === 0 && !loading ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-sm text-stone">
            {error ? "Search failed. Try again." : "No products found. Try a different keyword or category."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            // CJ listV2 may return the product ID under different field names.
            const pid = product.pid || product.productId || product.id || "";
            const imported = isImported(pid);
            const importing = importingPid === pid;
            return (
              <Card key={pid} className="flex flex-col p-4 transition-shadow duration-200 hover:shadow-md">
                {/* Image */}
                <div className="mb-4 h-40 overflow-hidden rounded-lg bg-bone">
                  {product.bigImage ? (

                    <img
                      src={product.bigImage}
                      alt={product.nameEn ?? product.productName ?? "CJ product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-stone/50">
                      No image
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="line-clamp-2 text-sm font-semibold text-ink">
                  {product.nameEn || product.productName || "CJ Product"}
                </h3>

                {/* SKU + category */}
                <p className="mt-1 text-xs text-stone">SKU: {product.productSku ?? "N/A"}</p>
                <p className="mt-0.5 text-xs text-stone">{product.categoryName ?? "Unknown category"}</p>

                {/* Price */}
                <p className="mt-2 text-lg font-semibold text-ink">
                  {formatPrice(product.sellPrice ?? product.nowPrice)}
                </p>

                {/* Import status / action */}
                <div className="mt-4 flex flex-col gap-2">
                  {imported ? (
                    <div className="flex items-center gap-2">
                      <Badge tone="success">Imported</Badge>
                      <Link
                        href={`/admin/products?edit=${pid}`}
                        className="cursor-pointer text-xs font-medium text-clay transition-colors hover:underline"
                      >
                        Edit product â†’
                      </Link>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleImport(product)}
                      loading={importing}
                      size="sm"
                    >
                      {importing ? "Importingâ€¦" : "Import to Store"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-stone">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
