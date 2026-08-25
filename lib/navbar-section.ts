import { z } from "zod";
import { animationSchema, breakpointSchema, hexColorSchema, normalizeAnimation, normalizeBreakpoint } from "./section-shared";

const navLinkSchema = z.object({
  label: z.string().trim().min(1, "Link label is required"),
  href: z.string().trim().min(1, "Link URL is required"),
});

export const navbarStylesSchema = z.object({
  height: breakpointSchema(48, 160),
  paddingX: breakpointSchema(16, 200),
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  linkColor: hexColorSchema,
  linkHoverColor: hexColorSchema,
  animation: animationSchema,
});

export type NavbarLink = z.infer<typeof navLinkSchema>;
export type NavbarStyles = z.infer<typeof navbarStylesSchema>;

export const navbarContentSchema = z.object({
  navLinks: z.array(navLinkSchema).max(20),
  styles: navbarStylesSchema,
});

export type NavbarContent = z.infer<typeof navbarContentSchema>;

// The old header used py-4 (64px total row height), px-6 on mobile and px-16
// at md, ink background, and bone/80 links with bone hover.
export const NAVBAR_DEFAULT_STYLES: NavbarStyles = {
  height: { mobile: 64, desktop: 64 },
  paddingX: { mobile: 24, desktop: 64 },
  backgroundColor: "#171512",
  textColor: "#FAFAF8",
  linkColor: "#CDCCCA",
  linkHoverColor: "#FAFAF8",
  animation: { type: "NONE", scrollTrigger: false },
};

export const NAVBAR_DEFAULT_CONTENT: NavbarContent = {
  navLinks: [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/collection" },
    { label: "About", href: "/about" },
  ],
  styles: NAVBAR_DEFAULT_STYLES,
};

function normalizeLinks(raw: unknown): NavbarLink[] {
  if (!Array.isArray(raw)) return NAVBAR_DEFAULT_CONTENT.navLinks;
  return raw
    .filter(
      (link): link is { label: string; href: string } =>
        !!link &&
        typeof link === "object" &&
        typeof (link as { label?: unknown }).label === "string" &&
        typeof (link as { href?: unknown }).href === "string" &&
        Boolean((link as { label: string }).label.trim()) &&
        Boolean((link as { href: string }).href.trim())
    )
    .slice(0, 20)
    .map((link) => ({ label: link.label.trim(), href: link.href.trim() }));
}

/** Parse and clamp SiteSection("navbar").content. Never throws. */
export function parseNavbarContent(raw: unknown): NavbarContent {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = null;
    }
  }
  if (!obj || typeof obj !== "object") return NAVBAR_DEFAULT_CONTENT;

  const parsed = obj as Record<string, unknown>;
  const result = navbarContentSchema.safeParse(parsed);
  if (result.success) return result.data;

  const rawStyles = (parsed.styles ?? {}) as Record<string, unknown>;
  const color = (raw: unknown, fallback: string) =>
    hexColorSchema.safeParse(raw).success ? raw as string : fallback;
  return {
    navLinks: normalizeLinks(parsed.navLinks),
    styles: {
      ...NAVBAR_DEFAULT_STYLES,
      height: normalizeBreakpoint(rawStyles.height, NAVBAR_DEFAULT_STYLES.height, 48, 160),
      paddingX: normalizeBreakpoint(rawStyles.paddingX, NAVBAR_DEFAULT_STYLES.paddingX, 16, 200),
      backgroundColor: color(rawStyles.backgroundColor, NAVBAR_DEFAULT_STYLES.backgroundColor),
      textColor: color(rawStyles.textColor, NAVBAR_DEFAULT_STYLES.textColor),
      linkColor: color(rawStyles.linkColor, NAVBAR_DEFAULT_STYLES.linkColor),
      linkHoverColor: color(rawStyles.linkHoverColor, NAVBAR_DEFAULT_STYLES.linkHoverColor),
      animation: normalizeAnimation(rawStyles.animation),
    },
  };
}

export function serializeNavbarContent(content: NavbarContent): string {
  return JSON.stringify(content);
}
