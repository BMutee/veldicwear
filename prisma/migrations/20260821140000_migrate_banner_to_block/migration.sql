-- Migrate the Banner from a SiteSection to a Block, REUSING the HERO block
-- type (decision: "Banner = Hero without a mandatory background image").
--
-- The legacy SiteSection("banner") row remains as a rollback record and is
-- not modified or deleted.
--
-- The banner's CTA colors (ctaBackgroundColor / ctaTextColor) lived in the
-- legacy styles object; they are carried over into the new block's `cta`
-- object (per the extended HERO content schema) and stripped from the new
-- block's styles (the HERO styles schema has no such keys). backgroundImage
-- is deliberately OMITTED — the banner never sets one.
INSERT INTO "Block" ("id", "pageId", "sectionKey", "type", "order", "content", "styles")
SELECT
  'banner-block-' || "id",
  NULL,
  'banner',
  'HERO'::"BlockType",
  0,
  jsonb_build_object(
    'heading', "content"::jsonb ->> 'heading',
    'subtext', "content"::jsonb ->> 'subtext',
    'cta', jsonb_strip_nulls(jsonb_build_object(
      'label', "content"::jsonb -> 'cta' ->> 'label',
      'url', "content"::jsonb -> 'cta' ->> 'link',
      'ctaBackgroundColor', "content"::jsonb -> 'styles' ->> 'ctaBackgroundColor',
      'ctaTextColor', "content"::jsonb -> 'styles' ->> 'ctaTextColor'
    ))
  ),
  ("content"::jsonb -> 'styles') - 'ctaBackgroundColor' - 'ctaTextColor'
FROM "SiteSection"
WHERE "key" = 'banner'
  AND "content" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Block" WHERE "sectionKey" = 'banner' AND "type" = 'HERO');
