/**
 * One-time data migration:
 * Migrate the Featured Products section to a manually-curated
 * FEATURED_PRODUCTS block owned by SiteSection("featured-products").
 *
 * Seeds the initial Block's `productIds` from the products that are live
 * today (the exact query the legacy FeaturedProducts component ran: the 8
 * most recently created featured:true products, else the 8 most recent), in
 * their current display order — so the admin's first view of the picker shows
 * what shoppers see right now, not an empty list. Also carries the legacy
 * row's styles and title/subtitle over into the block.
 *
 * Guarded (non-repeatable): only runs when no FEATURED_PRODUCTS block exists
 * for the section; re-running is a no-op so it never overwrites curation the
 * admin has since made in the picker.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parseFeaturedContent } from "../lib/featured-section";
import { normalizeFeaturedBlockStyles } from "../lib/block-section";

const KEY = "featured-products";
const TYPE = "FEATURED_PRODUCTS";

async function main() {
  const existing = await prisma.block.findFirst({
    where: { sectionKey: KEY, type: TYPE },
    orderBy: { order: "asc" },
  });
  if (existing) {
    console.log(`Block(${TYPE}) already exists for section "${KEY}" — no-op (id ${existing.id}).`);
    await prisma.$disconnect();
    return;
  }

  // 1. Current live product selection, exactly as legacy FeaturedProducts.tsx
  //    queried it (featured:true latest 8, else latest 8).
  const featured = await prisma.product.findMany({
    take: 8,
    where: { featured: true },
    include: { variants: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  const live =
    featured.length > 0
      ? featured
      : await prisma.product.findMany({
          take: 8,
          include: { variants: true, images: true },
          orderBy: { createdAt: "desc" },
        });

  // 2. Legacy row: styles + title/subtitle.
  const section = await prisma.siteSection.findUnique({ where: { key: KEY } });
  const legacy = parseFeaturedContent(section?.content);
  const blockStyles = normalizeFeaturedBlockStyles(legacy.styles);

  const productIds = live.map((p) => p.id);
  const blockContent = {
    productIds,
    featuredSectionTitle: legacy.featuredSectionTitle,
    featuredSectionSubtitle: legacy.featuredSectionSubtitle,
  };

  console.log("=== BEFORE ===");
  console.log("Legacy SiteSection('featured-products') content:");
  console.log(section?.content ?? "(none)");
  console.log("\nCurrently live product selection (display order):");
  live.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.id}) active=${p.active}`));

  const block = await prisma.block.create({
    data: {
      section: { connect: { key: KEY } },
      type: TYPE,
      order: 0,
      content: blockContent as Prisma.InputJsonValue,
      styles: blockStyles as Prisma.InputJsonValue,
    },
  });

  console.log("\n=== AFTER ===");
  console.log(`Created Block id=${block.id} type=${TYPE} order=${block.order}`);
  console.log("Block content:", JSON.stringify(blockContent));
  console.log("Block styles:", JSON.stringify(blockStyles));
  console.log(
    "\nLegacy SiteSection('featured-products') row left in place (unread by app code) — same pattern as hero/banner."
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
