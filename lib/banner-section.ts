// =============================================================================
// Banner section — shared schema (server + client).
// A full-width promo strip (e.g. "Free Shipping on Every Order") rendered
// between Hero and FeaturedProducts on the homepage.
//
// *** SUPERSEDED (2026-08-21) — DO NOT USE for new code. ***
// The Banner was migrated to the block system: it is now a Block of type HERO
// (sectionKey "banner", order 0) — "Banner = Hero without a mandatory
// background image". The new schema lives in `@/lib/block-section`
// (`heroCtaSchema` gained optional `ctaBackgroundColor`/`ctaTextColor`;
// `backgroundImage` is optional). `components/Banner.tsx` renders from the
// Block; `app/admin/banner/page.tsx` edits it via `AdminBlocksClient`.
//
// This file is kept ONLY because `scripts/migrate-banner-breakpoints.ts` and
// the historical verification scripts still reference it. The legacy
// `SiteSection("banner")` content row is left in place but is no longer read
// by any app code.
// =============================================================================

import { z } from "zod";
import { hexColorSchema } from "./section-shared";

/**
 * Breakpoint style values: mobile applies below the desktop breakpoint
 * (Tailwind `md` = 768px); desktop applies at 768px and up.
 */
const padBreakpointSchema = z.object({
  mobile: z.number().int().min(0).max(200),
  desktop: z.number().int().min(0).max(200),
});

// The mobile heading is capped at 40px to prevent an oversized promo heading
// on a 375px viewport. Desktop can go larger (up to 120px).
const headingBreakpointSchema = z.object({
  mobile: z.number().int().min(16).max(40),
  desktop: z.number().int().min(16).max(120),
});

export const bannerStylesSchema = z.object({
  paddingTop: padBreakpointSchema,
  paddingBottom: padBreakpointSchema,
  paddingX: padBreakpointSchema,
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  headingFontSize: headingBreakpointSchema,
  ctaBackgroundColor: hexColorSchema,
  ctaTextColor: hexColorSchema,
});

export type BannerStyles = z.infer<typeof bannerStylesSchema>;

const ctaSchema = z.object({
  label: z.string().default("Shop Now"),
  link: z.string().default("/shop"),
});

export const bannerContentSchema = z.object({
  heading: z.string().default("Free Shipping on Every Order"),
  subtext: z
    .string()
    .default("No minimums, no surprises — always free."),
  cta: ctaSchema.optional(),
  styles: bannerStylesSchema,
});

export type BannerContent = z.infer<typeof bannerContentSchema>;

// V3 light strip treatment — bone surface (#F3F7FC) with slate-ink text
// (#1B2737), matching Footer's light glass styling. CTA uses the V3 blue
// (#2563EB) accent with white text, consistent with accent rules.
//
// Breakpoint defaults: desktop = the original single-value default;
// mobile = the fluid() floor that value previously scaled down to
// (20 / 24 / 16), so an unedited banner renders exactly as before.
export const BANNER_DEFAULT_STYLES: BannerStyles = {
  paddingTop: { mobile: 24, desktop: 40 },
  paddingBottom: { mobile: 24, desktop: 40 },
  paddingX: { mobile: 16, desktop: 24 },
  backgroundColor: "#F3F7FC", // --color-bone
  textColor: "#1B2737", // --color-ink
  headingFontSize: { mobile: 20, desktop: 28 }, // promo strip, not hero-scale
  ctaBackgroundColor: "#2563EB", // --color-moss (accent blue)
  ctaTextColor: "#FFFFFF",
};

export const BANNER_DEFAULT_CONTENT: BannerContent = {
  heading: "Free Shipping on Every Order",
  subtext: "No minimums, no surprises — always free.",
  cta: { label: "Shop Now", link: "/shop" },
  styles: BANNER_DEFAULT_STYLES,
};

// ---------------------------------------------------------------------------
// Legacy normalization
// ---------------------------------------------------------------------------
// Before the per-breakpoint rollout, the four sizing fields were a single
// number (desktop value). Existing rows with that shape must keep rendering
// identically: desktop = the stored number, mobile = the fluid() floor that
// value used to clamp to (20 / 24 / 16).
const SPLIT_KEYS = ["paddingTop", "paddingBottom", "paddingX", "headingFontSize"] as const;
type SplitKey = (typeof SPLIT_KEYS)[number];

export const BANNER_LEGACY_MOBILE_FLOOR: Record<SplitKey, number> = {
  paddingTop: 24,
  paddingBottom: 24,
  paddingX: 16,
  headingFontSize: 20,
};

const COLOR_KEYS = ["backgroundColor", "textColor", "ctaBackgroundColor", "ctaTextColor"] as const;

// Clamp bounds per split key — mirrors the Zod schema. Applied on the read
// path so even values written directly to the database (bypassing the admin
// API's validation) render within the same safe range. The mobile heading cap
// keeps an oversized promo heading from blowing out a 375px viewport.
const SPLIT_BOUNDS: Record<
  SplitKey,
  { mobileMin: number; mobileMax: number; desktopMin: number; desktopMax: number }
> = {
  paddingTop: { mobileMin: 0, mobileMax: 200, desktopMin: 0, desktopMax: 200 },
  paddingBottom: { mobileMin: 0, mobileMax: 200, desktopMin: 0, desktopMax: 200 },
  paddingX: { mobileMin: 0, mobileMax: 200, desktopMin: 0, desktopMax: 200 },
  headingFontSize: { mobileMin: 16, mobileMax: 40, desktopMin: 16, desktopMax: 120 },
};

/** Coerce a raw styles object into the breakpoint shape, converting legacy
 *  single numbers into { mobile: floor, desktop: number }. Never throws. */
export function normalizeBannerStyles(raw: unknown): BannerStyles {
  const base: BannerStyles = { ...BANNER_DEFAULT_STYLES };
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  for (const key of SPLIT_KEYS) {
    const b = SPLIT_BOUNDS[key];
    const v = src[key];
    if (typeof v === "number") {
      // Legacy single number: desktop = stored value, mobile = fluid() floor
      // (floors are already within bounds).
      base[key] = {
        mobile: BANNER_LEGACY_MOBILE_FLOOR[key],
        desktop: Math.max(b.desktopMin, Math.min(b.desktopMax, v)),
      };
    } else if (
      v &&
      typeof v === "object" &&
      typeof (v as { mobile?: unknown }).mobile === "number" &&
      typeof (v as { desktop?: unknown }).desktop === "number"
    ) {
      base[key] = {
        mobile: Math.max(
          b.mobileMin,
          Math.min(b.mobileMax, (v as { mobile: number }).mobile)
        ),
        desktop: Math.max(
          b.desktopMin,
          Math.min(b.desktopMax, (v as { desktop: number }).desktop)
        ),
      };
    }
  }

  for (const key of COLOR_KEYS) {
    if (typeof src[key] === "string") base[key] = src[key] as BannerStyles[typeof key];
  }

  return base;
}

/** Parse raw SiteSection.content into a fully-shaped BannerContent. Never throws. */
export function parseBannerContent(raw: unknown): BannerContent {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== "object") return BANNER_DEFAULT_CONTENT;

  const parsed = obj as Record<string, unknown>;
  const result = bannerContentSchema.safeParse(parsed);
  if (result.success) return result.data;

  return {
    ...BANNER_DEFAULT_CONTENT,
    ...parsed,
    styles: normalizeBannerStyles(parsed.styles),
  };
}

export function serializeBannerContent(content: BannerContent): string {
  return JSON.stringify(content);
}
