import { prisma } from "@/lib/prisma";
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Lookbook from "@/components/Lookbook";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import SocialFeed from "@/components/SocialFeed";
import { parseStoredBlock, type FeaturedBlockContent, type FeaturedBlockStyles, type HeroBlockContent, type HeroBlockStyles } from "@/lib/block-section";

export const dynamic = "force-dynamic";

export default async function Home() {
  let heroBlock: { type: string; content: unknown; styles: unknown } | null = null;
  let bannerBlock: { type: string; content: unknown; styles: unknown } | null = null;
  let featuredBlock: { type: string; content: unknown; styles: unknown } | null = null;
  try {
    [heroBlock, bannerBlock, featuredBlock] = await Promise.all([
      prisma.block.findFirst({ where: { sectionKey: "hero", type: "HERO" }, orderBy: { order: "asc" } }),
      prisma.block.findFirst({ where: { sectionKey: "banner", type: "HERO" }, orderBy: { order: "asc" } }),
      prisma.block.findFirst({ where: { sectionKey: "featured-products", type: "FEATURED_PRODUCTS" }, orderBy: { order: "asc" } }),
    ]);
  } catch {
    // If the database is unreachable, render the page with default content
    // rather than crashing the entire site.
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

  return (
    <>
      <Hero content={hero?.content as HeroBlockContent | undefined} styles={hero?.styles as HeroBlockStyles | undefined} />
      <Banner content={banner?.content as HeroBlockContent | undefined} styles={banner?.styles as HeroBlockStyles | undefined} />
      <Categories />
      <FeaturedProducts content={featured?.content as FeaturedBlockContent | undefined} styles={featured?.styles as FeaturedBlockStyles | undefined} />
      <Lookbook />
      <BrandStory />
      <Newsletter />
      <SocialFeed />
    </>
  );
}
