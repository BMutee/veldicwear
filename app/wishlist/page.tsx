"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FAFAF9]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex items-center justify-center py-20">
            <p className="font-sans text-sm text-[#78716C]">Loading…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="border-b border-[#1C1917]/15 pb-6">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Saved items
          </p>
          <h1 className="mt-1 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Wishlist
          </h1>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="font-sans text-sm text-[#78716C]">Loading…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center border border-[#1C1917]/10 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1C1917]/20 bg-[#1C1917]/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-[#78716C]">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="mt-6 font-display text-2xl font-black uppercase tracking-wide text-[#1C1917]">
                Your wishlist is empty
              </p>
              <p className="mt-3 max-w-md font-sans text-sm leading-6 text-[#78716C]">
                Save your favourite pieces by tapping the heart icon on any product.
              </p>
              <Link
                href="/shop"
                className="mt-8 inline-flex items-center gap-2 bg-[#1C1917] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#FAFAF9] transition-colors duration-200 hover:bg-[#CA8A04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
                Shop Now
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-8 font-sans text-sm text-[#78716C]">
                <span className="font-semibold text-[#1C1917]">{products.length}</span>{" "}
                saved item{products.length !== 1 ? "s" : ""}
              </p>
              <ProductGrid products={products} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}