

import { products } from "@/lib/products";
import Link from "next/link";

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <h1 className="text-4xl font-bold text-white text-center">
          Shop Collection
        </h1>

        <p className="mt-3 text-center text-white/60">
          Discover premium essentials for modern style
        </p>

        {/* Product Grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              {/* Image placeholder */}
              <div className="h-52 w-full bg-zinc-800 mb-4" />

              <h2 className="text-lg font-semibold text-white">
                {product.name}
              </h2>

              <p className="mt-2 text-white/60">{product.price}</p>

              <Link
                href={`/product/${product.id}`}
                className="mt-4 inline-block text-sm text-yellow-400 hover:text-yellow-300"
              >
                View Product →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}