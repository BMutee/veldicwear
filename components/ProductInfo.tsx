"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/products";
import SizeSelector from "./SizeSelector";
import AddToCartButton from "./AddToCartButton";

type Props = {
  product: Product;
};

type SizeVariant = {
  size: string;
  stock: number;
  price: number;
};

export default function ProductInfo({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");

  const sizeVariants: SizeVariant[] = useMemo(
    () =>
      product.sizes.map((size) => ({
        size,
        stock: product.stock,
        price: Number(product.price.replace(/[^0-9.]/g, "")) || 0,
      })),
    [product.sizes, product.stock, product.price]
  );

  const selectedVariant = sizeVariants.find((variant) => variant.size === selectedSize);

  return (
    <div>
      <h1 className="text-3xl font-bold">{product.name}</h1>

      <p className="mt-3 text-xl text-yellow-400">{product.price}</p>

      <p className="mt-6 leading-7 text-black/70">{product.description}</p>

      <SizeSelector sizes={sizeVariants} onChange={setSelectedSize} />

      <AddToCartButton
        product={{
          id: product.id,
          name: product.name,
          price: selectedVariant?.price ?? (Number(product.price.replace(/[^0-9.]/g, "")) || 0),
          compareAtPrice: null,
          image: product.image,
          stock: product.stock,
        }}
        size={selectedSize}
        variantStock={selectedVariant?.stock ?? 0}
        quantity={1}
        disabled={!selectedSize || (selectedVariant?.stock ?? 0) <= 0}
      />
    </div>
  );
}
