import type { BlockContent, BlockStyles } from "@/lib/block-section";
import BlockSurface from "./BlockSurface";
export default function ImageTextBlock({ blockId, content, styles }: { blockId: string; content: Extract<BlockContent, { imageSide: "left" | "right" }>; styles: BlockStyles }) {
  return <BlockSurface blockId={blockId} styles={styles}><div className={`grid items-center gap-8 md:grid-cols-2 ${content.imageSide === "right" ? "md:[&>img]:order-2" : ""}`}><img src={content.image.src} alt={content.image.alt} className="w-full object-cover" /><div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.html }} /></div></BlockSurface>;
}
