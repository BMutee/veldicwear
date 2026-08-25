// =============================================================================
// Featured Products section — LEGACY schema (server + client).
// =============================================================================
// SUPERSEDED: the live FeaturedProducts section is now a FEATURED_PRODUCTS
// block owned by SiteSection("featured-products") via `sectionKey` (see
// lib/block-section.ts, the section-scoped blocks API, and the one-time
// scripts/migrate-featured-products-block.ts). The legacy
// SiteSection("featured-products").content row is left in place but UNREAD.
//
// This module remains only for that migration script (read-time parsing of
// the legacy row) and historical reference. Do not read the featured-products
// section through it from new code.
// =============================================================================

import { z } from "zod";
import {
  breakpointSchema,
  hexColorSchema,
  normalizeBreakpoint,
} from "./section-shared";

export const featuredStylesSchema = z.object({
  paddingTop: breakpointSchema(48, 400),
  paddingBottom: breakpointSchema(48, 400),
  paddingX: breakpointSchema(24, 200),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  headingFontSize: breakpointSchema(32, 160),
});

export type FeaturedStyles = z.infer<typeof featuredStylesSchema>;

export const featuredContentSchema = z.object({
  featuredSectionTitle: z.string().default("New Arrivals"),
  featuredSectionSubtitle: z
    .string()
    .default("Considered pieces, built to last."),
  styles: featuredStylesSchema,
});

export type FeaturedContent = z.infer<typeof featuredContentSchema>;

// Defaults match FeaturedProducts.tsx's current hardcoded styling:
//   section `px-6 py-24` (24 / 96 / 96), heading `text-4xl sm:text-5xl` (48px),
//   `text-ink` (#171512) on the transparent bone page (#FAFAF8).
export const FEATURED_DEFAULT_STYLES: FeaturedStyles = {
  paddingTop: { mobile: 48, desktop: 96 },
  paddingBottom: { mobile: 48, desktop: 96 },
  paddingX: { mobile: 24, desktop: 24 },
  backgroundColor: "#FAFAF8", // --color-bone (matches transparent-on-bone page)
  textColor: "#171512", // --color-ink
  headingFontSize: { mobile: 32, desktop: 48 }, // matches sm:text-5xl
};

export const FEATURED_DEFAULT_CONTENT: FeaturedContent = {
  featuredSectionTitle: "New Arrivals",
  featuredSectionSubtitle: "Considered pieces, built to last.",
  styles: FEATURED_DEFAULT_STYLES,
};

/** Parse raw SiteSection.content (string or object) into a fully-shaped object, applying defaults for missing keys. Never throws. */
export function parseFeaturedContent(raw: unknown): FeaturedContent {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== "object") return FEATURED_DEFAULT_CONTENT;

  const parsed = obj as Record<string, unknown>;
  const result = featuredContentSchema.safeParse(parsed);
  if (result.success) return result.data;

  const rawStyles = (parsed.styles ?? {}) as Record<string, unknown>;
  return {
    ...FEATURED_DEFAULT_CONTENT,
    ...parsed,
    styles: {
      ...FEATURED_DEFAULT_STYLES,
      ...rawStyles,
      paddingTop: normalizeBreakpoint(rawStyles.paddingTop, FEATURED_DEFAULT_STYLES.paddingTop, 48, 400),
      paddingBottom: normalizeBreakpoint(rawStyles.paddingBottom, FEATURED_DEFAULT_STYLES.paddingBottom, 48, 400),
      paddingX: normalizeBreakpoint(rawStyles.paddingX, FEATURED_DEFAULT_STYLES.paddingX, 24, 200),
      headingFontSize: normalizeBreakpoint(rawStyles.headingFontSize, FEATURED_DEFAULT_STYLES.headingFontSize, 32, 160),
    },
  };
}

export function serializeFeaturedContent(content: FeaturedContent): string {
  return JSON.stringify(content);
}
