/**
 * Price-label regression check: product card ↔ product page parity.
 *
 *   npx tsx scripts/verify-product-price-parity.ts
 *
 * No server or database required — this is pure logic.
 *
 * Background: the card (components/ProductGrid.tsx) and the product page
 * (app/product/[id]/page.tsx + components/ProductClient.tsx) each used to
 * implement their own "From $X" rule, which let the card advertise a starting
 * price while the page showed something else (worst case: "From $0.00", because
 * an unset variant price fell back to the raw Product.price column — 0 on
 * CJ-imported products).
 *
 * Both surfaces now call lib/product-price.ts. This script asserts:
 *   1. The shared rule reproduces the card's long-standing output byte for
 *      byte (so the card never regresses).
 *   2. The product page produces the SAME label as the card in every case.
 */
import { summarizeProductPrice } from "../lib/product-price";

type V = { price: number | null };

type Case = { name: string; base: number; variants?: V[] };

/** Historical product-card rule (ProductGrid before the refactor). */
function legacyCardLabel(base: number, variants?: V[]): string {
  const variantPrices = (variants ?? [])
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number");
  const minPrice =
    variantPrices.length > 0 ? Math.min(...variantPrices) : base;
  const maxPrice =
    variantPrices.length > 0 ? Math.max(...variantPrices) : base;
  const hasVariants = variantPrices.length > 0;
  const isSinglePrice = minPrice === maxPrice;

  let label = `$${base}`;
  if (hasVariants) {
    label = isSinglePrice ? `$${minPrice}` : `From $${minPrice}`;
  }
  return label;
}

/** Historical product-page rule (page.tsx startingPrice + ProductClient). */
function legacyPageLabel(base: number, variants?: V[]): string {
  const all = variants ?? [];
  const startingPrice = all.length
    ? Math.min(...all.map((v) => v.price ?? base))
    : base;
  const prices = all.map((v) => v.price ?? base);
  const min = prices.length ? Math.min(...prices) : base;
  const max = prices.length ? Math.max(...prices) : base;
  const hasRange = prices.length > 1 && min !== max;
  return hasRange ? `From $${startingPrice}` : `$${startingPrice}`;
}

/** Shared rule now used by BOTH the card and the product page. */
function sharedLabel(base: number, variants?: V[]): string {
  const { minPrice, hasPriceRange } = summarizeProductPrice(base, variants);
  return hasPriceRange ? `From $${minPrice}` : `$${minPrice}`;
}

const cases: Case[] = [
  { name: "no variants, base 0", base: 0 },
  { name: "no variants, base 60", base: 60 },
  {
    name: "every variant unpriced",
    base: 45,
    variants: [{ price: null }, { price: null }],
  },
  { name: "equal variant prices", base: 0, variants: [{ price: 45 }, { price: 45 }] },
  { name: "single variant", base: 0, variants: [{ price: 45 }] },
  {
    name: "range 45-50",
    base: 0,
    variants: [{ price: 45 }, { price: 50 }],
  },
  {
    name: "one priced, one unpriced",
    base: 0,
    variants: [{ price: null }, { price: 50 }],
  },
  {
    name: "unpriced variant inside a range",
    base: 0,
    variants: [{ price: null }, { price: 45 }, { price: 50 }],
  },
];

let cardRegressions = 0;
let pageMismatches = 0;

console.log("case                            card(old)  page(old)  shared     result");
console.log("-".repeat(78));

for (const { name, base, variants } of cases) {
  const card = legacyCardLabel(base, variants);
  const page = legacyPageLabel(base, variants);
  const shared = sharedLabel(base, variants);

  if (shared !== card) cardRegressions++;
  if (shared !== page) pageMismatches++;

  const notes = [
    shared === card ? "card-parity:OK" : "CARD REGRESSION",
    shared === page ? "page-parity:OK" : "page fixed → now matches card",
  ].join(", ");

  console.log(
    `${name.padEnd(31)} ${card.padEnd(10)} ${page.padEnd(10)} ${shared.padEnd(10)} ${notes}`,
  );
}

console.log("-".repeat(78));
if (cardRegressions > 0) {
  console.error(`❌ ${cardRegressions} card regression(s) — card labels changed.`);
  process.exit(1);
}
console.log(
  "✅ Card labels unchanged in all cases; product page agrees with the card everywhere." +
    (pageMismatches > 0
      ? ` (${pageMismatches} previously inconsistent page case(s) fixed.)`
      : ""),
);
