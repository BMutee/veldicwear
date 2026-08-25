import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductGrid from "./ProductGrid";
import type { FeaturedBlockContent, FeaturedBlockStyles } from "@/lib/block-section";
import { FEATURED_BLOCK_DEFAULT_STYLES } from "@/lib/block-section";
import Reveal from "@/components/motion/Reveal";

// ---------------------------------------------------------------------------
// FeaturedProducts — now sourced from a FEATURED_PRODUCTS block
// (SiteSection("featured-products") via sectionKey), manually curated with an
// ordered product-ID list. The legacy SiteSection("featured-products")
// content row is left in place but UNREAD by app code (see lib/featured-section.ts).
//
// Render rules:
//   - Query `where: { id: { in: productIds }, active: true }` — inactive
//     (unpublished) products never appear on the live storefront.
//   - Preserve the admin's productIds array order (a DB `in` query does not
//     guarantee order) and silently skip any ID that is missing or inactive —
//     no broken cards, no crash.
//   - If no block exists yet (pre-migration / fresh DB), fall back to the
//     legacy "latest 8 featured (else latest 8) active products" query.
// ---------------------------------------------------------------------------

type FeaturedProductsProps = {
  content?: FeaturedBlockContent | null;
  styles?: FeaturedBlockStyles | null;
};

export default async function FeaturedProducts({
  content,
  styles: storedStyles,
}: FeaturedProductsProps) {
  const s = storedStyles ?? FEATURED_BLOCK_DEFAULT_STYLES;
  const ids = content?.productIds ?? [];

  let displayProducts: Awaited<ReturnType<typeof queryBlockProducts>>;
  if (ids.length > 0) {
    const products = await queryBlockProducts(ids);
    const byId = new Map(products.map((p) => [p.id, p]));
    displayProducts = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  } else {
    // No block yet — legacy behavior, now also restricted to active products.
    const featured = await prisma.product.findMany({
      take: 8,
      where: { featured: true, active: true },
      include: { variants: true, images: true },
      orderBy: { createdAt: "desc" },
    });
    displayProducts =
      featured.length > 0
        ? featured
        : await prisma.product.findMany({
            take: 8,
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
