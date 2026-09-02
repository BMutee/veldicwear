// ─── Render adapters: document settings → storefront component props ────────
// The section components (Hero, Banner, FeaturedProducts) keep their exact
// existing prop contracts. This module is the lossless 1:1 mapping between
// the flat settings bags stored in template documents and those prop shapes,
// so the JSON never leaks into markup and markup never hardcodes data.

import type {
  FeaturedBlockContent,
  FeaturedBlockStyles,
  HeroBlockContent,
  HeroBlockStyles,
} from "@/lib/block-section";
import {
  BANNER_BLOCK_DEFAULT_STYLES,
  FEATURED_BLOCK_DEFAULT_STYLES,
  HERO_BLOCK_DEFAULT_STYLES,
  HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT,
} from "@/lib/block-section";
import type { BreakpointValue, SettingValues } from "./types";

type HeroVariant = "hero" | "banner";

function bp(source: SettingValues, id: string, fallback: BreakpointValue): BreakpointValue {
  const raw = source[id];
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    typeof (raw as BreakpointValue).mobile === "number" &&
    typeof (raw as BreakpointValue).desktop === "number"
  ) {
    return raw as BreakpointValue;
  }
  return fallback;
}

function str(source: SettingValues, id: string): string {
  const v = source[id];
  return typeof v === "string" ? v : "";
}

function color(source: SettingValues, id: string, fallback: string): string {
  const v = str(source, id);
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

/** HERO content+styles (also used by the banner variant) from a static block's
 *  settings bag. Returns null content when the required heading is blank —
 *  the component then renders its own built-in defaults. */
export function heroAdapter(
  settings: SettingValues,
  variant: HeroVariant
): { content: HeroBlockContent | null; styles: HeroBlockStyles } {
  const heading = str(settings, "heading").trim();
  const content: HeroBlockContent | null = heading
    ? {
        heading,
        subtext: str(settings, "subtext") || undefined,
        tagline: str(settings, "tagline") || undefined,
        trustProductCount: str(settings, "trustProductCount") || undefined,
        trustMemberCount: str(settings, "trustMemberCount") || undefined,
        trustRating: str(settings, "trustRating") || undefined,
        backgroundImage: str(settings, "backgroundImage")
          ? { src: str(settings, "backgroundImage"), alt: str(settings, "backgroundImageAlt") }
          : undefined,
        cta: str(settings, "ctaLabel")
          ? {
              label: str(settings, "ctaLabel"),
              url: str(settings, "ctaUrl") || "/shop",
              ...(str(settings, "ctaBackgroundColor")
                ? { ctaBackgroundColor: str(settings, "ctaBackgroundColor") }
                : {}),
              ...(str(settings, "ctaTextColor") ? { ctaTextColor: str(settings, "ctaTextColor") } : {}),
            }
          : undefined,
      }
    : null;

  if (variant === "banner") {
    const styles: HeroBlockStyles = {
      paddingTop: bp(settings, "paddingTop", BANNER_BLOCK_DEFAULT_STYLES.paddingTop),
      paddingBottom: bp(settings, "paddingBottom", BANNER_BLOCK_DEFAULT_STYLES.paddingBottom),
      paddingX: bp(settings, "paddingX", BANNER_BLOCK_DEFAULT_STYLES.paddingX),
      headingFontSize: bp(settings, "headingFontSize", BANNER_BLOCK_DEFAULT_STYLES.headingFontSize ?? HERO_BLOCK_HEADING_FONT_SIZE_DEFAULT),
      backgroundColor: color(settings, "backgroundColor", BANNER_BLOCK_DEFAULT_STYLES.backgroundColor),
      textColor: color(settings, "textColor", BANNER_BLOCK_DEFAULT_STYLES.textColor),
      animation: animationOf(settings, BANNER_BLOCK_DEFAULT_STYLES.animation),
    };
    return { content, styles };
  }

  const styles: HeroBlockStyles = {
    paddingTop: bp(settings, "paddingTop", HERO_BLOCK_DEFAULT_STYLES.paddingTop),
    paddingBottom: bp(settings, "paddingBottom", HERO_BLOCK_DEFAULT_STYLES.paddingBottom),
    paddingX: bp(settings, "paddingX", HERO_BLOCK_DEFAULT_STYLES.paddingX),
    headlineFontSize: bp(settings, "headlineFontSize", HERO_BLOCK_DEFAULT_STYLES.headlineFontSize!),
    backgroundColor: color(settings, "backgroundColor", HERO_BLOCK_DEFAULT_STYLES.backgroundColor),
    textColor: color(settings, "textColor", HERO_BLOCK_DEFAULT_STYLES.textColor),
    animation: animationOf(settings, HERO_BLOCK_DEFAULT_STYLES.animation),
  };
  return { content, styles };
}

function animationOf(
  settings: SettingValues,
  fallback: { type: "NONE" | "FADE" | "SLIDE_UP" | "SLIDE_IN"; scrollTrigger: boolean }
): { type: "NONE" | "FADE" | "SLIDE_UP" | "SLIDE_IN"; scrollTrigger: boolean } {
  const type = str(settings, "animationType");
  const valid = (["NONE", "FADE", "SLIDE_UP", "SLIDE_IN"] as const).find((t) => t === type);
  const trigger = settings["animationScrollTrigger"];
  return {
    type: valid ?? fallback.type,
    scrollTrigger: typeof trigger === "boolean" ? trigger : fallback.scrollTrigger,
  };
}

/** FEATURED_PRODUCTS content+styles from the static block's settings bag.
 *  An empty curated list yields null content so the component falls back to
 *  its legacy "latest featured active products" query. */
export function featuredAdapter(settings: SettingValues): {
  content: FeaturedBlockContent | null;
  styles: FeaturedBlockStyles;
} {
  const ids = Array.isArray(settings["productIds"])
    ? (settings["productIds"] as unknown[]).filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];
  const title = str(settings, "featuredSectionTitle").trim() || "New Arrivals";
  const content: FeaturedBlockContent | null =
    ids.length > 0 ? { productIds: ids.slice(0, 8), featuredSectionTitle: title, featuredSectionSubtitle: str(settings, "featuredSectionSubtitle") } : null;

  const styles: FeaturedBlockStyles = {
    paddingTop: bp(settings, "paddingTop", FEATURED_BLOCK_DEFAULT_STYLES.paddingTop),
    paddingBottom: bp(settings, "paddingBottom", FEATURED_BLOCK_DEFAULT_STYLES.paddingBottom),
    paddingX: bp(settings, "paddingX", FEATURED_BLOCK_DEFAULT_STYLES.paddingX),
    headingFontSize: bp(settings, "headingFontSize", FEATURED_BLOCK_DEFAULT_STYLES.headingFontSize),
    backgroundColor: color(settings, "backgroundColor", FEATURED_BLOCK_DEFAULT_STYLES.backgroundColor),
    textColor: color(settings, "textColor", FEATURED_BLOCK_DEFAULT_STYLES.textColor),
    animation: animationOf(settings, FEATURED_BLOCK_DEFAULT_STYLES.animation),
  };
  return { content, styles };
}

