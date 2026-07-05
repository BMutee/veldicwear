"use client";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
};

import { products } from "@/lib/products";


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
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop" className="text-white/60 hover:text-white">
          ← Back to Shop
        </Link>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="h-96 w-full bg-zinc-800" />

          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="mt-3 text-xl text-yellow-400">
              {product.price}
            </p>

            <p className="mt-6 text-white/70 leading-7">
              {product.description}
            </p>

            
           <button
  onClick={() => addToCart(product)}
  className="mt-8 w-full bg-yellow-500 py-3 text-black font-semibold hover:bg-yellow-400 transition"
>
  Add to Cart
</button>
          </div>
        </div>
      </div>
    </main>
  );
}