-- Add optional product video URL (imported from CJ product/query videoUrl)
ALTER TABLE "Product" ADD COLUMN "videoUrl" TEXT;

-- Add CJ variant SKU to ProductVariant
ALTER TABLE "ProductVariant" ADD COLUMN "sku" TEXT;