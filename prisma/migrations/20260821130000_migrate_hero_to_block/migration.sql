-- Add the Hero block type, then copy the *current* SiteSection("hero") JSON
-- into an independently owned Block. The legacy row remains as a rollback
-- record and is not modified or deleted.
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'HERO';

INSERT INTO "Block" ("id", "pageId", "sectionKey", "type", "order", "content", "styles")
SELECT
  'hero-block-' || "id",
  NULL,
  'hero',
  'HERO'::"BlockType",
  0,
  jsonb_build_object(
    'heading', "content"::jsonb ->> 'heroTitle',
    'subtext', "content"::jsonb ->> 'heroSubtitle',
    'backgroundImage', jsonb_build_object('src', "content"::jsonb ->> 'heroImage', 'alt', ''),
    'cta', jsonb_build_object('label', "content"::jsonb ->> 'heroButtonText', 'url', "content"::jsonb ->> 'heroButtonLink'),
    'tagline', "content"::jsonb ->> 'heroTagline',
    'trustProductCount', "content"::jsonb ->> 'trustProductCount',
    'trustMemberCount', "content"::jsonb ->> 'trustMemberCount',
    'trustRating', "content"::jsonb ->> 'trustRating'
  ),
  "content"::jsonb -> 'styles'
FROM "SiteSection"
WHERE "key" = 'hero'
  AND "content" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Block" WHERE "sectionKey" = 'hero' AND "type" = 'HERO');
