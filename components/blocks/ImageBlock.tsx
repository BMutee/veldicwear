import type { BlockContent, BlockStyles } from "@/lib/block-section";
import BlockSurface from "./BlockSurface";
export default function ImageBlock({ blockId, content, styles }: { blockId: string; content: Extract<BlockContent, { src: string }>; styles: BlockStyles }) {
  return <BlockSurface blockId={blockId} styles={styles}><figure><img src={content.src} alt={content.alt} className="mx-auto max-h-[720px] w-full object-contain" />{content.caption && <figcaption className="mt-3 text-center text-sm opacity-70">{content.caption}</figcaption>}</figure></BlockSurface>;
}
