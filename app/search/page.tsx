"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  ProductVariant: { id: string; size: string; stock: number; price: number }[];
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <div className="section-grounded py-12 sm:py-16">
          <div className="flex items-center justify-center py-20">
            <p className="font-sans text-sm text-stone">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Deferred so the query sync + fetch don't set state synchronously in the
    // effect body (same macrotask pattern as the cart page's initial load).
    const timer = window.setTimeout(() => {
      const q = searchParams.get("q")?.trim() || "";
      setQuery(q);
      if (q.length < 2) {
        setProducts([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
        })
        .catch(() => {
          setProducts([]);
          setTotal(0);
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="section-grounded py-12 sm:py-16">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full border border-stone/20 bg-white px-5 py-4 pr-14 font-sans text-base text-ink outline-none transition-colors duration-150 placeholder:text-stone focus:border-moss"
              minLength={2}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone transition-colors duration-150 hover:text-moss cursor-pointer"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>

        {/* Results area */}
        <div className="mt-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="font-sans text-sm text-stone">Searching…</p>
            </div>
          ) : initialQuery.length >= 2 && total === 0 ? (
            /* No results */
            <div className="flex flex-col items-center border border-stone/10 bg-white px-6 py-16 shadow-card rounded-lg text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-stone/20 bg-ink/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-stone">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="mt-6 font-display text-2xl font-semibold text-ink">
                No results found
              </p>
              <p className="mt-3 max-w-md font-sans text-sm leading-6 text-stone">
                We couldn&apos;t find anything for &ldquo;{initialQuery}&rdquo;. Try a different search term or browse our collections.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/collection"
                  className="btn-primary cursor-pointer"
                >
                  Browse collections
                </Link>
                <Link
                  href="/shop"
                  className="btn-outline cursor-pointer"
                >
                  View all products
                </Link>
              </div>
            </div>
          ) : initialQuery.length >= 2 ? (
            /* Results found */
            <div>
              <p className="mb-8 font-sans text-sm text-stone">
                <span className="font-semibold text-ink">{total}</span>{" "}
                result{total !== 1 ? "s" : ""} for{" "}
                <span className="font-semibold text-ink">&ldquo;{initialQuery}&rdquo;</span>
              </p>
              <ProductGrid products={products} />
            </div>
          ) : (
            /* Initial state: no query yet */
            <div className="flex flex-col items-center py-20 text-center">
              <p className="font-display text-xl font-semibold text-stone">
                Enter a search term
              </p>
              <p className="mt-2 font-sans text-sm text-stone">
                Search by product name or description.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}