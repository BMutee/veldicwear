"use client";

import { useState } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";
import SizeSelector from "./SizeSelector";
import WishlistButton from "./WishlistButton";
import ReviewSection from "./ReviewSection";
import { normalizeImageSrc } from "@/lib/image";

type Variant = {
  size: string;
  color?: string;
  stock: number;
  price: number;
};

type ProductImage = {
  id: string;
  color: string | null;
  url: string;
};

type ProductClientProps = {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    stock: number;
    description?: string | null;
  };
  sizes: Variant[];
  productImages: ProductImage[];
};

type AccordionItem = {
  title: string;
  content: string;
};

const DEFAULT_DESCRIPTION =
  "Built for the ground you cover. Premium materials meet considered construction for a silhouette that moves with you — on the trail, in the city, or on the long way home.";

const SHIPPING_RETURNS =
  "Free standard shipping on all orders over $100. Express shipping available at checkout. Returns accepted within 30 days of delivery in unworn condition with original tags attached.";

const SIZE_GUIDE =
  "Model is 6'1\" wearing size M. For the best fit, we recommend taking your chest, waist, and inseam measurements and comparing them to our size chart available on each product page.";

function Accordion({ data }: { data: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="border-t border-stone/10">
      {data.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.title} className="border-b border-stone/10">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between py-4 font-sans text-sm font-medium uppercase tracking-wide text-ink transition-colors duration-150 hover:text-moss cursor-pointer"
            >
              {item.title}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 transition-transform duration-150 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? "max-h-[3000px] pb-4" : "max-h-0"
              }`}
            >
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuantityStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center border border-stone/20">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2 font-sans text-sm text-ink transition-colors duration-150 hover:text-moss disabled:text-stone disabled:cursor-not-allowed cursor-pointer"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[3ch] text-center font-mono text-sm font-medium text-ink">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2 font-sans text-sm text-ink transition-colors duration-150 hover:text-moss disabled:text-stone disabled:cursor-not-allowed cursor-pointer"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default function ProductClient({
  product,
  sizes,
  productImages,
}: ProductClientProps) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImage, setActiveImage] = useState(product.image);
  const [quantity, setQuantity] = useState(1);

  const availableColors = sizes.reduce(
    (acc, variant) => {
      if (variant.color && !acc.includes(variant.color)) {
        acc.push(variant.color);
      }
      return acc;
    },
    [] as string[],
  );
  const hasColorData = availableColors.length > 0;

  const selectedVariant = sizes.find(
    (variant) =>
      variant.size === selectedSize &&
      (!hasColorData || !selectedColor || variant.color === selectedColor),
  );

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product.price;

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > displayPrice;

  const maxQty = Math.min(selectedVariant?.stock ?? 99, 10);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const matchingImage = productImages.find((img) => img.color === color);
    if (matchingImage?.url) setActiveImage(matchingImage.url);
  };

  const colorImages =
    selectedColor && productImages.length > 0
      ? productImages.filter((img) => img.color === selectedColor)
      : productImages;

  const thumbnails =
    colorImages.length > 0 ? colorImages.map((img) => img.url) : [activeImage];

  const mainImage = activeImage || thumbnails[0];

  const accordionData: AccordionItem[] = [
    {
      title: "Description",
      content: product.description?.trim() || DEFAULT_DESCRIPTION,
    },
    {
      title: "Shipping & Returns",
      content: SHIPPING_RETURNS,
    },
    {
      title: "Size Guide",
      content: SIZE_GUIDE,
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Left: Image gallery */}
      <div>
        {/* Main image */}
        <div className="relative aspect-[4/5] overflow-hidden border border-stone/10 bg-white">
          <Image
            src={normalizeImageSrc(mainImage)}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            loading="eager"
            priority
          />
        </div>

        {/* Thumbnail strip */}
        {thumbnails.length > 1 && (
          <div className="mt-3 flex gap-3">
            {thumbnails.map((url, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(url)}
                className={`relative aspect-[4/5] w-[80px] overflow-hidden border transition-colors duration-150 cursor-pointer ${
                  url === mainImage
                    ? "border-moss"
                    : "border-stone/10 hover:border-moss/60"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={normalizeImageSrc(url)}
                  alt={`${product.name} - image ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product info */}
      <div className="flex flex-col">
        {/* Product name + wishlist */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {product.name}
          </h1>
          <WishlistButton productId={product.id} initialWishlisted={false} className="shrink-0 mt-1" />
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-2xl text-ink">
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-sm text-stone line-through">
              ${product.compareAtPrice!.toFixed(2)}
            </span>
          )}
        </div>

        {/* Color selector */}
        {hasColorData && (
          <div className="mt-8">
            <p className="eyebrow mb-3">Color</p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`px-4 py-2.5 font-sans text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border border-moss bg-moss text-white"
                        : "border border-stone/20 bg-transparent text-ink hover:border-moss hover:text-moss"
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size selector */}
        <div className="mt-6">
          <SizeSelector sizes={sizes} onChange={setSelectedSize} />
        </div>

        {/* Stock status */}
        <div className="mt-4">
          {selectedVariant ? (
            selectedVariant.stock === 0 ? (
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-clay">
                Out of stock
              </p>
            ) : selectedVariant.stock <= 3 ? (
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-moss">
                Only {selectedVariant.stock} left
              </p>
            ) : (
              <p className="font-sans text-xs text-stone">
                {selectedVariant.stock} in stock
              </p>
            )
          ) : (
            <p className="font-sans text-xs text-stone">
              Select a size to check availability
            </p>
          )}
        </div>

        {/* Quantity stepper + Add to cart */}
        <div className="mt-6 flex items-end gap-4">
          <div>
            <p className="eyebrow mb-2">Qty</p>
            <QuantityStepper
              value={quantity}
              min={1}
              max={maxQty}
              onChange={setQuantity}
            />
          </div>
          <div className="flex-1">
            <AddToCartButton
              product={product}
              size={selectedSize}
              color={hasColorData ? selectedColor || undefined : undefined}
              variantStock={selectedVariant?.stock ?? 0}
              quantity={quantity}
              disabled={!selectedSize || (selectedVariant?.stock ?? 0) <= 0}
            />
          </div>
        </div>

        {/* Accordion */}
        <div className="mt-10">
          <Accordion data={accordionData} />
        </div>

        {/* Reviews */}
        <ReviewSection productId={product.id} />
      </div>
    </div>
  );
}