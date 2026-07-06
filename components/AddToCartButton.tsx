"use client";

import { addToCart } from "@/lib/cart";
import { Product } from "@/lib/products";

type Props = {
  product: Product;
};

export default function AddToCartButton({
  product,
}: Props) {
  return (
    <button
      onClick={() => addToCart(product)}
      className="mt-8 w-full rounded bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400"
    >
      Add to Cart
    </button>
  );
}