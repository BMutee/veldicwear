import type { BlockContent, BlockStyles } from "@/lib/block-section";
import BlockSurface from "./BlockSurface";
export default function GalleryBlock({ blockId, content, styles }: { blockId: string; content: Extract<BlockContent, { images: unknown[] }>; styles: BlockStyles }) {
  return <BlockSurface blockId={blockId} styles={styles}><div className="grid gap-4 sm:grid-cols-2">{content.images.map((image, index) => <img key={`${image.src}-${index}`} src={image.src} alt={image.alt} className="aspect-[4/3] w-full object-cover" />)}</div></BlockSurface>;
}
