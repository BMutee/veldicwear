-- Add admin-editable size chart storage to Product (JSON; null = use defaults)
ALTER TABLE "Product" ADD COLUMN "sizeChart" JSONB;
