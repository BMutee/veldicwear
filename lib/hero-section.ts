// =============================================================================
// Hero Section — LEGACY schema (server + client).
// =============================================================================
// SUPERSEDED: the live hero is now a Block of type HERO owned by
// SiteSection("hero") via `sectionKey` (see lib/block-section.ts, the
// section-scoped blocks API, and the 20260821130000_migrate_hero_to_block
// migration). The legacy `SiteSection("hero").content` row is left in place
// but UNREAD.
//
// This module remains only for the one-time `scripts/migrate-breakpoint-styles.ts`
// (legacy breakpoint backfill) and historical reference. Do not read the hero
// section through it from new code.

import { z } from "zod";
import {
  breakpointSchema,
  normalizeBreakpoint,
} from "./section-shared";

// --- Style sub-schema ---------------------------------------------------------

export const heroStylesSchema = z.object({
  paddingTop: breakpointSchema(64, 400),
  paddingBottom: breakpointSchema(32, 400),
  paddingX: breakpointSchema(24, 200),
  backgroundColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color"),
  textColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color"),
  headlineFontSize: breakpointSchema(40, 200),
});

export type HeroStyles = z.infer<typeof heroStylesSchema>;

// --- Content schema -----------------------------------------------------------

export const heroContentSchema = z.object({
  heroTitle: z.string().min(1, "Headline is required"),
  heroSubtitle: z.string().min(1, "Subhead is required"),
  heroTagline: z.string().default("First on the terrain"),
  heroImage: z.string().min(1, "Image URL is required"),
  heroButtonText: z.string().min(1, "Button text is required"),
  heroButtonLink: z.string().min(1, "Button link is required"),
  trustProductCount: z.string().default("200+"),
  trustMemberCount: z.string().default("50K+"),
  trustRating: z.string().default("4.9"),
  styles: heroStylesSchema,
});

export type HeroContent = z.infer<typeof heroContentSchema>;

// --- Defaults -----------------------------------------------------------------
//
// Values chosen to exactly match Hero.tsx's current visual output:
//   - background = bone token   (--color-bone: #FAFAF8)
//   - text       = ink token    (--color-ink:  #171512)
//   - padding X  = 64           (matches `--gutter-desktop: 64px`)
//   - padding Y  = 96 top / 48 bottom (matches `pt-32 lg:pt-24` + `pb-16 lg:pb-12`)
//   - headline font-size       (matches `text-5xl sm:text-7xl lg:text-8xl` at lg)
//
// We default to the token values (not the literal "#FAFAF9" / "#1C1917" from
// the spec) because the design system forbids hardcoded hex in components.
// Hero.tsx currently renders these via Tailwind tokens (`bg-bone`, `text-ink`)
// so the live appearance is unchanged, and the persisted JSON stays on-token.

export const HERO_DEFAULT_STYLES: HeroStyles = {
  paddingTop: { mobile: 64, desktop: 96 },
  paddingBottom: { mobile: 32, desktop: 48 },
  paddingX: { mobile: 24, desktop: 64 },
  backgroundColor: "#FAFAF8", // --color-bone
  textColor: "#171512", // --color-ink
  headlineFontSize: { mobile: 40, desktop: 96 }, // matches `lg:text-8xl` (6rem = 96px)
};

export const HERO_DEFAULT_CONTENT: HeroContent = {
  heroTitle: "Wear the ground\nyou cover",
  heroSubtitle: "Premium lifestyle & activewear for every journey.",
  heroTagline: "First on the terrain",
  heroImage: "/products/jacket.jpg",
  heroButtonText: "Shop new arrivals",
  heroButtonLink: "/shop",
  trustProductCount: "200+",
  trustMemberCount: "50K+",
  trustRating: "4.9",
  styles: HERO_DEFAULT_STYLES,
};

// --- Helpers ------------------------------------------------------------------

/** Parse a SiteSection.content string into a fully-shaped HeroContent, applying defaults for any missing keys (legacy rows, partial JSON). Never throws. */
export function parseHeroContent(raw: string | null | undefined): HeroContent {
  if (!raw) return HERO_DEFAULT_CONTENT;
  try {
    const parsed = JSON.parse(raw);
    const result = heroContentSchema.safeParse(parsed);
    if (result.success) return result.data;
    // Partial / legacy shape — merge with defaults so the UI and Hero always
    // receive a complete object, even if the DB row is missing newer keys.
    const rawStyles = (parsed.styles ?? {}) as Record<string, unknown>;
    return {
      ...HERO_DEFAULT_CONTENT,
      ...parsed,
      styles: {
        ...HERO_DEFAULT_STYLES,
        ...rawStyles,
        paddingTop: normalizeBreakpoint(rawStyles.paddingTop, HERO_DEFAULT_STYLES.paddingTop, 64, 400),
        paddingBottom: normalizeBreakpoint(rawStyles.paddingBottom, HERO_DEFAULT_STYLES.paddingBottom, 32, 400),
        paddingX: normalizeBreakpoint(rawStyles.paddingX, HERO_DEFAULT_STYLES.paddingX, 24, 200),
        headlineFontSize: normalizeBreakpoint(rawStyles.headlineFontSize, HERO_DEFAULT_STYLES.headlineFontSize, 40, 200),
      },
    };
  } catch {
    return HERO_DEFAULT_CONTENT;
  }
}

/** Serialize HeroContent for SiteSection.content storage. */
export function serializeHeroContent(content: HeroContent): string {
  return JSON.stringify(content);
}

// fluid() moved to ./section-shared so every section can share it; re-exported
// here so existing imports from "@/lib/hero-section" keep working unchanged.
export { fluid } from "./section-shared";
