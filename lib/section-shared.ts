import { z } from "zod";

export type BreakpointValue = { mobile: number; desktop: number };

export function breakpointSchema(min: number, max: number) {
  return z.object({
    mobile: z.number().int().min(min).max(max),
    desktop: z.number().int().min(min).max(max),
  });
}

export function normalizeBreakpoint(
  raw: unknown,
  defaults: BreakpointValue,
  min: number,
  max: number
): BreakpointValue {
  const clamp = (value: number) => Math.max(min, Math.min(max, value));
  if (typeof raw === "number") {
    return { mobile: defaults.mobile, desktop: clamp(raw) };
  }
  if (raw && typeof raw === "object") {
    const value = raw as { mobile?: unknown; desktop?: unknown };
    return {
      mobile: typeof value.mobile === "number" ? clamp(value.mobile) : defaults.mobile,
      desktop:
        typeof value.desktop === "number" ? clamp(value.desktop) : defaults.desktop,
    };
  }
  return defaults;
}

// Shared pieces for every SiteSection-backed section (hero, featured, footer).

// Hex color validator (3- or 6-digit). Used by every section's styles schema.
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color");

// Fluid clamp helper. The admin's numeric style value is always the clamp's
// UPPER BOUND (the desktop / maximum size). Below the viewport width where that
// value stops fitting, it scales down smoothly to a mobile floor via `vw`.
//
// `Math.min(minPx, maxPx)` keeps clamp() valid even if an admin enters a value
// smaller than the floor (clamp requires min <= max; otherwise the whole
// declaration is dropped by the browser).
export function fluid(minPx: number, vw: number, maxPx: number): string {
  const min = Math.min(minPx, maxPx);
  return `clamp(${min}px, ${vw}vw, ${maxPx}px)`;
}

// WCAG contrast helpers — used for admin-side contrast warnings so an editor
// can't silently reintroduce a failing AA contrast (e.g. footer link color).

// ---------------------------------------------------------------------------
// Entrance-animation preset (shared by every section/block owner).
//   type          — NONE (default: no entrance animation), FADE, SLIDE_UP,
//                   SLIDE_IN (slide in from the left).
//   scrollTrigger — when true the animation plays when the element scrolls
//                   into view; when false it plays once on initial page load
//                   (relevant for above-the-fold chrome like Navbar/Hero).
// Rendering is handled by <Reveal> (components/motion/Reveal.tsx): the hidden
// initial state is pure CSS so SSR and the client's first paint agree, and
// @media (prefers-reduced-motion: reduce) fully disables everything.
// ---------------------------------------------------------------------------
export const ANIMATION_TYPES = ["NONE", "FADE", "SLIDE_UP", "SLIDE_IN"] as const;
export type AnimationType = (typeof ANIMATION_TYPES)[number];

export const animationSchema = z.object({
  type: z.enum(ANIMATION_TYPES).default("NONE"),
  scrollTrigger: z.boolean().default(true),
});
export type SectionAnimation = z.infer<typeof animationSchema>;

export const DEFAULT_ANIMATION: SectionAnimation = { type: "NONE", scrollTrigger: true };

/** Coerce an unknown payload into a valid SectionAnimation. Never throws. */
export function normalizeAnimation(raw: unknown): SectionAnimation {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    type:
      typeof v.type === "string" && (ANIMATION_TYPES as readonly string[]).includes(v.type)
        ? (v.type as AnimationType)
        : "NONE",
    scrollTrigger: typeof v.scrollTrigger === "boolean" ? v.scrollTrigger : true,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Returns the WCAG 2.x contrast ratio in [1, 21], or 0 if either hex is invalid. */
export function contrastRatio(fg: string, bg: string): number {
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!f || !b) return 0;
  const lum = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const l1 = 0.2126 * lum(f.r) + 0.7152 * lum(f.g) + 0.0722 * lum(f.b);
  const l2 = 0.2126 * lum(b.r) + 0.7152 * lum(b.g) + 0.0722 * lum(b.b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// =============================================================================
// Legacy palette → V3 (Light-Modern / Glass) migration
// -----------------------------------------------------------------------------
// The v2 design system stored earthy hex values directly in section/block rows
// (navbar, footer, hero, banner, featured-products). v3 retargets the palette
// to a light blue-slate system WITHOUT renaming the tokens, so stored v2
// values must be remapped at render time. These helpers are role-aware —
// the same legacy hex means different things as a *surface* vs *text*
// (e.g. ink #171512 was both the nav/footer background AND the hero text).
// They only rewrite legacy palette values; any merchant-customized color is
// left untouched.
// =============================================================================

export const V3_SURFACE = "#F3F7FC"; // --color-bone
export const V3_TEXT = "#1B2737"; // --color-ink
export const V3_ACCENT = "#2563EB"; // --color-moss
export const V3_MUTED = "#5B6B85"; // --color-stone
export const V3_WHITE = "#FFFFFF";

const LEGACY_INK = new Set(["#171512", "#1c1917"]);
const LEGACY_BONE = new Set(["#fafaf8", "#fafaf9", "#f3eee3"]);
const LEGACY_MUTED = new Set(["#cdccca", "#a8a29e", "#8c8677", "#78716c", "#78716c"]);
const LEGACY_AMBER = new Set(["#ca8a04", "#d97706"]);

/** Surface role: legacy dark surfaces → light V3 surface. */
export function migrateSurfaceColor(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (LEGACY_INK.has(v) || LEGACY_BONE.has(v)) return V3_SURFACE;
  return raw;
}

/** Text role: legacy ink/bone text → V3 slate-ink; legacy muted grays → slate. */
export function migrateTextColor(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (LEGACY_INK.has(v) || LEGACY_BONE.has(v)) return V3_TEXT;
  if (LEGACY_MUTED.has(v)) return V3_MUTED;
  return raw;
}

/** Link-hover role: legacy bone/ink/muted hover → V3 accent blue. */
export function migrateLinkHoverColor(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (LEGACY_INK.has(v) || LEGACY_BONE.has(v) || LEGACY_MUTED.has(v)) return V3_ACCENT;
  return raw;
}

/** Accent/CTA role: legacy amber CTA → V3 blue; off-white CTA text → white. */
export function migrateAccentColor(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (LEGACY_AMBER.has(v)) return V3_ACCENT;
  if (LEGACY_BONE.has(v)) return V3_WHITE;
  return raw;
}
