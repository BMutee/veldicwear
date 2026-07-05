"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

export default function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCartCount() {
      const cart = getCart();

      const total = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      setCount(total);
    }

    updateCartCount();

    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="relative text-white hover:text-yellow-400 transition"
    >
      🛒

      {count > 0 && (
        <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-black">
          {count}
        </span>
      )}
    </Link>
  );
}