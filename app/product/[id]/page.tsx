"use client";

import Link from "next/link";
import { products } from "@/lib/products";
import ProductImage from "@/components/ProductImage";
import ProductInfo from "@/components/ProductInfo";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Product not found</h1>

        <Link href="/shop" className="mt-4 text-yellow-400">
          Go back to shop →
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop" className="text-white/60 hover:text-white">
          ← Back to Shop
        </Link>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <ProductImage
            image={product.image}
            name={product.name}
          />

          <ProductInfo product={product} />
        </div>
      </div>
    </main>
  );
}