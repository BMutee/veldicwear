// ─── Block definitions ({% schema %} equivalent for blocks/*.liquid) ─────────
// Blocks prefixed "_" are PRIVATE: they are wired as static blocks inside
// specific sections (Horizon `_header-logo` pattern) — settings-editable in
// the editor, but never offered in a generic add-block picker.
//
// Setting IDs match the exact shapes the storefront section components
// consume (see lib/block-section.ts), so the render adapter in
// lib/theme/adapters.ts is a lossless 1:1 mapping.

import type { BlockDef } from "../types";

const ANIMATION_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "FADE", label: "Fade in" },
  { value: "SLIDE_UP", label: "Slide up" },
  { value: "SLIDE_IN", label: "Slide in from left" },
];

const heroSharedStyleFields = [
  { id: "paddingTop", label: "t:fields.padding_top", type: "breakpoint_range" as const, min: 0, max: 400, unit: "px", default: { mobile: 64, desktop: 96 } },
  { id: "paddingBottom", label: "t:fields.padding_bottom", type: "breakpoint_range" as const, min: 0, max: 400, unit: "px", default: { mobile: 32, desktop: 48 } },
  { id: "paddingX", label: "t:fields.padding_x", type: "breakpoint_range" as const, min: 16, max: 200, unit: "px", default: { mobile: 24, desktop: 64 } },
];

const motionFields = [
  { id: "animationType", label: "t:fields.animation", type: "select" as const, default: "NONE", options: ANIMATION_OPTIONS, info: "Entrance animation for this section." },
  {
    id: "animationScrollTrigger",
    label: "t:fields.animation_scroll_trigger",
    type: "checkbox" as const,
    default: true,
    info: "Play when scrolled into view (off: play once on page load).",
    visible_if: "animation_type != 'NONE'",
  },
];

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "_hero-content",
    name: "t:blocks._hero-content.name",
    settings: [
      { id: "heading", label: "t:fields.heading", type: "textarea", default: "Wear the ground\nyou cover", info: "Use newlines to break lines." },
      { id: "subtext", label: "t:fields.subtext", type: "textarea", default: "Premium lifestyle & activewear for every journey." },
      { id: "tagline", label: "t:fields.tagline", type: "text", default: "First on the terrain" },
      { id: "ctaLabel", label: "t:fields.cta_label", type: "text", default: "Shop new arrivals" },
      { id: "ctaUrl", label: "t:fields.cta_link", type: "link", placeholder: "/shop", default: "/shop" },
      { id: "backgroundImage", label: "t:fields.background_image", type: "image_picker", default: "/products/jacket.jpg" },
      { id: "backgroundImageAlt", label: "t:fields.background_image_alt", type: "text", visible_if: "backgroundImage != blank" },
      { id: "trustProductCount", label: "t:fields.trust_products", type: "text", default: "200+" },
      { id: "trustMemberCount", label: "t:fields.trust_members", type: "text", default: "50K+" },
      { id: "trustRating", label: "t:fields.trust_rating", type: "text", default: "4.9" },
      { id: "styleHeader", label: "t:fields.group_style", type: "header" },
      ...heroSharedStyleFields,
      { id: "headlineFontSize", label: "t:fields.headline_font_size", type: "breakpoint_range", min: 16, max: 200, unit: "px", default: { mobile: 40, desktop: 96 } },
      { id: "backgroundColor", label: "t:fields.background_color", type: "color", default: "#F3F7FC" },
      { id: "textColor", label: "t:fields.text_color", type: "color", default: "#1B2737" },
      { id: "motionHeader", label: "t:fields.group_motion", type: "header" },
      ...motionFields,
    ],
  },
  {
    type: "_banner-content",
    name: "t:blocks._banner-content.name",
    settings: [
      { id: "heading", label: "t:fields.heading", type: "text", default: "Free Shipping on Every Order" },
      { id: "subtext", label: "t:fields.subtext", type: "text", default: "No minimums, no surprises — always free." },
      { id: "ctaLabel", label: "t:fields.cta_label", type: "text", default: "Shop Now" },
      { id: "ctaUrl", label: "t:fields.cta_link", type: "link", placeholder: "/shop", default: "/shop" },
      { id: "ctaBackgroundColor", label: "t:fields.cta_background_color", type: "color", default: "#2563EB" },
      { id: "ctaTextColor", label: "t:fields.cta_text_color", type: "color", default: "#FFFFFF" },
      { id: "styleHeader", label: "t:fields.group_style", type: "header" },
      { id: "paddingTop", label: "t:fields.padding_top", type: "breakpoint_range", min: 0, max: 400, unit: "px", default: { mobile: 24, desktop: 40 } },
      { id: "paddingBottom", label: "t:fields.padding_bottom", type: "breakpoint_range", min: 0, max: 400, unit: "px", default: { mobile: 24, desktop: 40 } },
      { id: "paddingX", label: "t:fields.padding_x", type: "breakpoint_range", min: 16, max: 200, unit: "px", default: { mobile: 16, desktop: 24 } },
      { id: "headingFontSize", label: "t:fields.heading_font_size", type: "breakpoint_range", min: 16, max: 120, unit: "px", default: { mobile: 20, desktop: 28 }, info: "Mobile is clamped to 40px so a large value can't blow out small screens." },
      { id: "backgroundColor", label: "t:fields.background_color", type: "color", default: "#F3F7FC" },
      { id: "textColor", label: "t:fields.text_color", type: "color", default: "#1B2737" },
      { id: "motionHeader", label: "t:fields.group_motion", type: "header" },
      ...motionFields,
    ],
  },
  {
    type: "_featured-products",
    name: "t:blocks._featured-products.name",
    settings: [
      { id: "productIds", label: "t:fields.product_ids", type: "product_picker", max_items: 8, default: [], info: "Pinned products show first, in this order. Remaining slots (up to 8 total) auto-fill with the newest products." },
      { id: "featuredSectionTitle", label: "t:fields.section_title", type: "text", default: "New Arrivals" },
      { id: "featuredSectionSubtitle", label: "t:fields.section_subtitle", type: "text", default: "Considered pieces, built to last." },
      { id: "styleHeader", label: "t:fields.group_style", type: "header" },
      { id: "paddingTop", label: "t:fields.padding_top", type: "breakpoint_range", min: 48, max: 400, unit: "px", default: { mobile: 48, desktop: 96 } },
      { id: "paddingBottom", label: "t:fields.padding_bottom", type: "breakpoint_range", min: 48, max: 400, unit: "px", default: { mobile: 48, desktop: 96 } },
      { id: "paddingX", label: "t:fields.padding_x", type: "breakpoint_range", min: 24, max: 200, unit: "px", default: { mobile: 24, desktop: 24 } },
      { id: "headingFontSize", label: "t:fields.heading_font_size", type: "breakpoint_range", min: 32, max: 160, unit: "px", default: { mobile: 32, desktop: 48 } },
      { id: "backgroundColor", label: "t:fields.background_color", type: "color", default: "#F3F7FC" },
      { id: "textColor", label: "t:fields.text_color", type: "color", default: "#1B2737" },
      { id: "motionHeader", label: "t:fields.group_motion", type: "header" },
      ...motionFields,
    ],
  },
];

export function getBlockDef(type: string): BlockDef | undefined {
  return BLOCK_DEFS.find((def) => def.type === type);
}
