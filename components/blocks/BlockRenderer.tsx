import { parseStoredBlock, type BlockType, type FeaturedBlockContent, type HeroBlockStyles } from "@/lib/block-section";
import type { AnimationType } from "@/lib/section-shared";
import Reveal from "@/components/motion/Reveal";
import Hero from "@/components/Hero";
import RichTextBlock from "./RichTextBlock";
import ImageBlock from "./ImageBlock";
import ButtonBlock from "./ButtonBlock";
import ImageTextBlock from "./ImageTextBlock";
import GalleryBlock from "./GalleryBlock";

type BlockRecord = { id: string; type: string; content: unknown; styles: unknown };

export default function BlockRenderer({ block }: { block: BlockRecord }) {
  if (!(["HERO", "RICH_TEXT", "IMAGE", "BUTTON", "IMAGE_TEXT", "GALLERY", "FEATURED_PRODUCTS"] as string[]).includes(block.type)) return null;
  const parsed = parseStoredBlock(block.type as BlockType, block.content, block.styles);
  if (block.type === "HERO") return <Hero content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { heading: string }>} styles={parsed.styles as HeroBlockStyles} />;
  if (block.type === "FEATURED_PRODUCTS") return <FeaturedProductsPreview content={parsed.content as FeaturedBlockContent} />;
  // Generic blocks use the shared entrance-animation container, driven by the
  // block's own animation preset (HERO/FeaturedProducts animate internally).
  const animation = (parsed.styles as { animation?: { type: AnimationType; scrollTrigger: boolean } }).animation ?? { type: "NONE" as AnimationType, scrollTrigger: true };
  const wrapped = (node: React.ReactNode) => (
    <Reveal type={animation.type} scrollTrigger={animation.scrollTrigger}>
      {node}
    </Reveal>
  );
  if (block.type === "RICH_TEXT") return wrapped(<RichTextBlock blockId={block.id} content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { html: string }>} styles={parsed.styles} />);
  if (block.type === "IMAGE") return wrapped(<ImageBlock blockId={block.id} content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { src: string }>} styles={parsed.styles} />);
  if (block.type === "BUTTON") return wrapped(<ButtonBlock blockId={block.id} content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { variant: "primary" | "outline" }>} styles={parsed.styles} />);
  if (block.type === "IMAGE_TEXT") return wrapped(<ImageTextBlock blockId={block.id} content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { imageSide: "left" | "right" }>} styles={parsed.styles} />);
  return wrapped(<GalleryBlock blockId={block.id} content={parsed.content as Extract<ReturnType<typeof parseStoredBlock>["content"], { images: unknown[] }>} styles={parsed.styles} />);
}

// Admin preview for the curated product list — the full grid renders live on
// the homepage (server-side query); here we show an honest placeholder with
// the curated order and count rather than fetching products in the browser.
function FeaturedProductsPreview({ content }: { content: FeaturedBlockContent }) {
  return (
    <section className="px-6 py-12">
      <h2 className="font-display font-semibold">{content.featuredSectionTitle}</h2>
      <p className="mt-1 text-sm text-stone">{content.featuredSectionSubtitle}</p>
      <p className="mt-4 rounded-lg border border-stone/20 bg-white px-4 py-3 text-sm text-stone">
        {content.productIds.length} featured product{content.productIds.length === 1 ? "" : "s"} in admin-chosen order. Products render live on the homepage.
      </p>
    </section>
  );
}
