/**
 * Variant-selection rules shared by the product page, the cart and checkout.
 *
 * The rule the storefront needs: a product that offers COLORS cannot be added
 * to the cart until the shopper picks one. Products without colors need only a
 * size. This matters beyond UX — `item.color` identifies the variant, so a
 * colored line added without one used to silently resolve to whichever variant
 * matched the size first (wrong colour, wrong stock, and worst of all a wrong
 * `cjVariantId` at CJ fulfilment).
 */

export type SelectableVariant = {
  size: string;
  color?: string | null;
  stock?: number;
  price?: number | null;
};

/** Colors offered by the product, in variant order. */
export function listProductColors(variants: SelectableVariant[]): string[] {
  const colors: string[] = [];
  for (const variant of variants) {
    if (variant.color && !colors.includes(variant.color)) {
      colors.push(variant.color);
    }
  }
  return colors;
}

/** True when at least one variant carries a color → a color must be chosen. */
export function productHasColors(variants: SelectableVariant[]): boolean {
  return variants.some((variant) => Boolean(variant.color));
}

/** Colors offered for one specific size (used by the checkout guard). */
export function colorsForSize(
  variants: SelectableVariant[],
  size: string,
): string[] {
  return listProductColors(variants.filter((variant) => variant.size === size));
}

/**
 * The variant the shopper's current choices identify. Undefined until every
 * required choice is made: the color (when the product offers colors) and the
 * size.
 */
export function resolveSelectedVariant<T extends SelectableVariant>(
  variants: T[],
  size: string,
  color: string,
): T | undefined {
  if (!size) return undefined;
  const needsColor = productHasColors(variants);
  if (needsColor && !color) return undefined;
  return variants.find(
    (variant) =>
      variant.size === size && (!needsColor || variant.color === color),
  );
}

/** Whether the shopper has made every required choice. */
export function isSelectionComplete(
  variants: SelectableVariant[],
  size: string,
  color: string,
): boolean {
  if (!size) return false;
  return productHasColors(variants) ? Boolean(color) : true;
}

export type CartVariantMatch<T extends SelectableVariant> =
  | { ok: true; variant: T }
  | {
      ok: false;
      /** `color-required`: the size offers colors but the line has none. */
      reason: "color-required" | "not-found";
      availableColors: string[];
    };

/**
 * Server-side guard: match a cart line (size + optional color) to a stored
 * variant — rejecting a colored line that forgot its color instead of guessing.
 */
export function matchCartVariant<T extends SelectableVariant>(
  variants: T[],
  size: string,
  color: string | null | undefined,
): CartVariantMatch<T> {
  const sizeVariants = variants.filter((variant) => variant.size === size);
  const availableColors = listProductColors(sizeVariants);

  if (color == null) {
    if (availableColors.length > 0) {
      return { ok: false, reason: "color-required", availableColors };
    }
    const colorless = sizeVariants.find((variant) => !variant.color);
    return colorless
      ? { ok: true, variant: colorless }
      : { ok: false, reason: "not-found", availableColors };
  }

  const match = sizeVariants.find((variant) => variant.color === color);
  return match
    ? { ok: true, variant: match }
    : { ok: false, reason: "not-found", availableColors };
}

/**
 * Normalise an OrderItem.size into a bare size label.
 *
 * Orders created before the checkout's size/colour parsing was fixed stored a
 * compound value like "S, Color: Black Zone2" (or "Size: S"), while variants
 * store a bare size. Strip the decoration before matching, otherwise historical
 * orders can never be resolved back to a variant.
 */
export function normaliseItemSize(size: string): string {
  return (
    size
      .replace(/^\s*Size:\s*/i, "")
      .split(/,/)
      .map((part) => part.trim())
      .filter((part) => part && !/^Color:/i.test(part))[0] ?? size.trim()
  );
}

/**
 * Best-effort variant lookup for a line that is ALREADY in an order (admin cost
 * price / margin reporting, CJ fulfilment, cart price sync).
 *
 * Unlike matchCartVariant — which guards what the shopper is sending and must
 * reject a colored line that forgot its color — this resolves what we stored,
 * so it never rejects. It prefers size + color, then falls back to size alone so
 * orders that predate colors, or whose color no longer exists in the catalog,
 * still report a cost instead of "unknown". Matching on size alone used to hand
 * a multi-color product whichever variant happened to come first, so the Profit
 * panel could show a completely different colorway's cost price.
 */
export function findOrderItemVariant<T extends SelectableVariant>(
  variants: T[],
  size: string,
  color: string | null | undefined,
): T | undefined {
  const bareSize = normaliseItemSize(size);
  // "N/A" is what products without variants get stored as; there is no variant
  // row to match and therefore no cost price to report.
  if (!bareSize || bareSize === "N/A") return undefined;

  const sizeVariants = variants.filter((variant) => variant.size === bareSize);
  if (sizeVariants.length === 0) return undefined;

  if (color) {
    const byColor = sizeVariants.find((variant) => variant.color === color);
    if (byColor) return byColor;
  }

  // No usable color on the line: a colorless variant is the safest answer,
  // otherwise fall back to the first size match.
  return sizeVariants.find((variant) => !variant.color) ?? sizeVariants[0];
}

/**
 * Stable key identifying a cart line, shared by the cart page and
 * /api/cart/prices. Must include the color, otherwise two colorways of the same
 * size collapse onto one entry and both read the first one's price/stock.
 */
export function variantLineKey(
  id: string,
  size: string,
  color: string | null | undefined,
): string {
  return `${id}:${size}:${color ?? ""}`;
}
