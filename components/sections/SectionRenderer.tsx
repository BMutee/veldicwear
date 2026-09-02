// ─── Section renderer (the §4 resolution pipeline's final step) ──────────────
// Maps a RESOLVED section context (settings + blocks merged with schema
// defaults) onto the storefront section components. Shared by:
//   - the homepage (app/page.tsx), and
//   - the single-section render endpoint (Section Rendering API equivalent,
//     /api/admin/theme/render-section).
//
// Section components keep their exact prop contracts; the adapters in
// lib/theme/adapters.ts translate the flat settings bags losslessly.

import type { ComponentProps } from "react";
import type { ResolvedSection } from "@/lib/theme/types";
import { featuredAdapter, heroAdapter } from "@/lib/theme/adapters";
import Hero from "@/components/Hero";
import Banner from "@/components/Banner";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import Lookbook from "@/components/Lookbook";
import BrandStory from "@/components/BrandStory";
import Newsletter from "@/components/Newsletter";
import SocialFeed from "@/components/SocialFeed";

type CategoriesContent = NonNullable<ComponentProps<typeof Categories>["content"]>;
type LookbookContent = NonNullable<ComponentProps<typeof Lookbook>["initialContent"]>;
type BrandStoryContent = NonNullable<ComponentProps<typeof BrandStory>["initialContent"]>;
type NewsletterContent = NonNullable<ComponentProps<typeof Newsletter>["initialContent"]>;
type SocialFeedContent = NonNullable<ComponentProps<typeof SocialFeed>["initialContent"]>;

export default function SectionRenderer({ section }: { section: ResolvedSection }) {
  switch (section.type) {
    case "hero": {
      const block = section.blocks.find((b) => b.type === "_hero-content");
      const { content, styles } = block
        ? heroAdapter(block.settings, "hero")
        : { content: null, styles: null };
      return <Hero content={content} styles={styles} />;
    }
    case "banner": {
      const block = section.blocks.find((b) => b.type === "_banner-content");
      const { content, styles } = block
        ? heroAdapter(block.settings, "banner")
        : { content: null, styles: null };
      return <Banner content={content} styles={styles} />;
    }
    case "featured-products": {
      const block = section.blocks.find((b) => b.type === "_featured-products");
      const { content, styles } = block
        ? featuredAdapter(block.settings)
        : { content: null, styles: null };
      return <FeaturedProducts content={content} styles={styles} />;
    }
    case "categories-header":
      return <Categories content={section.settings as CategoriesContent} />;
    case "lookbook":
      return <Lookbook initialContent={section.settings as LookbookContent} />;
    case "brand-story":
      return <BrandStory initialContent={section.settings as BrandStoryContent} />;
    case "newsletter":
      return <Newsletter initialContent={section.settings as NewsletterContent} />;
    case "social-feed":
      return <SocialFeed initialContent={section.settings as SocialFeedContent} />;
    default:
      return null;
  }
}
