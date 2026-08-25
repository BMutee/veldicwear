"use client";

import Link from "next/link";
import type { HeroBlockContent, HeroBlockStyles } from "@/lib/block-section";
import { BANNER_BLOCK_DEFAULT_STYLES, HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT } from "@/lib/block-section";
import Reveal from "@/components/motion/Reveal";

// ---------------------------------------------------------------------------
// Banner — the promo strip variant of the HERO block type.
//
// Decision: "Banner = Hero without a mandatory background image." It REUSES
// the HERO block type (sectionKey "banner", type HERO) rather than adding a
// new block type. Consequently the banner never renders a background image:
// there is no image markup at all — no broken image, no empty div.
//
// The HERO content schema carries the banner's CTA colors on the `cta`
// object (ctaBackgroundColor / ctaTextColor) — the hero leaves them unset and
// keeps its fixed `.btn-primary` design-system styling; the banner reads them
// and applies them as inline colors.
//
// Rendering mechanism (unchanged from the legacy component): inline style
// cannot hold a media query and the values are runtime DB numbers, so the
// sizing is set via CSS custom properties defined in a scoped <style> block —
// mobile values are the defaults and a `@media (min-width: 768px)` query
// swaps them to the desktop values. The element's inline style then just
// references the variables. The <style> content is a pure function of the
// parsed props, so SSR and the client's first render produce identical
// output (no hydration mismatch).
// ---------------------------------------------------------------------------
// Desktop breakpoint = 768px, matching Tailwind's `md:` used across the site.
const BANNER_DESKTOP_BREAKPOINT_PX = 768;

type BannerProps = {
  content?: HeroBlockContent | null;
  styles?: HeroBlockStyles | null;
};

export default function Banner({ content, styles: storedStyles }: BannerProps) {
  const data = content ?? null;
  // The banner variant uses `headingFontSize`; fall back to the banner default
  // if a styles object somehow lacks it (e.g. a hero-shaped object).
  const s = storedStyles ?? BANNER_BLOCK_DEFAULT_STYLES;
  const headingFs = s.headingFontSize ?? HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT;

  const heading = data?.heading ?? "Free Shipping on Every Order";
  const subtext = data?.subtext ?? "No minimums, no surprises — always free.";
  // Fallback CTA mirrors the legacy default content (label/link + the two
  // banner CTA colors), so a null/absent content object still renders the
  // complete default banner — same as parseBannerContent(null) did before.
  const cta = data?.cta ?? { label: "Shop Now", url: "/shop", ctaBackgroundColor: "#CA8A04", ctaTextColor: "#FAFAF8" };

  const ctaStyle =
    cta && cta.label
      ? ({
          backgroundColor: cta.ctaBackgroundColor ?? "#CA8A04",
          color: cta.ctaTextColor ?? "#FAFAF8",
        } as React.CSSProperties)
      : null;

  return (
    <>
      <style>{`
        .veldic-banner {
          --banner-pad-top: ${s.paddingTop.mobile}px;
          --banner-pad-bottom: ${s.paddingBottom.mobile}px;
          --banner-pad-x: ${s.paddingX.mobile}px;
          --banner-heading-fs: ${headingFs.mobile}px;
        }
        @media (min-width: ${BANNER_DESKTOP_BREAKPOINT_PX}px) {
          .veldic-banner {
            --banner-pad-top: ${s.paddingTop.desktop}px;
            --banner-pad-bottom: ${s.paddingBottom.desktop}px;
            --banner-pad-x: ${s.paddingX.desktop}px;
            --banner-heading-fs: ${headingFs.desktop}px;
          }
        }
      `}</style>
      {/* overflow-hidden: overflow defense layer 3 of 3 for this section
          (html/body + main clip layers 1–2); the strip's content can never
          exceed the viewport. */}
      <div
        className="veldic-banner overflow-hidden"
        style={{
          backgroundColor: s.backgroundColor,
          color: s.textColor,
          paddingTop: "var(--banner-pad-top)",
          paddingBottom: "var(--banner-pad-bottom)",
          paddingLeft: "var(--banner-pad-x)",
          paddingRight: "var(--banner-pad-x)",
        }}
      >
      {/* Entrance animation (admin-configurable); reduced-motion is fully
          disabled via CSS regardless of this setting. */}
      <Reveal type={s.animation.type} scrollTrigger={s.animation.scrollTrigger}>
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
          <div>
            <p
              className="font-display font-semibold tracking-tight"
              style={{ fontSize: "var(--banner-heading-fs)" }}
            >
              {heading}
            </p>
            {subtext && (
              <p className="mt-0.5 font-sans text-sm opacity-70 sm:mt-0 sm:ml-2">
                {subtext}
              </p>
            )}
          </div>
          {cta && cta.label && (
            <Link
              href={cta.url || "/shop"}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 font-display text-sm font-semibold cursor-pointer transition-opacity duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={ctaStyle ?? undefined}
            >
              {cta.label}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </Reveal>
      </div>
    </>
  );
}
