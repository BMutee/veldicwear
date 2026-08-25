-- Add the independent ordered block system. Legacy CmsPage content and CTAs
-- remain untouched; existing pages simply have zero related blocks.
CREATE TYPE "BlockType" AS ENUM ('RICH_TEXT', 'IMAGE', 'BUTTON', 'IMAGE_TEXT', 'GALLERY');

CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "styles" JSONB NOT NULL,
    CONSTRAINT "Block_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Block_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CmsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Block_pageId_order_idx" ON "Block"("pageId", "order");