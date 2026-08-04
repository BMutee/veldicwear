"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  productId: string;
  initialWishlisted: boolean;
  className?: string;
};

export default function WishlistButton({ productId, initialWishlisted, className = "" }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    // Optimistic update
    const prev = wishlisted;
    setWishlisted(!wishlisted);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);

    try {
      const res = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWishlisted(prev); // revert on error
      } else {
        setWishlisted(data.wishlisted);
      }
    } catch {
      setWishlisted(prev); // revert on network error
    }
  }, [productId, wishlisted, user, router]);

  return (
    <button
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={`h-5 w-5 transition-all duration-200 ${
          animating ? "scale-125" : "scale-100"
        } ${wishlisted ? "text-ink" : "text-stone hover:text-clay"}`}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}