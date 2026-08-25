"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import type { HeroBlockContent, HeroBlockStyles } from "@/lib/block-section";
import { defaultBlockContent, HERO_BLOCK_DEFAULT_STYLES } from "@/lib/block-section";
import Reveal from "@/components/motion/Reveal";

// =============================================================================
// Hero
// =============================================================================
// Reads the HERO Block owned by SiteSection("hero") via app/page.tsx.
//
// All three style values are applied as inline `style` on the rendered DOM:
// Tailwind has no way to express "use whatever hex the admin picked at
// runtime" without emitting per-render arbitrary-value classes, which would
// (a) violate the design system's "no hardcoded hex" rule, (b) pollute the
// Tailwind JIT cache, and (c) risk SSR/hydration mismatch. Inline styles are
// deterministic and design-system-agnostic.
//
// The contour-line signature motif, parallax, motion variants, and copy face
// are unchanged — they belong to the brand, not the admin.
// =============================================================================

type HeroProps = {
  content?: HeroBlockContent | null;
  styles?: HeroBlockStyles | null;
};

// Easing/duration tokens as declared in globals.css
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const DUR_SLOW = 0.6;

// Topographic contour-line paths (signature hero motif)
const CONTOURS = [
  "M-100 240 C 100 120, 300 360, 560 240 S 900 120, 1240 260",
  "M-100 300 C 120 200, 320 420, 580 320 S 920 220, 1240 340",
  "M-100 380 C 140 300, 340 500, 600 400 S 940 320, 1240 440",
  "M-100 460 C 160 400, 360 560, 620 480 S 960 420, 1240 540",
  "M-100 540 C 180 500, 380 620, 640 560 S 980 520, 1240 640",
];

export default function Hero({ content, styles: storedStyles }: HeroProps) {
  const dataContent = content ?? defaultBlockContent("HERO") as HeroBlockContent;
  const styles = storedStyles ?? HERO_BLOCK_DEFAULT_STYLES;
  // The HERO block type is shared with the banner variant (which omits
  // backgroundImage and uses headingFontSize). The hero's own rows always
  // carry both, but these fallbacks keep the component robust if a banner
  // row were ever rendered here.
  const headlineFs = styles.headlineFontSize ?? HERO_BLOCK_DEFAULT_STYLES.headlineFontSize!;
  const data = {
    heroTitle: dataContent.heading,
    heroSubtitle: dataContent.subtext ?? "",
    heroTagline: dataContent.tagline ?? "",
    heroImage: dataContent.backgroundImage?.src ?? "",
    heroButtonText: dataContent.cta?.label ?? "",
    heroButtonLink: dataContent.cta?.url ?? "",
    trustProductCount: dataContent.trustProductCount ?? "",
    trustMemberCount: dataContent.trustMemberCount ?? "",
    trustRating: dataContent.trustRating ?? "",
  };
  const titleLines = data.heroTitle.split("\n").filter(Boolean);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);

  // Scroll-linked parallax for hero image
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Staggered container — orchestrates the entrance sequence
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  // Headline line variants — fade/slide up 20px (quiet, grounded)
  const headlineVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.15 * i,
        duration: DUR_SLOW,
        ease: EASE_OUT,
      },
    }),
  };

  // Tagline variants — fade in
  const taglineVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Subtitle variants — fade up
  const subtitleVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // CTA variants — fade up after headline
  const ctaVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Trust markers — fade in
  const trustVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, delay: 0.2 },
    },
  };

  // Section-level dynamic styles (background, text color, padding).
  const sectionStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor,
    color: styles.textColor,
  };
  // Fade overlay that bleeds the image into the dynamic background.
  const overlayStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${styles.backgroundColor} 0%, ${styles.backgroundColor}cc 40%, transparent 100%)`,
  };

  return (
    <>
      <style>{`\n        .veldic-hero {\n          --hero-pad-top: ${styles.paddingTop.mobile}px;\n          --hero-pad-bottom: ${styles.paddingBottom.mobile}px;\n          --hero-pad-x: ${styles.paddingX.mobile}px;\n          --hero-headline-fs: ${headlineFs.mobile}px;\n        }\n        @media (min-width: 768px) {\n          .veldic-hero {\n            --hero-pad-top: ${styles.paddingTop.desktop}px;\n            --hero-pad-bottom: ${styles.paddingBottom.desktop}px;\n            --hero-pad-x: ${styles.paddingX.desktop}px;\n            --hero-headline-fs: ${headlineFs.desktop}px;\n          }\n        }\n      `}</style>
      <section
        ref={containerRef}
        style={sectionStyle}
        className="veldic-hero relative min-h-screen overflow-hidden"
      >
      {/* === HERO IMAGE (right) with parallax === */}
      {data.heroImage ? (
        <motion.div
          style={{
            y: reduceMotion ? 0 : imageY,
            scale: reduceMotion ? 1 : imageScale,
          }}
          className="absolute inset-y-0 right-0 hidden h-full w-full lg:block lg:w-3/5"
        >
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${data.heroImage})` }}
          />
          {/* Subtle overlay fading image into the dynamic background */}
          <div className="absolute inset-0" style={overlayStyle} aria-hidden="true" />
        </motion.div>
      ) : (
        /* Fallback: large geometric monogram on the dynamic surface */
        <div className="absolute inset-y-0 right-0 hidden lg:flex w-3/5 items-center justify-center">
          <span
            className="font-display text-[20rem] font-semibold leading-none select-none"
            style={{ color: styles.textColor, opacity: 0.05 }}
          >
            VW
          </span>
        </div>
      )}

      {/* === SIGNATURE MOTIF: animated topographic contour lines === */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1240 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CONTOURS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="var(--color-moss)"
            strokeWidth={reduceMotion ? 1 : 0.75}
            strokeOpacity={0.24 + i * 0.05}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: reduceMotion ? 1 : undefined }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: i * 0.08, ease: EASE_OUT }}
          />
        ))}
      </svg>

      {/* === CONTENT === */}
      {/* Overflow defense layer 3 of 3 (html/body clip + section overflow-hidden): keep the content column from ever exceeding the viewport. */}
      {/* Entrance animation (admin-configurable) wrapping the content column;
          reduced-motion is fully disabled via CSS. The hero's own staggered
          framer-motion choreography composes inside this container reveal. */}
      <Reveal type={styles.animation.type} scrollTrigger={styles.animation.scrollTrigger}>
      <motion.div
        className="relative z-20 max-w-full"
        style={{ paddingLeft: "var(--hero-pad-x)", paddingRight: "var(--hero-pad-x)" }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ paddingTop: "var(--hero-pad-top)", paddingBottom: "var(--hero-pad-bottom)" }}
          className="flex min-h-screen flex-col justify-center lg:w-3/5"
        >
          {/* Tagline with moss accent line */}
          <motion.div variants={taglineVariants}>
            <span className="eyebrow inline-flex items-center gap-3">
              <span className="h-px w-10 bg-moss" />
              {data.heroTagline}
            </span>
          </motion.div>

          {/* Headline — display, sentence case */}
          <h1
            className="mt-6 font-display font-semibold leading-[0.95] tracking-tight"
            style={{ fontSize: "var(--hero-headline-fs)", color: styles.textColor }}
          >
            {titleLines.map((line, i) => (
              <motion.span key={i} custom={i} variants={headlineVariants} className="block">
                {line}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            variants={subtitleVariants}
            className="mt-8 max-w-lg font-sans text-lg text-stone leading-relaxed"
          >
            {data.heroSubtitle}
          </motion.p>

          {/* CTA — moss fill (the ONE accent button in this view) */}
          <motion.div variants={ctaVariants} className="mt-10">
            <Link
              href={data.heroButtonLink}
              className="btn-primary cursor-pointer"
            >
              {data.heroButtonText}
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </motion.div>

          {/* Trust markers — data uses mono face */}
          <motion.div
            variants={trustVariants}
            className="mt-16 flex items-center gap-8 sm:gap-12"
          >
            <div className="flex flex-col">
              <span className="font-mono text-3xl">{data.trustProductCount}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-stone">
                Products
              </span>
            </div>
            <div className="h-12 w-px bg-stone/30" />
            <div className="flex flex-col">
              <span className="font-mono text-3xl">{data.trustMemberCount}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-stone">
                Members
              </span>
            </div>
            <div className="h-12 w-px bg-stone/30" />
            <div className="flex flex-col">
              <span className="font-mono text-3xl">{data.trustRating}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-stone">
                Rating
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      </Reveal>
      </section>
    </>
  );
}
