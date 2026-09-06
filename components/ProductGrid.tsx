"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductBadgeWrapper from "./ProductBadgeWrapper";
import WishlistButton from "./WishlistButton";
import StarRating from "./StarRating";
import { addToCart } from "@/lib/cart";
import { normalizeImageSrc } from "@/lib/image";
import { useViewerCurrency } from "@/lib/use-viewer-currency";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProductGrid({ products }: { products: any[] }) {
  const router = useRouter();
  // Storefront prices are stored in USD; render them in the viewer's currency
  // with the SAME conversion/rounding checkout uses (toDisplay), falling back
  // to USD before the context loads or when the rate is stale.
  const { toDisplay, fmt } = useViewerCurrency();
  const [reviewData, setReviewData] = useState<Record<string, { average: number; count: number }>>({});

  // Fetch review summaries for displayed products
  useEffect(() => {
    if (products.length === 0) return;
    const ids = products.map((p) => p.id);
    fetch(`/api/reviews/summary?ids=${encodeURIComponent(ids.join(","))}`)
      .then((res) => res.ok ? res.json() : {})
      .then((data: any) => setReviewData(data.summary ?? {}))
      .catch(() => {});
  }, [products]);

  // Resolve the best image for a product: main image first, then first color image, then fallback
  const getProductImage = (product: any): string => {
    if (product.image) return product.image;
    if (product.images?.length > 0 && product.images[0].url) return product.images[0].url;
    return "";
  };

  const handleQuickAdd = (
    e: React.MouseEvent,
    product: any,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const variants = product.variants || [];

    // If no variants or multiple variants, navigate to product page for size selection
    if (variants.length !== 1) {
      router.push(`/product/${product.id}`);
      return;
    }

    const variant = variants[0];
    const result = addToCart(
      {
        id: product.id,
        name: product.name,
        price: variant.price,
        compareAtPrice: product.compareAtPrice,
        image: getProductImage(product),
        stock: variant.stock,
      },
      variant.size,
      variant.stock,
    );

    if (!result.success) {
      // Optionally surface the error — navigate to product page as fallback
      router.push(`/product/${product.id}`);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
    >
      {products.map((product) => {
        const variantPrices = product.variants.map((v: any) => v.price);
        const minPrice =
          variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
        const maxPrice =
          variantPrices.length > 0 ? Math.max(...variantPrices) : product.price;
        const hasVariants = variantPrices.length > 0;
        const isSinglePrice = minPrice === maxPrice;

        let priceDisplay = fmt(toDisplay(product.price));
        if (hasVariants) {
          if (isSinglePrice) {
            priceDisplay = fmt(toDisplay(minPrice));
          } else {
            priceDisplay = `From ${fmt(toDisplay(minPrice))}`;
          }
        }

        const hasDiscount =
          product.compareAtPrice && product.compareAtPrice > product.price;

        return (
          <motion.div
            key={product.id}
            variants={item}
            className="card group relative flex cursor-pointer flex-col"
          >
            <Link href={`/product/${product.id}`} className="flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden bg-stone/5 border-b border-stone/10">
                <Image
                  src={normalizeImageSrc(getProductImage(product))}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <ProductBadgeWrapper product={product} />

                {/* Wishlist heart */}
                <div className="absolute right-2 top-2 z-10">
                  <WishlistButton productId={product.id} initialWishlisted={false} />
                </div>

                {/* Quick add overlay on hover */}
                <div
                  onClick={(e) => handleQuickAdd(e, product)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/0 transition-colors duration-200 group-hover:bg-ink/30"
                >
                  <span
                    className="translate-y-4 border border-white/80 bg-white/85 px-6 py-2.5 font-sans text-xs font-medium text-ink shadow-glass backdrop-blur-md opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-moss hover:text-white hover:border-moss cursor-pointer"
                  >
                    Quick Add
                  </span>
                </div>
              </div>

                <div className="flex flex-col gap-1.5 p-5">
                  <h3 className="font-sans text-sm font-medium text-ink line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base text-ink">
                      {priceDisplay}
                    </span>
                    {hasDiscount && (
                      <span className="font-sans text-xs text-stone line-through">
                        {fmt(toDisplay(product.compareAtPrice!))}
                      </span>
                    )}
                  </div>
                  {/* Reviews summary */}
                  {reviewData[product.id] && reviewData[product.id].count > 0 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={reviewData[product.id].average} size="sm" />
                      <span className="font-sans text-xs text-stone">
                        ({reviewData[product.id].count})
                      </span>
                    </div>
                  )}
                </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}