"use client";

import { useState } from "react";

type Props = {
  sizes: string[];
};

export default function SizeSelector({ sizes }: Props) {
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
        Select Size
      </h3>

      <div className="flex gap-3">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={`h-12 w-12 rounded-md border transition ${
              selectedSize === size
                ? "border-yellow-500 bg-yellow-500 text-black"
                : "border-white/20 text-white hover:border-white"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-white/60">
        Selected size: <span className="font-semibold text-yellow-400">{selectedSize}</span>
      </p>
    </div>
  );
}