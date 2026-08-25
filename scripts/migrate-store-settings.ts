/**
 * One-time data migration:
 * Move the footer SiteSection content fields that are now owned by StoreSettings
 * (brandName -> storeName, socialLinks -> per-platform fields, bottomLinks ->
 * footerNavLinks, copyright -> copyrightText) into the singleton StoreSettings
 * "store" row.
 *
 * Safety rules (never clobber a real admin value):
 *  - storeName        : only overwritten when still at the admin default
 *                       sentinel "VELDIC WEAR" AND a live value exists that differs.
 *  - social fields    : only filled when currently null and a live value exists.
 *  - footerNavLinks   : only set when currently null and live bottomLinks exist.
 *  - copyrightText    : set to "All rights reserved." only when currently empty or
 *                       equal to the admin default; a customized value is kept.
 *
 * Idempotent: re-running makes no further changes.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

const STORE_ID = "store";
const STORENAME_SENTINEL = "VELDIC WEAR";
const COPYRIGHT_DEFAULT = "All rights reserved.";

type PlatformField = "instagram" | "facebook" | "twitter" | "tiktok" | "youtube";
const PLATFORM_FIELDS: PlatformField[] = ["instagram", "facebook", "twitter", "tiktok", "youtube"];

/** Legacy footer fields that were moved into StoreSettings (no longer in the
 *  footerContentSchema, so read them as raw JSON rather than the typed shape). */
interface LegacyFooter {
  brandName?: string;
  socialLinks?: { platform?: string; href?: string; ariaLabel?: string }[];
  bottomLinks?: { label: string; href: string }[];
}

function readLegacyFooter(raw: string | null): LegacyFooter {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object" ? parsed : {}) as LegacyFooter;
  } catch {
    return {};
  }
}

async function main() {
  // --- 1. Read CURRENT live footer content (DB row, else empty legacy) ---
  const footerSection = await prisma.siteSection.findUnique({ where: { key: "footer" } });
  const live = readLegacyFooter(footerSection?.content ?? null);

  console.log("=== Live footer values (source of migration) ===");
  console.log("footer SiteSection row present:", !!footerSection);
  console.log("live storeName/brandName:", live.brandName);
  console.log("live socialLinks:", JSON.stringify(live.socialLinks));
  console.log("live bottomLinks:", JSON.stringify(live.bottomLinks));

  // --- 2. Read current StoreSettings row (or create from admin defaults) ---
  let ss = await prisma.storeSettings.findUnique({ where: { id: STORE_ID } });
  if (!ss) {
    ss = await prisma.storeSettings.create({
      data: {
        id: STORE_ID,
        storeName: STORENAME_SENTINEL,
        copyrightText: COPYRIGHT_DEFAULT,
        currency: "USD",
        currencySymbol: "$",
      } as any,
    });
    console.log("StoreSettings row was missing — created with defaults.");
  }

  // --- 3. Compute the safe target values ---
  const socialByPlatform = new Map<string, string>();
  for (const s of live.socialLinks ?? []) {
    socialByPlatform.set((s.platform || "").toLowerCase(), s.href || "");
  }

  // storeName
  let storeName = ss.storeName;
  if (ss.storeName === STORENAME_SENTINEL && live.brandName && live.brandName !== STORENAME_SENTINEL) {
    storeName = live.brandName;
  }
  const storeNameResolved = storeName !== ss.storeName
    ? `${ss.storeName} -> ${storeName}`
    : "(unchanged — already customized or no live diff)";

  // social fields (only fill nulls)
  const socialUpdates: Record<PlatformField, string | null | undefined> = {
    instagram: ss.instagram,
    facebook: ss.facebook,
    twitter: ss.twitter,
    tiktok: ss.tiktok,
    youtube: ss.youtube,
  };
  const socialDecisions: string[] = [];
  for (const field of PLATFORM_FIELDS) {
    const platformKey = field.toLowerCase(); // instagram/facebook/twitter/tiktok/youtube
    const liveHref = socialByPlatform.get(platformKey);
    const current = ss[field as keyof typeof ss] as string | null;
    if (!current && liveHref) {
      socialUpdates[field] = liveHref;
      socialDecisions.push(`${field}: null -> ${liveHref}`);
    } else if (current) {
      socialDecisions.push(`${field}: kept ${current}`);
    } else {
      socialDecisions.push(`${field}: null (no live value)`);
    }
  }

  // footerNavLinks (JSON string of {label,href}[])
  let footerNavLinks = ss.footerNavLinks;
  let footerNavLinksDecision: string;
  if (!footerNavLinks && Array.isArray(live.bottomLinks) && live.bottomLinks.length > 0) {
    footerNavLinks = JSON.stringify(live.bottomLinks);
    footerNavLinksDecision = `null -> ${footerNavLinks}`;
  } else if (footerNavLinks) {
    footerNavLinksDecision = "(unchanged — already set)";
  } else {
    footerNavLinksDecision = "(null — no live bottomLinks)";
  }

  // copyrightText
  let copyrightText = ss.copyrightText;
  let copyrightDecision: string;
  if (!copyrightText || copyrightText === COPYRIGHT_DEFAULT) {
    copyrightText = COPYRIGHT_DEFAULT;
    copyrightDecision = `(${ss.copyrightText ?? "null"}) -> "${copyrightText}" (matches live suffix "All rights reserved.")`;
  } else {
    copyrightDecision = `(unchanged — customized "${copyrightText}")`;
  }

  // --- 4. Apply (only the migrated fields) ---
  const update: Record<string, unknown> = {
    storeName,
    instagram: socialUpdates.instagram,
    facebook: socialUpdates.facebook,
    twitter: socialUpdates.twitter,
    tiktok: socialUpdates.tiktok,
    youtube: socialUpdates.youtube,
    footerNavLinks,
    copyrightText,
  };
  await prisma.storeSettings.update({ where: { id: STORE_ID }, data: update });

  // --- 5. Report ---
  console.log("\n=== Migration decisions ===");
  console.log("storeName:", storeNameResolved);
  console.log("social:");
  socialDecisions.forEach((d) => console.log("  -", d));
  console.log("footerNavLinks:", footerNavLinksDecision);
  console.log("copyrightText:", copyrightDecision);

  // --- 6. Confirm ---
  const after = await prisma.storeSettings.findUnique({ where: { id: STORE_ID } });
  console.log("\n=== StoreSettings AFTER migration ===");
  console.log(JSON.stringify(after, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
