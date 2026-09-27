/**
 * Regenerate public/email-logo.png from the storefront logo.
 *
 *   npx tsx scripts/make-email-logo.ts
 *
 * Why this exists: the site serves /Logo.webp, but Outlook cannot render WebP at
 * all, so a WebP logo is an invisible logo for a large share of customers. The
 * email asset is therefore a separate 600px-wide PNG (600 is the safe content
 * width) with the alpha channel flattened onto white — a transparent logo
 * disappears against a dark mail theme and its cream tones wash out on some
 * clients.
 *
 * The PNG is committed, so this only needs re-running when the brand logo
 * changes. Keep it in sync or the email header goes stale.
 */
import sharp from "sharp";
import { statSync } from "node:fs";
import path from "node:path";

const SOURCE = path.join(process.cwd(), "public", "Logo.webp");
const OUTPUT = path.join(process.cwd(), "public", "email-logo.png");
const WIDTH = 600;

async function main() {
  const buffer = await sharp(SOURCE)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .flatten({ background: "#FFFFFF" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await sharp(buffer).toFile(OUTPUT);

  const meta = await sharp(buffer).metadata();
  console.log(
    `public/email-logo.png  ${meta.width}x${meta.height}  ${(
      statSync(OUTPUT).size / 1024
    ).toFixed(1)} KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
