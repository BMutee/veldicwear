"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartItem, getCart, saveCart } from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function removeItem(id: string) {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    saveCart(updatedCart);
  }

  const total = cart.reduce((sum, item) => {
    return (
      sum + Number(item.price.replace("$", "")) * item.quantity
    );
  }, 0);

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Shopping Cart</h1>

        {cart.length === 0 ? (
          <p className="mt-8 text-white/60">Your cart is empty.</p>
        ) : (
          <>
            <div className="mt-8 space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-white/10 pb-4"
                >
                  <div>
                    <h2 className="text-xl font-semibold">
                      {item.name}
                    </h2>

                    <p className="text-white/60">
                      {item.price}
                    </p>

                    <p className="text-yellow-400">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded bg-red-600 px-4 py-2 hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <h2 className="text-2xl font-bold">
                Total: ${total}
              </h2>
            </div>
          </>
        )}

        <Link
          href="/shop"
          className="mt-8 inline-block text-yellow-400 hover:text-yellow-300"
        >
          ← Continue Shopping
        </Link>
      </div>
    </main>
  );
}