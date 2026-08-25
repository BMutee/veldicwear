/**
 * Client-safe StoreSettings surface.
 *
 * The live DB row for StoreSettings lives in `lib/settings.ts` (server-only,
 * imports Prisma). This module holds the pure types and helper functions that
 * CLIENT components (Footer, Navbar) need, so they never pull Prisma into the
 * browser bundle. A Server Component fetches the row via getStoreSettings() and
 * passes the plain object down to these clients as props.
 */

export interface FooterNavLink {
  label: string;
  href: string;
}

export interface StoreSocialLink {
  platform: string;
  href: string;
  ariaLabel: string;
}

export interface StoreSettings {
  storeName: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  copyrightText: string;
  footerNavLinks: string | null;
  currency: string;
  currencySymbol: string;
}

/** Fallback used when the DB row is missing (e.g. DB not seeded). */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Veldic Wear",
  logo: null,
  email: null,
  phone: null,
  address: null,
  instagram: "https://instagram.com/veldicwear",
  facebook: null,
  twitter: "https://twitter.com/veldicwear",
  tiktok: "https://tiktok.com/@veldicwear",
  youtube: "https://youtube.com/@veldicwear",
  copyrightText: "All rights reserved.",
  footerNavLinks: null,
  currency: "USD",
  currencySymbol: "$",
};

const SOCIAL_MAP: Array<{
  field: keyof StoreSettings;
  platform: string;
  ariaLabel: string;
}> = [
  { field: "instagram", platform: "Instagram", ariaLabel: "Instagram" },
  { field: "facebook", platform: "Facebook", ariaLabel: "Facebook" },
  { field: "twitter", platform: "Twitter", ariaLabel: "Twitter / X" },
  { field: "tiktok", platform: "TikTok", ariaLabel: "TikTok" },
  { field: "youtube", platform: "YouTube", ariaLabel: "YouTube" },
];

/** Build the footer social-link list from individual StoreSettings fields. */
export function getStoreSocialLinks(
  s: StoreSettings | null | undefined
): StoreSocialLink[] {
  const base = s ?? DEFAULT_STORE_SETTINGS;
  return SOCIAL_MAP.filter((m) => Boolean(base[m.field]))
    .map((m) => ({
      platform: m.platform,
      href: (base[m.field] as string) ?? "",
      ariaLabel: m.ariaLabel,
    }));
}

/** Parse the StoreSettings.footerNavLinks JSON string into link objects. */
export function getFooterNavLinks(
  s: StoreSettings | null | undefined
): FooterNavLink[] {
  const base = s ?? DEFAULT_STORE_SETTINGS;
  if (!base.footerNavLinks) return [];
  try {
    const parsed = JSON.parse(base.footerNavLinks);
    if (Array.isArray(parsed)) {
      return (parsed as FooterNavLink[]).filter(
        (l) => typeof l?.label === "string" && typeof l?.href === "string"
      );
    }
  } catch {
    // malformed JSON — ignore silently
  }
  return [];
}
