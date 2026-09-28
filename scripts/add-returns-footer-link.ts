/**
 * One-time data migration: add the "Returns & Exchanges" link to the footer's
 * Support group in the LIVE SiteSection row.
 *
 * Safety rules (never clobber a real admin value):
 *  - Idempotent: re-running detects the existing link and makes no change.
 *  - If an entry already points at /returns, its label is corrected in place
 *    rather than a duplicate being appended.
 *  - Every other group (shopLinks, companyLinks, styles, ...) is written back
 *    untouched, because the row is a single JSON blob.
 *  - A before/after diff is printed so the change is auditable.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

const FOOTER_KEY = "footer";
const NEW_LABEL = "Returns & Exchanges";
const NEW_HREF = "/returns";

type FooterLink = { label: string; href: string };

async function main() {
  const row = await prisma.siteSection.findUnique({ where: { key: FOOTER_KEY } });
  if (!row) {
    console.log("NO footer row found — nothing to migrate.");
    console.log("The footer falls back to FOOTER_DEFAULT_CONTENT (lib/footer-section.ts).");
    return;
  }

  const content = JSON.parse(row.content ?? "{}");
  const before: FooterLink[] = Array.isArray(content.supportLinks)
    ? content.supportLinks
    : [];

  console.log("=== BEFORE ===");
  console.log(JSON.stringify(before, null, 2));

  // Already present? Normalise in place instead of appending a duplicate.
  const existing = before.findIndex(
    (l) => l?.href === NEW_HREF || l?.label === NEW_LABEL,
  );

  let after: FooterLink[];
  if (existing >= 0) {
    if (before[existing].label === NEW_LABEL && before[existing].href === NEW_HREF) {
      console.log(`\n"${NEW_LABEL}" -> ${NEW_HREF} is already present. No change needed.`);
      return;
    }
    after = before.map((l, i) =>
      i === existing ? { label: NEW_LABEL, href: NEW_HREF } : l,
    );
    console.log(`\nExisting entry ${JSON.stringify(before[existing])} updated in place.`);
  } else {
    after = [...before, { label: NEW_LABEL, href: NEW_HREF }];
    console.log(`\nAppending "${NEW_LABEL}" -> ${NEW_HREF}.`);
  }

  console.log("\n=== AFTER ===");
  console.log(JSON.stringify(after, null, 2));

  content.supportLinks = after;
  await prisma.siteSection.update({
    where: { key: FOOTER_KEY },
    data: { content: JSON.stringify(content) },
  });

  console.log(`\nSaved. ${before.length} -> ${after.length} support links.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
