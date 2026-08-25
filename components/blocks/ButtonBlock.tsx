import Link from "next/link";
import type { BlockContent, BlockStyles } from "@/lib/block-section";
import BlockSurface from "./BlockSurface";
export default function ButtonBlock({ blockId, content, styles }: { blockId: string; content: Extract<BlockContent, { variant: "primary" | "outline" }>; styles: BlockStyles }) {
  return <BlockSurface blockId={blockId} styles={styles}><Link href={content.url} className={content.variant === "outline" ? "btn-outline cursor-pointer" : "btn-primary cursor-pointer"}>{content.label}<span aria-hidden="true">&rarr;</span></Link></BlockSurface>;
}
