// ─── Homepage sections loader (Shopify JSON-template logic) ──────────────────
// In a Shopify theme, the homepage template is an ordered list of sections
// ("sections": { ... }, "order": [...]). This module applies the same logic to
// Veldic Wear: homepage sections are SiteSection rows in the registry, ordered
// by `position`, and visibility is the `published` flag. The homepage renders
// whatever this returns — nothing is hardcoded in app/page.tsx anymore.
//
// ensureDefaults() backfills any registry section missing from the DB (with
// the registry's default content) and assigns registry positions to rows that
// predate the theme editor (position === 0), so the first render after deploy
// matches the previously-hardcoded homepage order.

import { prisma } from "./prisma";
import { DEFAULT_HOME_ORDER, getSectionDef } from "./section-registry";

export type HomeSectionRow = {
  id: string;
  key: string;
  label: string | null;
  published: boolean;
  position: number;
  content: unknown;
};

export type HomeSectionsResult = {
  sections: HomeSectionRow[];
  source: "database" | "fallback";
  error?: string;
};

function safeParseContent(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function ensureDefaults(): Promise<void> {
  const existing = await prisma.siteSection.findMany({
    where: { key: { in: DEFAULT_HOME_ORDER } },
    select: { id: true, key: true, position: true },
  });

  // 1) Create registry sections that don't exist yet (e.g. a section added in
  //    a future deploy), with the registry's default content.
  const missing = DEFAULT_HOME_ORDER.filter(
    (key) => !existing.some((row) => row.key === key)
  );
  if (missing.length > 0) {
    await prisma.siteSection.createMany({
      data: missing.map((key) => {
        const def = getSectionDef(key)!;
        return {
          key,
          label: def.name,
          content: JSON.stringify(def.defaultContent),
          published: true,
          position: def.position,
        };
      }),
    });
  }

  // 2) Backfill positions for rows that predate the theme editor
  //    (position === 0) using the registry's canonical order. Rows reordered
  //    in the editor have non-zero positions and are left untouched.
  const unpositioned = existing.filter((row) => row.position === 0);
  for (const row of unpositioned) {
    const def = getSectionDef(row.key);
    if (def && def.position !== 0) {
      await prisma.siteSection.update({
        where: { id: row.id },
        data: { position: def.position },
      });
    }
  }
}

/**
 * All homepage-registry sections in render order (drafts included — callers
 * decide visibility via `published`, or via a preview token).
 */
export async function getHomeSections(): Promise<HomeSectionsResult> {
  try {
    await ensureDefaults();
    const rows = await prisma.siteSection.findMany({
      where: { key: { in: DEFAULT_HOME_ORDER } },
      orderBy: { position: "asc" },
    });
    return {
      sections: rows.map((row) => ({
        id: row.id,
        key: row.key,
        label: row.label,
        published: row.published,
        position: row.position,
        content: safeParseContent(row.content),
      })),
      source: "database",
    };
  } catch (error) {
    // Database unreachable: fall back to the registry's canonical homepage so
    // the site still renders (same philosophy as the old page.tsx catch).
    return {
      sections: DEFAULT_HOME_ORDER.map((key) => {
        const def = getSectionDef(key)!;
        return {
          id: `fallback-${key}`,
          key,
          label: def.name,
          published: true,
          position: def.position,
          content: def.defaultContent,
        };
      }),
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
