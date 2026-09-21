"use client";

import { useEffect, useState } from "react";

type Variant = {
  size: string;
  stock: number;
  price: number;
};

const SIZE_ORDER = [
  "XXXS",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "XXXL",
  "OS",
  "ONE SIZE",
];

export default function SizeSelector({
  sizes,
  onChange,
  resetKey,
}: {
  sizes: Variant[];
  onChange?: (size: string) => void;
  resetKey?: string;
}) {
  const [selected, setSelected] = useState("");

  // Clear selection when the parent signals a color change (or a new set of
  // sizes arrives that no longer contains the selection). Deferred via timeout
  // so the effect never sets state synchronously in its body.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelected((prev) => {
        if (!prev) return prev;
        const stillThere = sizes.some((v) => v.size === prev && v.stock > 0);
        if (stillThere) return prev;
        if (onChange) onChange("");
        return "";
      });
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Dedupe by size label (multiple colors share S/M/L…) and sort in
  // logical size order so S M L XL renders instead of import order.
  const orderIndex = (size: string) => {
    const i = SIZE_ORDER.indexOf(size.toUpperCase());
    return i === -1 ? SIZE_ORDER.length : i;
  };
  const seen = new Map<string, Variant>();
  for (const v of sizes) {
    const existing = seen.get(v.size);
    if (!existing || (existing.stock <= 0 && v.stock > 0)) seen.set(v.size, v);
  }
  const uniqueSizes = [...seen.values()].sort((a, b) => orderIndex(a.size) - orderIndex(b.size));

  function selectSize(size: string) {
    const variant = uniqueSizes.find((v) => v.size === size);
    if (variant && variant.stock <= 0) return;
    setSelected(size);
    if (onChange) onChange(size);
  }

  return (
    <div>
      <p className="eyebrow mb-3">Select size</p>

      <div className="flex flex-wrap gap-2">
        {uniqueSizes.map((variant) => {
          const isOutOfStock = variant.stock <= 0;
          const isSelected = selected === variant.size;

          return (
            <button
              key={variant.size}
              type="button"
              disabled={isOutOfStock}
              onClick={() => selectSize(variant.size)}
              className={`min-w-[56px] px-4 py-2.5 font-sans text-sm font-medium transition-all duration-150 cursor-pointer ${
                isOutOfStock
                  ? "cursor-not-allowed border border-stone/10 bg-white text-stone line-through opacity-50"
                  : isSelected
                  ? "border border-moss bg-moss text-white"
                  : "border border-stone/20 bg-transparent text-ink hover:border-moss hover:text-moss"
              }`}
            >
              {variant.size}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-3 font-sans text-sm text-moss">
          Selected: {selected}
        </p>
      )}
    </div>
  );
}