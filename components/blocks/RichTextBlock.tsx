import type { BlockContent, BlockStyles } from "@/lib/block-section";
import BlockSurface from "./BlockSurface";
export default function RichTextBlock({ blockId, content, styles }: { blockId: string; content: Extract<BlockContent, { html: string }>; styles: BlockStyles }) {
  return <BlockSurface blockId={blockId} styles={styles}><div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.html }} /></BlockSurface>;
}
