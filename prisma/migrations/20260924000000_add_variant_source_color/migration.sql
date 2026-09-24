-- Preserve the original CJ color on each variant so an admin can rename the
-- storefront color in Admin → Products without losing CJ sync matching.
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "sourceColor" TEXT;

-- Backfill: existing CJ-linked variants keep their current color as the source.
UPDATE "ProductVariant"
SET "sourceColor" = "color"
WHERE "cjVariantId" IS NOT NULL
  AND "color" IS NOT NULL
  AND "color" <> ''
  AND ("sourceColor" IS NULL OR "sourceColor" = '');

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_sourceColor_idx"
ON "ProductVariant"("productId", "sourceColor");
