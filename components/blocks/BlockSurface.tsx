import type { BlockStyles } from "@/lib/block-section";

export default function BlockSurface({ blockId, styles, children }: { blockId: string; styles: BlockStyles; children: React.ReactNode }) {
  const selector = `#block-${blockId}`;
  return <section id={`block-${blockId}`} className="veldic-block" style={{ backgroundColor: styles.backgroundColor, color: styles.textColor } as React.CSSProperties}>
    <style>{`${selector} { --block-pad-top: ${styles.paddingTop.mobile}px; --block-pad-bottom: ${styles.paddingBottom.mobile}px; --block-pad-x: ${styles.paddingX.mobile}px; } @media (min-width: 768px) { ${selector} { --block-pad-top: ${styles.paddingTop.desktop}px; --block-pad-bottom: ${styles.paddingBottom.desktop}px; --block-pad-x: ${styles.paddingX.desktop}px; } }`}</style>
    <div className="mx-auto max-w-[1280px]" style={{ paddingTop: "var(--block-pad-top)", paddingBottom: "var(--block-pad-bottom)", paddingLeft: "var(--block-pad-x)", paddingRight: "var(--block-pad-x)" }}>{children}</div>
  </section>;
}
