import { prisma } from "@/lib/prisma";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Lookbook from "@/components/Lookbook";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import SocialFeed from "@/components/SocialFeed";

export const dynamic = "force-dynamic";

export default async function Home() {
  let sections: { key: string; content: string | null }[] = [];
  try {
    sections = await prisma.siteSection.findMany();
  } catch {
    // If the database is unreachable, render the page with default content
    // rather than crashing the entire site.
  }

  const heroSection = sections.find((s) => s.key === "hero");
  const featuredSection = sections.find((s) => s.key === "featured-products");

  const heroContent = heroSection?.content ? JSON.parse(heroSection.content) : null;
  const featuredContent = featuredSection?.content ? JSON.parse(featuredSection.content) : null;

  return (
    <>
      <Hero content={heroContent} />
      <Categories />
      <FeaturedProducts content={featuredContent} />
      <Lookbook />
      <BrandStory />
      <Newsletter />
      <SocialFeed />
    </>
  );
}
