import { z } from "zod";
import {
  animationSchema,
  BreakpointValue,
  hexColorSchema,
  normalizeAnimation,
  normalizeBreakpoint,
} from "./section-shared";
import { sanitizeCtaUrl, sanitizeHtml } from "./sanitize";

export const blockTypes = ["HERO", "RICH_TEXT", "IMAGE", "BUTTON", "IMAGE_TEXT", "GALLERY", "FEATURED_PRODUCTS"] as const;
export type BlockType = (typeof blockTypes)[number];

export const blockStylesSchema = z.object({
  paddingTop: z.object({ mobile: z.number().int().min(0).max(400), desktop: z.number().int().min(0).max(400) }),
  paddingBottom: z.object({ mobile: z.number().int().min(0).max(400), desktop: z.number().int().min(0).max(400) }),
  paddingX: z.object({ mobile: z.number().int().min(0).max(200), desktop: z.number().int().min(0).max(200) }),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  animation: animationSchema,
});
export type BlockStyles = z.infer<typeof blockStylesSchema>;
export const BLOCK_DEFAULT_STYLES: BlockStyles = {
  paddingTop: { mobile: 24, desktop: 48 },
  paddingBottom: { mobile: 24, desktop: 48 },
  paddingX: { mobile: 24, desktop: 64 },
  backgroundColor: "#FAFAF8",
  textColor: "#171512",
  animation: { type: "NONE", scrollTrigger: true },
};

// Shared styles for the HERO block type, which now serves BOTH the full hero
// (SiteSection "hero") and the promo-strip banner (SiteSection "banner" —
// decided: "Banner = Hero without a mandatory background image"). The two
// font-size fields are mutually exclusive in practice: hero rows carry
// `headlineFontSize`, banner rows carry `headingFontSize`. Both are optional
// in the schema so either shape validates; the read-path normalize() always
// fills a default for whichever is missing.
export const heroBlockStylesSchema = z.object({
  paddingTop: z.object({ mobile: z.number().int().min(0).max(400), desktop: z.number().int().min(0).max(400) }),
  paddingBottom: z.object({ mobile: z.number().int().min(0).max(400), desktop: z.number().int().min(0).max(400) }),
  paddingX: z.object({ mobile: z.number().int().min(16).max(200), desktop: z.number().int().min(16).max(200) }),
  headlineFontSize: z.object({ mobile: z.number().int().min(16).max(200), desktop: z.number().int().min(16).max(200) }).optional(),
  // Banner (promo strip) heading size — ASYMMETRIC bounds, mirroring the legacy
  // banner schema: mobile is capped at 40px so an oversized promo heading can't
  // blow out a 375px viewport (desktop may go larger, up to 120px).
  headingFontSize: z.object({ mobile: z.number().int().min(16).max(40), desktop: z.number().int().min(16).max(120) }).optional(),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  animation: animationSchema,
});
export type HeroBlockStyles = z.infer<typeof heroBlockStylesSchema>;

// Banner (promo strip) heading size default — the banner variant of the HERO
// block uses `headingFontSize`, not the hero-scale `headlineFontSize`.
export const HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT = { mobile: 20, desktop: 28 };

// Asymmetric clamp for the banner's heading font size: `normalizeBreakpoint`
// applies one min/max to BOTH breakpoints, but the banner needs mobile <= 40
// (375px blow-out guard) and desktop <= 120, so it gets its own normalizer.
function normalizeHeadingFontSize(raw: unknown): BreakpointValue {
  const clamp = (v: number, max: number) => Math.max(16, Math.min(max, v));
  const def = HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT;
  if (typeof raw === "number") {
    return { mobile: def.mobile, desktop: clamp(raw, 120) };
  }
  if (raw && typeof raw === "object") {
    const v = raw as { mobile?: unknown; desktop?: unknown };
    return {
      mobile: typeof v.mobile === "number" ? clamp(v.mobile, 40) : def.mobile,
      desktop: typeof v.desktop === "number" ? clamp(v.desktop, 120) : def.desktop,
    };
  }
  return def;
}
export const HERO_BLOCK_DEFAULT_STYLES: HeroBlockStyles = {
  paddingTop: { mobile: 64, desktop: 96 }, paddingBottom: { mobile: 32, desktop: 48 }, paddingX: { mobile: 24, desktop: 64 }, headlineFontSize: { mobile: 40, desktop: 96 }, backgroundColor: "#FAFAF8", textColor: "#171512", animation: { type: "NONE", scrollTrigger: false },
};
// Defaults for the banner variant (SiteSection "banner") of the HERO block.
// Mirrors the previous banner defaults (ink strip, bone text, warm CTA);
// `headingFontSize` is the banner's font-size key, `headlineFontSize` is left
// unset so a reset banner row can't be confused with a hero row.
export const BANNER_BLOCK_DEFAULT_STYLES: HeroBlockStyles = {
  paddingTop: { mobile: 24, desktop: 40 }, paddingBottom: { mobile: 24, desktop: 40 }, paddingX: { mobile: 16, desktop: 24 }, headingFontSize: { mobile: 20, desktop: 28 }, backgroundColor: "#171512", textColor: "#FAFAF8", animation: { type: "NONE", scrollTrigger: true },
};

// --- FEATURED_PRODUCTS block type --------------------------------------------
// Styles mirror the legacy lib/featured-section.ts schema exactly (bounds and
// defaults), so the migration can carry a row's styles over unchanged.
export const featuredBlockStylesSchema = z.object({
  paddingTop: z.object({ mobile: z.number().int().min(48).max(400), desktop: z.number().int().min(48).max(400) }),
  paddingBottom: z.object({ mobile: z.number().int().min(48).max(400), desktop: z.number().int().min(48).max(400) }),
  paddingX: z.object({ mobile: z.number().int().min(24).max(200), desktop: z.number().int().min(24).max(200) }),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  headingFontSize: z.object({ mobile: z.number().int().min(32).max(160), desktop: z.number().int().min(32).max(160) }),
  animation: animationSchema,
});
export type FeaturedBlockStyles = z.infer<typeof featuredBlockStylesSchema>;

export const FEATURED_BLOCK_DEFAULT_STYLES: FeaturedBlockStyles = {
  paddingTop: { mobile: 48, desktop: 96 },
  paddingBottom: { mobile: 48, desktop: 96 },
  paddingX: { mobile: 24, desktop: 24 },
  backgroundColor: "#FAFAF8", // --color-bone
  textColor: "#171512", // --color-ink
  headingFontSize: { mobile: 32, desktop: 48 },
  animation: { type: "NONE", scrollTrigger: true },
};

// Content: an ORDERED list of product IDs (array order = display order, capped
// at 8 to match the legacy take:8) plus the section title/subtitle. The admin
// picker curates the list; the live render preserves its order and silently
// skips any ID that is missing or inactive (active: false).
export const featuredProductsBlockContentSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).min(1).max(8),
  featuredSectionTitle: z.string().trim().min(1).default("New Arrivals"),
  featuredSectionSubtitle: z.string().trim().default("Considered pieces, built to last."),
});
export type FeaturedBlockContent = z.infer<typeof featuredProductsBlockContentSchema>;

const imageSchema = z.object({ src: z.string().trim().min(1), alt: z.string().trim().default(""), caption: z.string().trim().optional() });
const buttonSchema = z.object({ label: z.string().trim().min(1), url: z.string().trim().min(1), variant: z.enum(["primary", "outline"]).default("primary") });
// CTA shared by hero + banner variants of the HERO block. The two optional
// color fields are used by the banner (its CTA sits on a dark strip and uses
// a distinct warm accent); the hero leaves them unset and keeps its
// fixed `.btn-primary` design-system styling (moss fill `var(--color-moss)`,
// inverse text, radius-md, no shadow) — Hero.tsx never reads these fields.
const heroCtaSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
  ctaBackgroundColor: hexColorSchema.optional(),
  ctaTextColor: hexColorSchema.optional(),
});
export const blockContentSchemas = {
  // backgroundImage is optional because the banner variant never sets one.
  HERO: z.object({ heading: z.string().trim().min(1), subtext: z.string().trim().optional(), backgroundImage: imageSchema.omit({ caption: true }).optional(), cta: heroCtaSchema.optional(), tagline: z.string().trim().optional(), trustProductCount: z.string().trim().optional(), trustMemberCount: z.string().trim().optional(), trustRating: z.string().trim().optional() }),
  RICH_TEXT: z.object({ html: z.string().min(1) }),
  IMAGE: imageSchema,
  BUTTON: buttonSchema,
  IMAGE_TEXT: z.object({ image: imageSchema.omit({ caption: true }), html: z.string().min(1), imageSide: z.enum(["left", "right"]) }),
  GALLERY: z.object({ images: z.array(imageSchema.omit({ caption: true })).min(2).max(20) }),
  FEATURED_PRODUCTS: featuredProductsBlockContentSchema,
} as const;
export type BlockContent = { [K in BlockType]: z.infer<(typeof blockContentSchemas)[K]> }[BlockType];
export type HeroBlockContent = z.infer<typeof blockContentSchemas.HERO>;

export const blockInputSchema = z.object({ type: z.enum(blockTypes), content: z.unknown(), styles: z.unknown() });
export const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(0) });

/** The styles schema for a given block type. HERO covers hero + banner
 *  (both use the shared heroBlockStylesSchema); every other type uses the
 *  generic blockStylesSchema. Callers must validate styles with this instead
 *  of a union, because zod unions return the FIRST successful parse and
 *  blockStylesSchema would silently strip hero/banner font-size keys. */
export function stylesForType(type: BlockType) {
  if (type === "HERO") return heroBlockStylesSchema;
  if (type === "FEATURED_PRODUCTS") return featuredBlockStylesSchema;
  return blockStylesSchema;
}

export function defaultBlockContent(type: BlockType): BlockContent {
  if (type === "HERO") return { heading: "Wear the ground\nyou cover", subtext: "Premium lifestyle & activewear for every journey.", backgroundImage: { src: "/products/jacket.jpg", alt: "" }, cta: { label: "Shop new arrivals", url: "/shop" }, tagline: "First on the terrain", trustProductCount: "200+", trustMemberCount: "50K+", trustRating: "4.9" };
  if (type === "RICH_TEXT") return { html: "<p>Write your content here.</p>" };
  if (type === "IMAGE") return { src: "", alt: "", caption: "" };
  if (type === "BUTTON") return { label: "Shop now", url: "/shop", variant: "primary" };
  if (type === "IMAGE_TEXT") return { image: { src: "", alt: "" }, html: "<p>Tell your story here.</p>", imageSide: "left" };
  if (type === "FEATURED_PRODUCTS") return { productIds: [], featuredSectionTitle: "New Arrivals", featuredSectionSubtitle: "Considered pieces, built to last." };
  return { images: [{ src: "", alt: "" }, { src: "", alt: "" }] };
}

export function normalizeHeroBlockStyles(raw: unknown): HeroBlockStyles {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const color = (key: "backgroundColor" | "textColor", fallback: string) => hexColorSchema.safeParse(value[key]).success ? value[key] as string : fallback;
  return {
    paddingTop: normalizeBreakpoint(value.paddingTop, HERO_BLOCK_DEFAULT_STYLES.paddingTop, 0, 400),
    paddingBottom: normalizeBreakpoint(value.paddingBottom, HERO_BLOCK_DEFAULT_STYLES.paddingBottom, 0, 400),
    paddingX: normalizeBreakpoint(value.paddingX, HERO_BLOCK_DEFAULT_STYLES.paddingX, 16, 200),
    headlineFontSize: normalizeBreakpoint(value.headlineFontSize, HERO_BLOCK_DEFAULT_STYLES.headlineFontSize!, 16, 200),
    headingFontSize: normalizeHeadingFontSize(value.headingFontSize),
    backgroundColor: color("backgroundColor", HERO_BLOCK_DEFAULT_STYLES.backgroundColor),
    textColor: color("textColor", HERO_BLOCK_DEFAULT_STYLES.textColor),
    animation: normalizeAnimation(value.animation),
  };
}

export function normalizeBlockStyles(raw: unknown): BlockStyles {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const color = (key: "backgroundColor" | "textColor", fallback: string) => hexColorSchema.safeParse(value[key]).success ? value[key] as string : fallback;
  return {
    paddingTop: normalizeBreakpoint(value.paddingTop, BLOCK_DEFAULT_STYLES.paddingTop, 0, 400),
    paddingBottom: normalizeBreakpoint(value.paddingBottom, BLOCK_DEFAULT_STYLES.paddingBottom, 0, 400),
    paddingX: normalizeBreakpoint(value.paddingX, BLOCK_DEFAULT_STYLES.paddingX, 0, 200),
    backgroundColor: color("backgroundColor", BLOCK_DEFAULT_STYLES.backgroundColor),
    textColor: color("textColor", BLOCK_DEFAULT_STYLES.textColor),
    animation: normalizeAnimation(value.animation),
  };
}

export function normalizeFeaturedBlockStyles(raw: unknown): FeaturedBlockStyles {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const color = (key: "backgroundColor" | "textColor", fallback: string) => hexColorSchema.safeParse(value[key]).success ? value[key] as string : fallback;
  return {
    paddingTop: normalizeBreakpoint(value.paddingTop, FEATURED_BLOCK_DEFAULT_STYLES.paddingTop, 48, 400),
    paddingBottom: normalizeBreakpoint(value.paddingBottom, FEATURED_BLOCK_DEFAULT_STYLES.paddingBottom, 48, 400),
    paddingX: normalizeBreakpoint(value.paddingX, FEATURED_BLOCK_DEFAULT_STYLES.paddingX, 24, 200),
    headingFontSize: normalizeBreakpoint(value.headingFontSize, FEATURED_BLOCK_DEFAULT_STYLES.headingFontSize, 32, 160),
    backgroundColor: color("backgroundColor", FEATURED_BLOCK_DEFAULT_STYLES.backgroundColor),
    textColor: color("textColor", FEATURED_BLOCK_DEFAULT_STYLES.textColor),
    animation: normalizeAnimation(value.animation),
  };
}

export function sanitizeBlockContent(type: BlockType, raw: unknown): BlockContent {
  const safeImage = (src: string) => {
    const safe = sanitizeCtaUrl(src);
    if (!safe) throw new Error("Image source must be an internal path or a valid http(s) URL.");
    return safe;
  };
  if (type === "HERO") {
    const parsed = blockContentSchemas.HERO.parse(raw);
    const backgroundImage = parsed.backgroundImage ? { ...parsed.backgroundImage, src: safeImage(parsed.backgroundImage.src) } : undefined;
    const cta = parsed.cta ? { ...parsed.cta, url: sanitizeCtaUrl(parsed.cta.url) } : undefined;
    if (cta && !cta.url) throw new Error("Hero CTA URL must be an internal path or a valid http(s) URL.");
    return { ...parsed, heading: sanitizeHtml(parsed.heading), subtext: parsed.subtext ? sanitizeHtml(parsed.subtext) : undefined, backgroundImage, cta: cta as { label: string; url: string; ctaBackgroundColor?: string; ctaTextColor?: string } | undefined };
  }
  if (type === "RICH_TEXT") return { html: sanitizeHtml(blockContentSchemas.RICH_TEXT.parse(raw).html) };
  if (type === "BUTTON") {
    const parsed = blockContentSchemas.BUTTON.parse(raw);
    const url = sanitizeCtaUrl(parsed.url);
    if (!url) throw new Error("Button URL must be an internal path or a valid http(s) URL.");
    return { ...parsed, url };
  }
  if (type === "IMAGE_TEXT") {
    const parsed = blockContentSchemas.IMAGE_TEXT.parse(raw);
    const safe = sanitizeCtaUrl(parsed.image.src);
    if (!safe) throw new Error("Image source must be an internal path or a valid http(s) URL.");
    return { ...parsed, image: { ...parsed.image, src: safe }, html: sanitizeHtml(parsed.html) };
  }
  if (type === "IMAGE") {
    const parsed = blockContentSchemas.IMAGE.parse(raw);
    return { ...parsed, src: safeImage(parsed.src) };
  }
  if (type === "FEATURED_PRODUCTS") {
    const parsed = featuredProductsBlockContentSchema.parse(raw);
    const seen = new Set<string>();
    const productIds = parsed.productIds
      .map((id) => id.trim())
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
    if (productIds.length === 0) throw new Error("Featured products must include at least one product.");
    return {
      productIds,
      featuredSectionTitle: sanitizeHtml(parsed.featuredSectionTitle),
      featuredSectionSubtitle: sanitizeHtml(parsed.featuredSectionSubtitle),
    };
  }
  const parsed = blockContentSchemas.GALLERY.parse(raw);
  return { images: parsed.images.map((image) => ({ ...image, src: safeImage(image.src) })) };
}

export function parseStoredBlock(type: BlockType, content: unknown, styles: unknown) {
  let safeContent: BlockContent;
  try {
    safeContent = sanitizeBlockContent(type, content);
  } catch {
    safeContent = defaultBlockContent(type);
  }
  return { type, content: safeContent, styles: type === "HERO" ? normalizeHeroBlockStyles(styles) : type === "FEATURED_PRODUCTS" ? normalizeFeaturedBlockStyles(styles) : normalizeBlockStyles(styles) };
}
