"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    stock: number;
  };
  size: string;
  color?: string;
  variantStock: number;
  quantity: number;
  disabled?: boolean;
};

export default function AddToCartButton({
  product,
  size,
  color,
  variantStock,
  quantity,
  disabled,
}: Props) {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  function handleAddToCart() {
    setMessage("");

    if (!size) {
      setMessageType("error");
      setMessage("Please select a size.");
      return;
    }

    if (variantStock <= 0) {
      setMessageType("error");
      setMessage("This size is currently unavailable.");
      return;
    }

    const result = addToCart(product, size, variantStock, quantity, color);

    if (!result.success) {
      setMessageType("error");
      setMessage(result.message);
      return;
    }

    setMessageType("success");
    setMessage(
      `${product.name} (${color ? `${color}, ` : ""}Size ${size}) × ${quantity} added to cart.`
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={disabled}
        className={`w-full py-3.5 font-sans text-sm font-medium uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
          disabled
            ? "cursor-not-allowed bg-stone/5 text-stone"
            : "bg-moss text-white hover:bg-moss-hover"
        }`}
      >
        {!size
          ? "Select a size"
          : disabled
          ? "Out of stock"
          : "Add to cart"}
      </button>

      {message && (
        <p
          className={`mt-3 font-sans text-sm ${
            messageType === "error" ? "text-clay" : "text-moss"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}