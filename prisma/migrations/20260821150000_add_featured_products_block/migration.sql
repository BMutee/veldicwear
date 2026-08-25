-- Add the FEATURED_PRODUCTS block type (manually-curated, ordered product
-- list owned by SiteSection("featured-products")). The one-time data
-- migration scripts/migrate-featured-products-block.ts creates the initial
-- Block; this migration only extends the enum so that value can be stored.
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'FEATURED_PRODUCTS';
