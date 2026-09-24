/**
 * Gallery rules for the product page.
 *
 * The storefront previews EVERY image a product has — the photos of every
 * color — no matter which color the shopper has picked. Picking a color only
 * changes which photo leads the preview; it must never hide another color's
 * photos, which is what the page used to do by filtering the thumbnails down to
 * the selected color.
 *
 * Two data quirks shape the rules here:
 *
 * 1. The product's `image` column and its `ProductImage` rows overlap — the main
 *    image is usually also stored as a gallery row. It leads the gallery once.
 * 2. CJ returns the same photo twice: once on the variant (tagged with the
 *    color, carrying a `?bid=` business id) and once in the plain gallery
 *    (`productImageSet`, no query string). Those are one photo, so entries
 *    collapse by file path — otherwise every color's photo appears twice.
 */

export type GallerySourceImage = {
  color: string | null;
  url: string;
};

/** One entry of the product gallery. */
export type GalleryImage = {
  /** Stable, unique key — the image's file path (see `imagePath`). */
  key: string;
  /** The color this photo belongs to, or null for a shared/gallery photo. */
  color: string | null;
  url: string;
};

/** Identify an image by its file path, ignoring the query string / fragment. */
export function imagePath(url: string): string {
  return url.split(/[?#]/)[0];
}

/**
 * Build the ordered gallery for a product: the main image first (when it is
 * set), then the stored images in their saved order, with duplicate file paths
 * collapsed to their first occurrence.
 */
export function buildProductGallery(
  mainImage: string | null | undefined,
  images: GallerySourceImage[],
): GalleryImage[] {
  const gallery: GalleryImage[] = [];
  const seenPaths = new Set<string>();

  const push = (url: string | null | undefined, color: string | null) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    const path = imagePath(trimmed);
    if (seenPaths.has(path)) return;
    seenPaths.add(path);
    gallery.push({ key: path, color, url: trimmed });
  };

  push(mainImage, null);
  for (const image of images) push(image.url, image.color);

  return gallery;
}

/**
 * The photo currently previewed: the gallery entry matching the active URL, so
 * the preview shows the same (de-duplicated) URL the strip highlights. Falls
 * back to the first gallery entry (and `undefined` for an empty gallery, leaving
 * the caller to choose a final fallback).
 */
export function resolveActiveGalleryImage(
  gallery: GalleryImage[],
  activeUrl: string,
): GalleryImage | undefined {
  const activePath = imagePath(activeUrl ?? "");
  return gallery.find((image) => image.key === activePath) ?? gallery[0];
}
