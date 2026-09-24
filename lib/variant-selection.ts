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
