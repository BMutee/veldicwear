// ─── Section/block instance factory (shared client/server) ──────────────────
// Horizon-style stable instance IDs: "<type>_<6 random chars>" (e.g.
// "hero_jVaWmY"). IDs are generated once at creation and never change, so
// editor selections and preview anchors survive re-saves.

import { getSectionDef } from "./definitions/sections";
import { getBlockDef } from "./definitions/blocks";
import type { BlockInstance, SectionInstance } from "./types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function newInstanceId(prefix: string): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}_${suffix}`;
}

/**
 * Build a fresh section instance from a definition preset (what the editor's
 * "Add section" picker inserts). Static blocks come pre-wired per the
 * definition's preset, exactly like Shopify's preset starter blocks.
 */
export function createSectionInstance(type: string, presetIndex = 0): { id: string; instance: SectionInstance } {
  const def = getSectionDef(type);
  if (!def) throw new Error(`Unknown section type: ${type}`);
  const preset = def.presets[presetIndex] ?? def.presets[0];

  const blocks: { [id: string]: BlockInstance } = {};
  const block_order: string[] = [];
  for (const starter of preset?.blocks ?? []) {
    const blockDef = getBlockDef(starter.type);
    const id = newInstanceId(blockDef ? "content" : "block");
    blocks[id] = {
      type: starter.type,
      static: starter.static ?? false,
      settings: starter.settings ? { ...starter.settings } : {},
      blocks: {},
      block_order: [],
    };
    block_order.push(id);
  }

  return {
    id: newInstanceId(type),
    instance: {
      type,
      settings: preset?.settings ? { ...preset.settings } : {},
      blocks,
      block_order,
    },
  };
}
