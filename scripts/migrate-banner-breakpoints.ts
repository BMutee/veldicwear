/**
 * One-time data migration:
 * Convert the Banner SiteSection row's sizing styles from single numbers
 * (the pre-breakpoint shape) into per-breakpoint { mobile, desktop } objects.
 *
 * Mapping (keeps the existing visual output identical):
 *   - desktop = the stored single number (it already was the desktop size)
 *   - mobile  = the fluid() floor that value used to clamp to
 *               (paddingTop/Bottom 24, paddingX 16, headingFontSize 20)
 *
 * Uses parseBannerContent(), which normalizes legacy shapes on read, then
 * writes the normalized (new-shape) JSON back. Idempotent: a row already in
 * the { mobile, desktop } shape is rewritten unchanged (no-op).
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import {
  parseBannerContent,
  serializeBannerContent,
} from "../lib/banner-section";

const KEY = "banner";

async function main() {
  const section = await prisma.siteSection.findUnique({ where: { key: KEY } });

  if (!section) {
    console.log("No SiteSection('banner') row — nothing to migrate.");
    await prisma.$disconnect();
    return;
  }

  const before = section.content ?? "null";
  const content = parseBannerContent(section.content);
  const after = serializeBannerContent(content);

  console.log("=== SiteSection('banner') BEFORE ===");
  console.log(before);

  const changed = before !== after;
  if (changed) {
    await prisma.siteSection.update({
      where: { key: KEY },
      data: { content: after },
    });
  }

  console.log("\n=== SiteSection('banner') AFTER ===");
  console.log(after);
  console.log(
    changed
      ? "\nMigrated: single-number sizing styles -> { mobile, desktop } breakpoint objects."
      : "\nNo change: row was already in the breakpoint shape (or empty — defaults apply)."
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
