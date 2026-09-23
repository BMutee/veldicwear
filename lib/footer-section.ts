// =============================================================================
// Footer section — shared schema (server + client).
// Mirrors lib/hero-section.ts for the "footer" SiteSection row.
// =============================================================================

import { z } from "zod";
import { animationSchema, breakpointSchema, hexColorSchema, normalizeAnimation, normalizeBreakpoint, migrateLinkHoverColor, migrateSurfaceColor, migrateTextColor } from "./section-shared";

const footerLinkSchema = z.object({
  label: z.string().default(""),
  href: z.string().default("/"),
});

export const footerStylesSchema = z.object({
  paddingTop: breakpointSchema(40, 400),
  paddingBottom: breakpointSchema(40, 400),
  paddingX: breakpointSchema(24, 200),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  linkColor: hexColorSchema,
  linkHoverColor: hexColorSchema,
  animation: animationSchema,
});

export type FooterStyles = z.infer<typeof footerStylesSchema>;

/**
 * Footer content schema (SiteSection("footer").content).
 *
 * NOTE: brand identity (storeName/logo), contact (email/phone/address),
 * social links, copyright text, and the footer nav links are NO LONGER stored
 * here — they live on the singleton StoreSettings row (see `lib/settings.ts`
 * and `lib/store-settings.ts`). This schema intentionally holds ONLY the
 * remaining footer content: the brand description, link groups, payment
 * methods, and the admin-editable visual styles.
 */
export const footerContentSchema = z.object({
  brandDescription: z
    .string()
    .default(
      "Premium lifestyle & activewear for every journey. Wear the ground you cover."
    ),
  shopLinks: z.array(footerLinkSchema).default([]),
  supportLinks: z.array(footerLinkSchema).default([]),
  companyLinks: z.array(footerLinkSchema).default([]),
  paymentMethods: z.array(z.string()).default([]),
  styles: footerStylesSchema,
});

export type FooterContent = z.infer<typeof footerContentSchema>;

// Defaults match Footer.tsx's V3 styling: light glass surface (bone) with
// slate-ink text. linkColor default #5B6B85 is the V3 muted slate (WCAG AA).
export const FOOTER_DEFAULT_STYLES: FooterStyles = {
  paddingTop: { mobile: 40, desktop: 64 },
  paddingBottom: { mobile: 40, desktop: 64 },
  paddingX: { mobile: 24, desktop: 24 },
  backgroundColor: "#F3F7FC", // --color-bone (light glass surface)
  textColor: "#1B2737", // --color-ink
  linkColor: "#5B6B85", // --color-stone (muted slate, WCAG AA on bone)
  linkHoverColor: "#2563EB", // --color-moss (accent blue)
  animation: { type: "NONE", scrollTrigger: true },
};

export const FOOTER_DEFAULT_CONTENT: FooterContent = {
  brandDescription:
    "Premium lifestyle & activewear for every journey. Wear the ground you cover.",
  shopLinks: [
    { label: "All Products", href: "/shop" },
    { label: "Collections", href: "/collection" },
    { label: "New Arrivals", href: "/shop?category=new-arrivals" },
    { label: "Limited Edition", href: "/shop?category=limited" },
  ],
  supportLinks: [
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping" },
  ],
  companyLinks: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"],
  styles: FOOTER_DEFAULT_STYLES,
};

/** Keys the parser is allowed to carry over from a partial/invalid payload. */
const FOOTER_CONTENT_KEYS: (keyof FooterContent)[] = [
  "brandDescription",
  "shopLinks",
  "supportLinks",
  "companyLinks",
  "paymentMethods",
  "styles",
];

/** Parse raw SiteSection.content (string or object) into a fully-shaped object. Never throws. */
export function parseFooterContent(raw: unknown): FooterContent {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== "object") return FOOTER_DEFAULT_CONTENT;

  const parsed = obj as Record<string, unknown>;
  const result = footerContentSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Safe fallback: keep only known keys from the partial input (strips any
  // legacy brandName/socialLinks/bottomLinks from old DB JSON), merge onto the
  // defaults so a missing `styles` block still renders correctly.
  const clean: Record<string, unknown> = {};
  for (const k of FOOTER_CONTENT_KEYS) {
    if (parsed[k] !== undefined) clean[k] = parsed[k];
  }
  return {
    ...FOOTER_DEFAULT_CONTENT,
    ...clean,
    styles: {
      ...FOOTER_DEFAULT_STYLES,
      ...((clean.styles as object) ?? {}),
      paddingTop: normalizeBreakpoint((clean.styles as Record<string, unknown> | undefined)?.paddingTop, FOOTER_DEFAULT_STYLES.paddingTop, 40, 400),
      paddingBottom: normalizeBreakpoint((clean.styles as Record<string, unknown> | undefined)?.paddingBottom, FOOTER_DEFAULT_STYLES.paddingBottom, 40, 400),
      paddingX: normalizeBreakpoint((clean.styles as Record<string, unknown> | undefined)?.paddingX, FOOTER_DEFAULT_STYLES.paddingX, 24, 200),
      backgroundColor: migrateSurfaceColor(((clean.styles as Record<string, unknown> | undefined)?.backgroundColor as string | undefined) ?? FOOTER_DEFAULT_STYLES.backgroundColor),
      textColor: migrateTextColor(((clean.styles as Record<string, unknown> | undefined)?.textColor as string | undefined) ?? FOOTER_DEFAULT_STYLES.textColor),
      linkColor: migrateTextColor(((clean.styles as Record<string, unknown> | undefined)?.linkColor as string | undefined) ?? FOOTER_DEFAULT_STYLES.linkColor),
      linkHoverColor: migrateLinkHoverColor(((clean.styles as Record<string, unknown> | undefined)?.linkHoverColor as string | undefined) ?? FOOTER_DEFAULT_STYLES.linkHoverColor),
      animation: normalizeAnimation((clean.styles as Record<string, unknown> | undefined)?.animation),
    },
  };
}

export function serializeFooterContent(content: FooterContent): string {
  return JSON.stringify(content);
}

