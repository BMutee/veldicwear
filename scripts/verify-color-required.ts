/**
 * Verifies the "color is required when the product has colors" rule.
 *
 *   npx tsx scripts/verify-color-required.ts
 *
 * Pure logic — no server or database needed. Guards:
 *   1. Colored products: no variant is resolved (and no line is accepted) until
 *      a color is picked — previously the first variant matching the size won,
 *      which silently added/shipped the wrong color.
 *   2. Colorless products: unchanged — size alone is enough.
 *   3. Mixed data: a colorless variant for a size is still reachable without a
 *      color (no false rejections).
 */
import {
  colorsForSize,
  isSelectionComplete,
  listProductColors,
  matchCartVariant,
  productHasColors,
  resolveSelectedVariant,
} from "../lib/variant-selection";

type Variant = { size: string; color?: string | null; stock: number };

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${label}${ok ? "" : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`,
  );
}

// ── A product that offers colors (the live catalog shape) ───────────────────
const colored: Variant[] = [
  { size: "M", color: "Black", stock: 10 },
  { size: "M", color: "Blue", stock: 4 },
  { size: "L", color: "Black", stock: 7 },
];

console.log("Colored product (Black / Blue)");
check("lists colors once, in variant order", listProductColors(colored), ["Black", "Blue"]);
check("colors for size M", colorsForSize(colored, "M"), ["Black", "Blue"]);
check("color required?", productHasColors(colored), true);
check("size only → selection incomplete", isSelectionComplete(colored, "M", ""), false);
check("color + size → complete", isSelectionComplete(colored, "M", "Blue"), true);
check("no color → no variant resolved", resolveSelectedVariant(colored, "M", ""), undefined);
check(
  "Blue M resolves to Blue M (not the first M)",
  resolveSelectedVariant(colored, "M", "Blue")?.color,
  "Blue",
);
check("no color → checkout rejects the line", matchCartVariant(colored, "M", null), {
  ok: false,
  reason: "color-required",
  availableColors: ["Black", "Blue"],
});
check("Blue M → checkout accepts", matchCartVariant(colored, "M", "Blue").ok, true);
check("unknown color → not found", matchCartVariant(colored, "M", "Red"), {
  ok: false,
  reason: "not-found",
  availableColors: ["Black", "Blue"],
});

// ── A product without colors (must NOT become stricter) ─────────────────────
const plain: Variant[] = [
  { size: "M", color: null, stock: 9 },
  { size: "L", color: null, stock: 3 },
];

console.log("\nColorless product");
check("color required?", productHasColors(plain), false);
check("no colors listed", listProductColors(plain), []);
check("size alone → complete", isSelectionComplete(plain, "L", ""), true);
check("no size → incomplete", isSelectionComplete(plain, "", ""), false);
check("size alone resolves the variant", resolveSelectedVariant(plain, "L", "")?.size, "L");
check("checkout accepts a colorless line", matchCartVariant(plain, "L", null).ok, true);
check("unknown size → not found", matchCartVariant(plain, "XXL", null), {
  ok: false,
  reason: "not-found",
  availableColors: [],
});

// ── Mixed data: colored run + a one-size colorless variant ──────────────────
const mixed: Variant[] = [
  { size: "M", color: "Black", stock: 5 },
  { size: "OS", color: null, stock: 5 },
];

console.log("\nMixed product (colored M + colorless OS)");
check("color required overall", productHasColors(mixed), true);
check("size only → incomplete", isSelectionComplete(mixed, "M", ""), false);
check("colorless OS line still accepted", matchCartVariant(mixed, "OS", null).ok, true);
check("colored M line still requires a color", matchCartVariant(mixed, "M", null), {
  ok: false,
  reason: "color-required",
  availableColors: ["Black"],
});

console.log(
  failures === 0
    ? "\n✅ Color is required exactly for products that offer colors."
    : `\n❌ ${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
