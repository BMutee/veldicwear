-- A block has one, and only one, owner. Existing CMS-page blocks retain their
-- pageId; the added sectionKey is NULL, so no existing row changes behavior.
ALTER TABLE "Block" ALTER COLUMN "pageId" DROP NOT NULL;
ALTER TABLE "Block" ADD COLUMN "sectionKey" TEXT;

ALTER TABLE "Block"
  ADD CONSTRAINT "Block_exactly_one_owner_check"
  CHECK (("pageId" IS NOT NULL AND "sectionKey" IS NULL) OR ("pageId" IS NULL AND "sectionKey" IS NOT NULL));

ALTER TABLE "Block"
  ADD CONSTRAINT "Block_sectionKey_fkey"
  FOREIGN KEY ("sectionKey") REFERENCES "SiteSection"("key") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Block_sectionKey_order_idx" ON "Block"("sectionKey", "order");
