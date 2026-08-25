// Server-side only. Imports Prisma (see lib/prisma.ts) — do NOT import this
// module from Client Components. Use `lib/store-settings.ts` for types/pure
// helpers that clients need.
import { prisma } from "@/lib/prisma";
import type { StoreSettings } from "@/lib/store-settings";

export type { StoreSettings } from "@/lib/store-settings";

/**
 * Fetch the singleton StoreSettings row (`id === "store"`), or fall back to
 * safe defaults if the row hasn't been seeded yet.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const s = await prisma.storeSettings.findUnique({ where: { id: "store" } });
  if (!s) {
    // Lazy default mirror of the admin route's DEFAULT_SETTINGS.
    const { DEFAULT_STORE_SETTINGS } = await import("@/lib/store-settings");
    return DEFAULT_STORE_SETTINGS;
  }
  return {
    storeName: s.storeName,
    logo: s.logo,
    email: s.email,
    phone: s.phone,
    address: s.address,
    instagram: s.instagram,
    facebook: s.facebook,
    twitter: s.twitter,
    tiktok: s.tiktok,
    youtube: s.youtube,
    copyrightText: s.copyrightText,
    footerNavLinks: s.footerNavLinks,
    currency: s.currency,
    currencySymbol: s.currencySymbol,
  };
}

