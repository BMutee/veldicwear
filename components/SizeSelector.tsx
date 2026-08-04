"use client";

import { useState } from "react";

type Variant = {
  size: string;
  stock: number;
  price: number;
};

export default function SizeSelector({
  sizes,
  onChange,
}: {
  sizes: Variant[];
  onChange?: (size: string) => void;
}) {
  const [selected, setSelected] = useState("");

  function selectSize(size: string) {
    const variant = sizes.find((v) => v.size === size);
    if (variant && variant.stock <= 0) return;
    setSelected(size);
    if (onChange) onChange(size);
  }

  return (
    <div>
      <p className="eyebrow mb-3">Select size</p>

      <div className="flex flex-wrap gap-2">
        {sizes.map((variant) => {
          const isOutOfStock = variant.stock <= 0;
          const isSelected = selected === variant.size;

          return (
            <button
              key={variant.size}
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