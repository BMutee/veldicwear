-- Add optional page CTA fields. Existing CmsPage rows remain unchanged.
ALTER TABLE "CmsPage"
ADD COLUMN "ctaLabel" TEXT,
ADD COLUMN "ctaUrl" TEXT;
