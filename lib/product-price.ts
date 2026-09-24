/**
 * Single source of truth for "what price does a product show?".
 *
 * The product card (ProductGrid) and the product page (ProductClient + the
 * /product/[id] server component) MUST agree: the card advertising
 * "From $45.00" while the page shows a different number (or drops the "From"
 * prefix) is a customer-facing inconsistency — and it happened because the two
 * places each re-implemented the rule.
 *
 * Prices are stored in USD. This module only resolves *which USD amount* to
 * display; converting and formatting the viewer's currency stays in the
 * component via `useViewerCurrency()`.
 */

export type PricedVariant = { price?: number | null };

export type ProductPriceSummary = {
  /** Lowest variant price, or the product price when no variant is priced. */
  minPrice: number;
  /** Highest variant price, or the product price when no variant is priced. */
  maxPrice: number;
  /** True when the product has priced variants that do not all cost the same. */
  hasPriceRange: boolean;
  /** How many variants carry an explicit price (unset prices are ignored). */
  pricedVariantCount: number;
};

/**
 * A `null`/missing variant price means "unset", NOT "free" — so those variants
 * are ignored instead of contributing a $0.00 to the range. Only when no
 * variant has a price at all do we fall back to the product's own price.
 */
export function summarizeProductPrice(
  basePrice: number,
  variants?: PricedVariant[] | null,
): ProductPriceSummary {
  const prices = (variants ?? [])
    .map((variant) => variant?.price)
    .filter(
      (price): price is number =>
        typeof price === "number" && Number.isFinite(price),
    );

  if (prices.length === 0) {
    return {
      minPrice: basePrice,
      maxPrice: basePrice,
      hasPriceRange: false,
      pricedVariantCount: 0,
    };
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    minPrice,
    maxPrice,
    hasPriceRange: minPrice !== maxPrice,
    pricedVariantCount: prices.length,
  };
}

/**
 * Price to show for a variant, falling back to the product's resolved starting
 * price when the variant has no price of its own. Pass the value returned as
 * `minPrice` from `summarizeProductPrice()` so a variant-less price never
 * resolves to an unset base price of 0.
 */
export function resolveVariantPrice(
  variantPrice: number | null | undefined,
  startingPrice: number,
): number {
  return typeof variantPrice === "number" && Number.isFinite(variantPrice)
    ? variantPrice
    : startingPrice;
}
