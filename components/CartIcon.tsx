"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

export default function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCartCount() {
      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCount(total);
    }

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <Link
      href="/cart"
      className="veldic-navbar-control relative transition-colors duration-150 cursor-pointer"
      aria-label="Shopping cart"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {count > 0 && (
        <span className="absolute -right-2.5 -top-2.5 flex h-5 w-5 min-w-[20px] items-center justify-center bg-moss px-1 font-mono text-[10px] leading-none text-bone">
          {count}
        </span>
      )}
    </Link>
  );
}