// ─── Template document store (server-only) ───────────────────────────────────
// The homepage is a Horizon-style JSON template document: an ordered map of
// section instances, each with settings and nested block instances. This is
// the SINGLE source of truth — the editor's data model and the storefront
// renderer consume the exact same structure.
//
// Storage: the TemplateDocument table (templateType "index"). On first access
// after deploy, the legacy SiteSection + Block rows are converted in place
// (one-time, idempotent); the legacy rows are left untouched as a rollback
// record, matching this repo's established migration convention. If the DB is
// unreachable the canonical default document keeps the site rendering.

import { prisma } from "@/lib/prisma";
import { parseStoredBlock } from "@/lib/block-section";
import type { FeaturedBlockContent, FeaturedBlockStyles, HeroBlockContent } from "@/lib/block-section";
import { SECTION_DEFS, getSectionDef } from "./definitions/sections";
import { getBlockDef } from "./definitions/blocks";
import { createSectionInstance, newInstanceId } from "./instances";
import { templateDocSchema, type SectionInstance, type SettingValues, type TemplateDoc } from "./types";

export const TEMPLATE_TYPE = "index";

export type DocumentSource = "database" | "migrated" | "fallback";

function safeParseJsonObject(raw: string | null): SettingValues {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Canonical document built from definition presets (DB-down fallback and
 *  fresh-install seed). */
export function defaultDocument(): TemplateDoc {
  const sections: TemplateDoc["sections"] = {};
  const order: string[] = [];
  for (const def of SECTION_DEFS) {
    const { id, instance } = createSectionInstance(def.type, 0);
    sections[id] = instance;
    order.push(id);
  }
  return { sections, order };
}

/**
 * One-time conversion of the legacy SiteSection/Block storage into a template
 * document. Idempotent: only runs when no document row exists yet.
 */
async function migrateLegacyIntoDocument(): Promise<TemplateDoc> {
  const rows = await prisma.siteSection.findMany({ orderBy: { position: "asc" } });
  const knownTypes = new Set(SECTION_DEFS.map((def) => def.type));
  const relevant = rows.filter((row) => knownTypes.has(row.key));
  // Fall back to the canonical document when the legacy table is empty.
  if (relevant.length === 0) return defaultDocument();

  const sections: TemplateDoc["sections"] = {};
  const order: string[] = [];

  for (const row of relevant) {
    const def = getSectionDef(row.key)!;
    const instance: SectionInstance = {
      type: def.type,
      hidden: !row.published,
      settings: {},
      blocks: {},
      block_order: [],
    };

    const staticAccept = def.blocks.find((b) => b.max === 1);
    if (staticAccept && getBlockDef(staticAccept.type)) {
      const legacyBlock = await prisma.block.findFirst({
        where: { sectionKey: row.key },
        orderBy: { order: "asc" },
      });
      const blockId = newInstanceId("content");
      instance.blocks[blockId] = {
        type: staticAccept.type,
        static: true,
        settings: legacyBlock
          ? flattenLegacyBlock(row.key, staticAccept.type, legacyBlock.content, legacyBlock.styles)
          : presetBlockSettings(staticAccept.type),
        blocks: {},
        block_order: [],
      };
      instance.block_order = [blockId];
    } else {
      instance.settings = safeParseJsonObject(row.content);
    }

    const id = newInstanceId(def.type);
    sections[id] = instance;
    order.push(id);
  }

  return { sections, order };
}

/** Preset defaults for a definition's static block (fresh installs). */
function presetBlockSettings(blockType: string): SettingValues {
  const blockDef = getBlockDef(blockType);
  const out: SettingValues = {};
  for (const setting of blockDef?.settings ?? []) {
    if (setting.type === "header" || setting.type === "paragraph") continue;
    if (setting.default !== undefined) out[setting.id] = setting.default;
  }
  return out;
}

/** Convert a legacy Block row (content JSON + styles JSON) into the flat
 *  settings bag the document stores. Uses the battle-tested legacy
 *  normalizers so every historical row shape parses. */
function flattenLegacyBlock(sectionKey: string, blockType: string, content: unknown, styles: unknown): SettingValues {
  if (blockType === "_featured-products") {
    const parsed = parseStoredBlock("FEATURED_PRODUCTS", content, styles);
    const c = parsed.content as FeaturedBlockContent;
    const s = parsed.styles as FeaturedBlockStyles;
    return {
      productIds: c.productIds,
      featuredSectionTitle: c.featuredSectionTitle,
      featuredSectionSubtitle: c.featuredSectionSubtitle,
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      paddingX: s.paddingX,
      headingFontSize: s.headingFontSize,
      backgroundColor: s.backgroundColor,
      textColor: s.textColor,
      animationType: s.animation.type,
      animationScrollTrigger: s.animation.scrollTrigger,
    };
  }

  // hero + banner share the legacy HERO block type
  const parsed = parseStoredBlock("HERO", content, styles);
  const c = parsed.content as HeroBlockContent;
  const s = parsed.styles as {
    paddingTop: { mobile: number; desktop: number };
    paddingBottom: { mobile: number; desktop: number };
    paddingX: { mobile: number; desktop: number };
    headlineFontSize?: { mobile: number; desktop: number };
    headingFontSize?: { mobile: number; desktop: number };
    backgroundColor: string;
    textColor: string;
    animation: { type: string; scrollTrigger: boolean };
  };
  void sectionKey;
  const out: SettingValues = {
    heading: c.heading,
    subtext: c.subtext ?? "",
    tagline: c.tagline ?? "",
    trustProductCount: c.trustProductCount ?? "",
    trustMemberCount: c.trustMemberCount ?? "",
    trustRating: c.trustRating ?? "",
    backgroundImage: c.backgroundImage?.src ?? null,
    backgroundImageAlt: c.backgroundImage?.alt ?? "",
    ctaLabel: c.cta?.label ?? "",
    ctaUrl: c.cta?.url ?? "",
    ctaBackgroundColor: c.cta?.ctaBackgroundColor ?? null,
    ctaTextColor: c.cta?.ctaTextColor ?? null,
    paddingTop: s.paddingTop,
    paddingBottom: s.paddingBottom,
    paddingX: s.paddingX,
    backgroundColor: s.backgroundColor,
    textColor: s.textColor,
    animationType: s.animation.type,
    animationScrollTrigger: s.animation.scrollTrigger,
  };
  if (s.headlineFontSize) out["headlineFontSize"] = s.headlineFontSize;
  if (s.headingFontSize) out["headingFontSize"] = s.headingFontSize;
  return out;
}

// ─── Public document API ─────────────────────────────────────────────────────

/**
 * Load the homepage template document. Order of preference:
 *   1. stored document (normal path)
 *   2. one-time migration from legacy SiteSection/Block rows (first deploy)
 *   3. canonical default document (fresh DB / DB unreachable)
 */
export async function getTemplateDocument(): Promise<{ doc: TemplateDoc; source: DocumentSource }> {
  try {
    const row = await prisma.templateDocument.findUnique({ where: { templateType: TEMPLATE_TYPE } });
    if (row) {
      const parsed = templateDocSchema.safeParse(row.document);
      if (parsed.success) return { doc: parsed.data as TemplateDoc, source: "database" };
    }
    // No row (first deploy) or corrupt document: convert legacy storage, then
    // persist so subsequent reads take the normal path.
    const doc = await migrateLegacyIntoDocument();
    await upsertDocument(doc);
    return { doc, source: "migrated" };
  } catch (error) {
    // DB unreachable: keep the site rendering from the canonical document.
    return {
      doc: defaultDocument(),
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown database error",
    } as { doc: TemplateDoc; source: DocumentSource; error?: string };
  }
}

/** Validate + persist a document (the editor's autosave target). */
export async function saveTemplateDocument(input: unknown): Promise<TemplateDoc> {
  const parsed = templateDocSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid template document: ${issue?.path.join(".") ?? "?"} — ${issue?.message ?? "validation failed"}`
    );
  }
  const doc = parsed.data as TemplateDoc;
  await upsertDocument(doc);
  return doc;
}

async function upsertDocument(doc: TemplateDoc): Promise<void> {
  await prisma.templateDocument.upsert({
    where: { templateType: TEMPLATE_TYPE },
    update: { document: doc as unknown as object },
    create: { templateType: TEMPLATE_TYPE, document: doc as unknown as object },
  });
}

