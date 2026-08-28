/**
 * Full re-import idempotency test on an EXISTING imported product.
 * Snapshots Product + variants + images before, runs importCJProduct(),
 * and diffs after. Usage: npx tsx --env-file=.env scripts/test-full-reimport.ts [pid]
 */
import { prisma } from "@/lib/prisma";
import { importCJProduct } from "@/lib/cj-import";

type Snap = {
  product: Record<string, unknown>;
  variants: Array<Record<string, unknown>>;
  images: Array<{ color: string | null; url: string }>;
};

async function snapshot(pid: string): Promise<Snap> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: pid },
    include: { variants: true, images: true },
  });
  const { id: _id, createdAt: _c, ...p } = product;
  return {
    product: p as Record<string, unknown>,
    variants: product.variants
      .map(({ id: _i, productId: _p, ...v }) => v as Record<string, unknown>)
      .sort((a, b) => String(a.size).localeCompare(String(b.size))),
    images: product.images.map((i) => ({ color: i.color, url: i.url })).sort((a, b) => a.url.localeCompare(b.url)),
  };
}

function diff(label: string, before: unknown, after: unknown) {
  const b = JSON.stringify(before);
  const a = JSON.stringify(after);
  if (b === a) {
    console.log(`  OK   ${label} unchanged`);
    return;
  }
  console.log(`  DIFF ${label}:`);
  if (label === "product fields" && typeof before === "object" && typeof after === "object") {
    const bo = before as Record<string, unknown>;
    const ao = after as Record<string, unknown>;
    for (const key of new Set([...Object.keys(bo), ...Object.keys(ao)])) {
      const bv = JSON.stringify(bo[key]);
      const av = JSON.stringify(ao[key]);
      if (bv !== av) console.log(`    field "${key}":\n      before: ${bv?.slice(0, 300)}\n      after:  ${av?.slice(0, 300)}`);
    }
  } else {
    console.log(`    before: ${b.slice(0, 800)}\n    after:  ${a.slice(0, 800)}`);
  }
}


async function main() {
  const pid = process.argv[2] ?? "2508300653521615300";

  const before = await snapshot(pid);
  console.log(`Before: ${before.variants.length} variants, ${before.images.length} images`);
  console.log("  variants:", JSON.stringify(before.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock, price: v.price, sku: v.sku, cjVariantId: v.cjVariantId }))));

  const result = await importCJProduct(pid);
  console.log("Re-import result:", result);

  const after = await snapshot(pid);
  console.log(`After:  ${after.variants.length} variants, ${after.images.length} images`);

  diff("product fields", before.product, after.product);
  diff("variant rows", before.variants, after.variants);
  diff("image rows", before.images, after.images);

  const dupeCheck = new Map<string, number>();
  for (const v of after.variants) {
    const key = `${v.size}|${v.color}`;
    dupeCheck.set(key, (dupeCheck.get(key) ?? 0) + 1);
  }
  const dupes = [...dupeCheck.entries()].filter(([, n]) => n > 1);
  console.log(dupes.length === 0 ? "  OK   no duplicate variants" : `  DUPES ${JSON.stringify(dupes)}`);
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
