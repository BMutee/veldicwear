"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";
import SizeSelector from "./SizeSelector";
import WishlistButton from "./WishlistButton";
import ReviewSection from "./ReviewSection";
import DeliveryEstimate from "./DeliveryEstimate";
import SizeChart from "./SizeChart";
import type { SizeChartData } from "@/lib/size-chart";
import { normalizeImageSrc } from "@/lib/image";
import { htmlToPlainText } from "@/lib/html-text";
import {
  buildProductGallery,
  resolveActiveGalleryImage,
} from "@/lib/product-gallery";
import {
  resolveVariantPrice,
  summarizeProductPrice,
} from "@/lib/product-price";
import {
  isSelectionComplete,
  listProductColors,
  resolveSelectedVariant,
} from "@/lib/variant-selection";
import { useViewerCurrency } from "@/lib/use-viewer-currency";

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
  /** Per-product size chart content (Product.sizeChart), edited in Admin → Products. */
  sizeChart?: SizeChartData | null;
};

type AccordionItem = {
  title: string;
  content: string | ReactNode;
};

const DEFAULT_DESCRIPTION =
  "Built for the ground you cover. Premium materials meet considered construction for a silhouette that moves with you — on the trail, in the city, or on the long way home.";

/** Must agree with /shipping-policy: standard shipping is free on every order
 *  with no minimum, so this must NOT quote a threshold. The return window is
 *  imported from lib/returns elsewhere — keep this string qualitative. */
const SHIPPING_RETURNS =
  "Free standard shipping on every order, to every destination we serve. Express shipping available at checkout. Returns accepted within 30 days of delivery in unworn condition with original tags attached.";

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
              {typeof item.content === "string" ? (
                <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-stone">
                  {htmlToPlainText(item.content)}
                </p>
              ) : (
                item.content
              )}
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
  sizeChart,
}: ProductClientProps) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImage, setActiveImage] = useState(product.image);
  const [quantity, setQuantity] = useState(1);
  /** The thumbnail strip, so a color change can reveal the photo it selects. */
  const galleryRef = useRef<HTMLDivElement>(null);
  // USD-stored price rendered in the viewer's currency (same math as checkout).
  const { toDisplay, fmt } = useViewerCurrency();

  const availableColors = listProductColors(sizes);
  const hasColorData = availableColors.length > 0;
  // A product that offers colors is only identified once a color is chosen —
  // the "Select a color" gate below enforces it (see lib/variant-selection.ts).
  const colorSelected = Boolean(selectedColor);
  const selectionComplete = isSelectionComplete(sizes, selectedSize, selectedColor);

  // Sizes shown depend on the selected color (each color may offer a
  // different size run). Before a color is picked, show the union of sizes.
  const availableSizes = Array.from(
    new Set(
      sizes
        .filter((variant) => !hasColorData || !selectedColor || variant.color === selectedColor)
        .map((variant) => variant.size),
    ),
  );

  const selectedVariant = resolveSelectedVariant(sizes, selectedSize, selectedColor);

  // Same rule as the product card (lib/product-price.ts) so the page always
  // advertises the same price / "From" prefix as the card the shopper clicked.
  const { minPrice: startingPrice, hasPriceRange } = summarizeProductPrice(
    product.price,
    sizes,
  );

  const displayPrice = selectedVariant
    ? resolveVariantPrice(selectedVariant.price, startingPrice)
    : startingPrice;
  // Before a variant is picked and prices differ, prefix the lowest price with
  // "From" — exactly like the product card ("From $X").
  const showFromPrefix = !selectedVariant && hasPriceRange;

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > displayPrice;

  const maxQty = Math.min(selectedVariant?.stock ?? 99, 10);

  // ── Gallery ───────────────────────────────────────────────────────────────
  // The page previews EVERY image the product has — the photos of every color —
  // whatever the shopper has picked. Selecting a color only swaps which photo
  // leads the preview; it never hides another color's photos from the strip.
  // Ordering and duplicate collapsing live in lib/product-gallery.ts.
  const gallery = buildProductGallery(product.image, productImages);

  const activeGalleryImage = resolveActiveGalleryImage(gallery, activeImage);
  const mainImage = activeGalleryImage?.url || product.image;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Clear the size if it isn't offered in the new color.
    const stillOffered = sizes.some(
      (variant) => variant.color === color && variant.size === selectedSize,
    );
    if (selectedSize && !stillOffered) setSelectedSize("");
    // Show off this color: its first photo leads the preview. The strip still
    // lists every color's images, so nothing is lost by picking one.
    const matchingImage = productImages.find((img) => img.color === color);
    if (matchingImage?.url) setActiveImage(matchingImage.url);
  };

  // An imported gallery runs to 30+ photos, so the picked color's photo can sit
  // outside the visible strip. Reveal it by scrolling the strip itself — never
  // the page, or choosing a color would yank the shopper up the page.
  useEffect(() => {
    const strip = galleryRef.current;
    const active = strip?.querySelector<HTMLElement>(
      '[data-gallery-active="true"]',
    );
    if (!strip || !active) return;

    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < strip.scrollLeft || right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({
        left: left - strip.clientWidth / 2 + active.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [mainImage]);

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
      title: "Size Chart",
      content: (
        <SizeChart
          sizes={sizes.map((variant) => variant.size)}
          data={sizeChart}
          selectedSize={selectedSize}
        />
      ),
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

        {/* Thumbnail strip — every image the product has, every color */}
        {gallery.length > 1 && (
          <div
            ref={galleryRef}
            className="relative mt-3 flex gap-3 overflow-x-auto pb-1"
          >
            {gallery.map((img, index) => {
              const isActive = img.key === activeGalleryImage?.key;
              return (
                <button
                  key={img.key}
                  type="button"
                  onClick={() => setActiveImage(img.url)}
                  data-gallery-active={isActive ? "true" : "false"}
                  aria-current={isActive}
                  className={`relative aspect-[4/5] w-[80px] shrink-0 overflow-hidden border transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? "border-moss"
                      : "border-stone/10 hover:border-moss/60"
                  }`}
                  aria-label={`View image ${index + 1} of ${gallery.length}${
                    img.color ? ` (${img.color})` : ""
                  }`}
                >
                  <Image
                    src={normalizeImageSrc(img.url)}
                    alt={`${product.name} - image ${index + 1}${
                      img.color ? ` (${img.color})` : ""
                    }`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
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
          {showFromPrefix && (
            <span className="font-sans text-sm text-stone">From</span>
          )}
          <span className="font-mono text-2xl text-ink">
            {fmt(toDisplay(displayPrice))}
          </span>
          {hasDiscount && (
            <span className="font-sans text-sm text-stone line-through">
              {fmt(toDisplay(product.compareAtPrice!))}
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
                    aria-pressed={isSelected}
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
            <p
              className={`mt-3 font-sans text-sm ${
                colorSelected ? "text-moss" : "text-stone"
              }`}
            >
              {colorSelected
                ? `Selected: ${selectedColor}`
                : "Choose a color — required"}
            </p>
          </div>
        )}

        {/* Size selector */}
        <div className="mt-6">
          <SizeSelector
            sizes={sizes.filter((variant) =>
              !hasColorData || !selectedColor ? availableSizes.includes(variant.size) : variant.color === selectedColor,
            )}
            selected={selectedSize}
            onChange={setSelectedSize}
            resetKey={selectedColor}
          />
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
          ) : hasColorData && !colorSelected ? (
            <p className="font-sans text-xs text-stone">
              Select a color to check availability
            </p>
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
              // Products that offer colors must have one chosen first.
              colorRequired={hasColorData}
              variantStock={selectedVariant?.stock ?? 0}
              quantity={quantity}
              disabled={!selectionComplete || (selectedVariant?.stock ?? 0) <= 0}
            />
          </div>
        </div>

        {/* Delivery estimate — Canada default, tabbed per destination */}
        <div className="mt-8">
          <DeliveryEstimate />
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