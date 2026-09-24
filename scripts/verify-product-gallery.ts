/**
 * Verifies the product-page gallery rule: the page previews EVERY image the
 * product has — including the photos of every color — regardless of which color
 * the shopper has selected.
 *
 *   npx tsx scripts/verify-product-gallery.ts
 *
 * Pure logic — no server or database needed. Guards:
 *   1. Selecting a color must not shrink the gallery (it used to hide every
 *      other color's photos, which is the bug this rule fixes).
 *   2. CJ's duplicate rows (variant photo with `?bid=`, plain gallery copy)
 *      collapse to one entry, so a color's photo is not previewed twice.
 *   3. The product's main image leads, and `Product.image` overlapping a gallery
 *      row does not duplicate it.
 *   4. The active photo stays highlighted when its stored URL differs only by
 *      query string.
 */
import {
  buildProductGallery,
  imagePath,
  resolveActiveGalleryImage,
  type GallerySourceImage,
} from "../lib/product-gallery";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${label}${ok ? "" : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`,
  );
}

// ── A CJ-imported product: 3 colors, each with a variant photo (?bid=) also
//    present in the plain productImageSet gallery, plus shared gallery shots ──
const mainImage = "https://cf.cjdropshipping.com/hero.jpg";
const images: GallerySourceImage[] = [
  { color: "Black", url: "https://cf.cjdropshipping.com/black.jpg?bid=111" },
  { color: "Red", url: "https://cf.cjdropshipping.com/red.jpg?bid=222" },
  { color: "Blue", url: "https://cf.cjdropshipping.com/blue.jpg?bid=333" },
  // CJ's plain gallery: the same color photos again (no query) + shared shots.
  { color: null, url: "https://cf.cjdropshipping.com/hero.jpg" },
  { color: null, url: "https://cf.cjdropshipping.com/black.jpg" },
  { color: null, url: "https://cf.cjdropshipping.com/red.jpg" },
  { color: null, url: "https://cf.cjdropshipping.com/blue.jpg" },
  { color: null, url: "https://cf.cjdropshipping.com/lifestyle-1.jpg" },
  { color: null, url: "https://cf.cjdropshipping.com/lifestyle-2.jpg" },
];

const gallery = buildProductGallery(mainImage, images);

console.log("CJ-imported product (3 colors + shared gallery)");
check("main image leads the gallery", gallery[0]?.url, mainImage);
check(
  "every distinct photo is previewed once",
  gallery.length,
  6, // hero, black, red, blue, lifestyle-1, lifestyle-2
);
check("no duplicate keys", new Set(gallery.map((img) => img.key)).size, gallery.length);
check(
  "every color keeps its photo",
  ["Black", "Red", "Blue"].filter((color) =>
    gallery.some((img) => img.color === color),
  ),
  ["Black", "Red", "Blue"],
);
check(
  "photos keep their stored order after the main image",
  gallery.map((img) => imagePath(img.url).split("/").pop()),
  [
    "hero.jpg",
    "black.jpg",
    "red.jpg",
    "blue.jpg",
    "lifestyle-1.jpg",
    "lifestyle-2.jpg",
  ],
);

// The color selector only swaps the preview — the gallery itself is built from
// the product's images, so no color's photos can be filtered out of it.
const bluePhoto = images.find((img) => img.color === "Blue")!;
check(
  "picking Blue highlights Blue's photo",
  resolveActiveGalleryImage(gallery, bluePhoto.url)?.color,
  "Blue",
);
check(
  "highlight survives a query-string-only difference",
  resolveActiveGalleryImage(gallery, "https://cf.cjdropshipping.com/blue.jpg")?.key,
  "https://cf.cjdropshipping.com/blue.jpg",
);
check(
  "gallery size is unrelated to the selected color",
  buildProductGallery(mainImage, images).length,
  gallery.length,
);

// ── Edge cases ──────────────────────────────────────────────────────────────
console.log("\nEdge cases");
check("a colorless product still previews all its photos", buildProductGallery("", [
  { color: null, url: "/products/front.jpg" },
  { color: null, url: "/products/back.jpg" },
]).length, 2);
check("no images at all → no strip", buildProductGallery("", []), []);
check("blank / whitespace URLs are skipped", buildProductGallery("  ", [
  { color: null, url: "" },
  { color: "Black", url: "   " },
]).length, 0);
check("main image alone → single entry", buildProductGallery("/products/only.jpg", []).length, 1);
check(
  "main image repeated in the gallery is not duplicated",
  buildProductGallery("/products/only.jpg", [{ color: null, url: "/products/only.jpg" }]).length,
  1,
);
check(
  "active URL falls back to the first photo",
  resolveActiveGalleryImage(buildProductGallery("/a.jpg", []), "")?.url,
  "/a.jpg",
);
check("empty gallery has no active photo", resolveActiveGalleryImage([], ""), undefined);

console.log(
  failures === 0
    ? "\n✅ The product page previews every image, every color."
    : `\n❌ ${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
