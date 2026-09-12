import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductGrid from "./ProductGrid";
import type { FeaturedBlockContent, FeaturedBlockStyles } from "@/lib/block-section";
import { FEATURED_BLOCK_DEFAULT_STYLES } from "@/lib/block-section";
import Reveal from "@/components/motion/Reveal";

// ---------------------------------------------------------------------------
// FeaturedProducts — sourced from the featured-products section's
// _featured-products static block: PINNED product IDs (admin order) first,
// with remaining slots AUTO-FILLED by the newest active products (hybrid:
// curation + "New Arrivals" freshness, always up to 8).
//
// Render rules:
//   - Query `where: { id: { in: pinnedIds }, active: true }` — inactive
//     (unpublished) products never appear on the live storefront.
//   - Preserve the admin's pinned order (a DB `in` query does not guarantee
//     order) and silently skip any pinned ID that is missing or inactive —
//     no broken cards, no crash.
//   - Auto-fill: newest active products (createdAt desc), excluding pinned
//     IDs, fill the grid up to 8. Zero pins = fully automatic newest 8.
// ---------------------------------------------------------------------------

type FeaturedProductsProps = {
  content?: FeaturedBlockContent | null;
  styles?: FeaturedBlockStyles | null;
};

const MAX_FEATURED_PRODUCTS = 8;

export default async function FeaturedProducts({
  content,
  styles: storedStyles,
}: FeaturedProductsProps) {
  const s = storedStyles ?? FEATURED_BLOCK_DEFAULT_STYLES;
  const pinnedIds = content?.productIds ?? [];

  let displayProducts: Awaited<ReturnType<typeof queryBlockProducts>>;
  if (pinnedIds.length > 0) {
    const products = await queryBlockProducts(pinnedIds);
    const byId = new Map(products.map((p) => [p.id, p]));
    const pinned = pinnedIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    // Top up with the newest active products (skipping anything pinned,
// valid or not) so the grid stays full at 8 as catalog churns.
    const needed = MAX_FEATURED_PRODUCTS - pinned.length;
    const fill =
      needed > 0
        ? await prisma.product.findMany({
            take: needed,
            where: { active: true, id: { notIn: pinnedIds } },
            include: { variants: true, images: true },
            orderBy: { createdAt: "desc" },
          })
        : [];
    displayProducts = [...pinned, ...fill];
  } else {
    // Nothing pinned — fully automatic: the 8 newest active products.
    displayProducts = await prisma.product.findMany({
      take: MAX_FEATURED_PRODUCTS,
      where: { active: true },
      include: { variants: true, images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  const title = content?.featuredSectionTitle ?? "New Arrivals";
  const subtitle =
    content?.featuredSectionSubtitle ?? "Considered pieces, built to last.";

  return (
    <>
      <style>{`\n        .veldic-featured-products {\n          --featured-pad-top: ${s.paddingTop.mobile}px;\n          --featured-pad-bottom: ${s.paddingBottom.mobile}px;\n          --featured-pad-x: ${s.paddingX.mobile}px;\n          --featured-heading-fs: ${s.headingFontSize.mobile}px;\n        }\n        @media (min-width: 768px) {\n          .veldic-featured-products {\n            --featured-pad-top: ${s.paddingTop.desktop}px;\n            --featured-pad-bottom: ${s.paddingBottom.desktop}px;\n            --featured-pad-x: ${s.paddingX.desktop}px;\n            --featured-heading-fs: ${s.headingFontSize.desktop}px;\n          }\n        }\n      `}</style>
      <section
        className="veldic-featured-products"
        style={{
          backgroundColor: s.backgroundColor,
          color: s.textColor,
          paddingTop: "var(--featured-pad-top)",
          paddingBottom: "var(--featured-pad-bottom)",
          paddingLeft: "var(--featured-pad-x)",
          paddingRight: "var(--featured-pad-x)",
        }}
      >
        {/* Entrance animation (admin-configurable); reduced-motion is fully
          disabled via CSS regardless of this setting. The grid's own stagger
          composes inside this container reveal. */}
      <Reveal type={s.animation.type} scrollTrigger={s.animation.scrollTrigger}>
      <div className="section-grounded">
          {/* Section header */}
          <div className="mb-16">
            <h2
              className="font-display font-semibold tracking-tight"
              style={{ fontSize: "var(--featured-heading-fs)" }}
            >
              {title}
            </h2>
            <p className="mt-3 font-sans text-base text-stone">{subtitle}</p>
          </div>

          <ProductGrid products={displayProducts} />

          {/* View All link */}
          <div className="mt-16 text-center">
            <Link href="/shop" className="btn-outline cursor-pointer">
              Shop all
              <span className="text-base transition-transform duration-200 group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
        </Reveal>
      </section>
    </>
  );
}

async function queryBlockProducts(ids: string[]) {
  return prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: { variants: true, images: true },
  });
}
