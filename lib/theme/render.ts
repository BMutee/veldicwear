// ─── Storefront render pipeline (template doc → resolved render contexts) ───
// Horizon's resolution algorithm, adapted to our stack:
//
//   1. Load the template document for the URL (the homepage → "index").
//   2. Walk `order`; for each section instance load its DEFINITION.
//   3. Build the section context: settings = schema defaults merged with the
//      instance's stored overlay (same resolver as global + block settings).
//   4. Walk `block_order`; resolve each block instance identically.
//   5. Hand the resolved contexts to the section renderer (SectionRenderer).
//
// Global theme settings are an ambient context available at every level.

import { getStoreSettings } from "@/lib/settings";
import { getTemplateDocument, type DocumentSource } from "./document";
import { getSectionDef } from "./definitions/sections";
import { getBlockDef } from "./definitions/blocks";
import { resolveSettings } from "./resolve";
import type { ResolvedSection, SettingValues, TemplateDoc } from "./types";

export type RenderSectionsResult = {
  sections: ResolvedSection[];
  source: DocumentSource;
  error?: string;
};

/**
 * Resolve every section in render order. Includes hidden sections — callers
 * decide visibility (live site filters them; the design-mode preview shows
 * all with a dimmed treatment).
 */
export async function getRenderSections(): Promise<RenderSectionsResult> {
  let globalSettings: SettingValues = {};
  try {
    const store = await getStoreSettings();
    globalSettings = store as unknown as SettingValues;
  } catch {
    // Ambient settings stay empty; resolver falls back to schema defaults.
  }

  let doc: TemplateDoc;
  let source: DocumentSource;
  let error: string | undefined;
  try {
    const loaded = await getTemplateDocument();
    doc = loaded.doc;
    source = loaded.source;
    error = (loaded as { error?: string }).error;
  } catch (err) {
    doc = { sections: {}, order: [] };
    source = "fallback";
    error = err instanceof Error ? err.message : "Unknown document error";
  }

  const sections: ResolvedSection[] = [];
  for (const id of doc.order) {
    const instance = doc.sections[id];
    if (!instance) continue;
    const def = getSectionDef(instance.type);
    if (!def) continue; // definition removed from codebase — skip silently

    const settings = resolveSettings(def.settings, instance.settings, globalSettings);
    const blocks = instance.block_order
      .map((blockId) => {
        const block = instance.blocks[blockId];
        if (!block) return null;
        const blockDef = getBlockDef(block.type);
        return {
          id: blockId,
          type: block.type,
          static: block.static ?? false,
          settings: resolveSettings(blockDef?.settings ?? [], block.settings, globalSettings),
          blocks: [] as ResolvedSection["blocks"],
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    sections.push({
      id,
      type: instance.type,
      hidden: instance.hidden ?? false,
      settings,
      blocks,
    });
  }

  return { sections, source, error };
}
