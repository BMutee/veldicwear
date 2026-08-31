import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Lookbook from "@/components/Lookbook";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import SocialFeed from "@/components/SocialFeed";
import { parseStoredBlock, type FeaturedBlockContent, type FeaturedBlockStyles, type HeroBlockContent, type HeroBlockStyles } from "@/lib/block-section";
import { prisma } from "@/lib/prisma";
import { getHomeSections } from "@/lib/home-sections";
import { verifyPreviewToken } from "@/lib/preview-token";
import { SECTION_REGISTRY } from "@/lib/section-registry";
import SectionHighlighter from "@/components/SectionHighlighter";
import { Fragment } from "react";

// Editor preview wrappers label each section with its registry display name.
const SECTION_NAMES: Record<string, string> = Object.fromEntries(
  SECTION_REGISTRY.map((section) => [section.key, section.name])
);

export const dynamic = "force-dynamic";

// ─── Homepage = ordered sections (Shopify JSON-template logic) ───────────────
// The render order and visibility live in the database (SiteSection.position
// and SiteSection.published), managed by /admin/editor. This file only maps
// section keys to components. With a valid preview token (?preview=1&t=…,
// minted by the admin editor) draft/hidden sections render too — that is how
// the editor's live preview shows sections before they go live.

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const preview =
    params.preview === "1" && verifyPreviewToken(typeof params.t === "string" ? params.t : null);

  const { sections } = await getHomeSections();
  const visible = preview ? sections : sections.filter((section) => section.published);
  const renders = (key: string) => visible.some((section) => section.key === key);

  // Block-backed sections (hero, banner, featured-products) read their content
  // from Block rows. Fetch only for sections actually being rendered.
  let heroBlock: { type: string; content: unknown; styles: unknown } | null = null;
  let bannerBlock: { type: string; content: unknown; styles: unknown } | null = null;
  let featuredBlock: { type: string; content: unknown; styles: unknown } | null = null;
  if (renders("hero") || renders("banner") || renders("featured-products")) {
    try {
      [heroBlock, bannerBlock, featuredBlock] = await Promise.all([
        renders("hero")
          ? prisma.block.findFirst({ where: { sectionKey: "hero", type: "HERO" }, orderBy: { order: "asc" } })
          : Promise.resolve(null),
        renders("banner")
          ? prisma.block.findFirst({ where: { sectionKey: "banner", type: "HERO" }, orderBy: { order: "asc" } })
          : Promise.resolve(null),
        renders("featured-products")
          ? prisma.block.findFirst({ where: { sectionKey: "featured-products", type: "FEATURED_PRODUCTS" }, orderBy: { order: "asc" } })
          : Promise.resolve(null),
      ]);
    } catch {
      // If the database is unreachable, render the page with default content
      // rather than crashing the entire site.
    }
  }

  const hero = heroBlock ? parseStoredBlock("HERO", heroBlock.content, heroBlock.styles) : null;
  // The Banner is the promo-strip variant of the HERO block type
  // (sectionKey "banner") — the legacy SiteSection("banner") content row is
  // left in place but is no longer read here.
  const banner = bannerBlock ? parseStoredBlock("HERO", bannerBlock.content, bannerBlock.styles) : null;
  // FeaturedProducts is a manually-curated FEATURED_PRODUCTS block owned by
  // SiteSection("featured-products") — the legacy content row is left in place
  // but is no longer read here.
  const featured = featuredBlock ? parseStoredBlock("FEATURED_PRODUCTS", featuredBlock.content, featuredBlock.styles) : null;

  const renderSection = (section: (typeof visible)[number]) => {
    switch (section.key) {
      case "hero":
        return (
          <Hero
            content={hero?.content as HeroBlockContent | undefined}
            styles={hero?.styles as HeroBlockStyles | undefined}
          />
        );
      case "banner":
        return (
          <Banner
            content={banner?.content as HeroBlockContent | undefined}
            styles={banner?.styles as HeroBlockStyles | undefined}
          />
        );
      case "categories-header":
        return <Categories />;
      case "featured-products":
        return (
          <FeaturedProducts
            content={featured?.content as FeaturedBlockContent | undefined}
            styles={featured?.styles as FeaturedBlockStyles | undefined}
          />
        );
      case "lookbook":
        return <Lookbook />;
      case "brand-story":
        return <BrandStory />;
      case "newsletter":
        return <Newsletter />;
      case "social-feed":
        return <SocialFeed />;
      default:
        return null;
    }
  };

  return (
    <>
      {visible.map((section) =>
        preview ? (
          <div
            key={section.id}
            data-veldic-section=""
            data-veldic-section-id={section.id}
            data-veldic-label={SECTION_NAMES[section.key] ?? section.key}
          >
            {renderSection(section)}
          </div>
        ) : (
          <Fragment key={section.id}>{renderSection(section)}</Fragment>
        )
      )}
      {preview && <SectionHighlighter />}
    </>
  );
}

