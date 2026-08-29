-- AlterTable: add costPrice to ProductVariant (profit-margin feature)
-- NOTE: the column already exists on live databases (it was applied via
-- `prisma db push` and never captured as a migration). IF NOT EXISTS makes
-- this safe to deploy on both fresh databases and databases that already
-- have the column.
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;