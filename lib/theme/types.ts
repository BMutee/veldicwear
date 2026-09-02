// ─── Theme engine: core types ────────────────────────────────────────────────
// Architecture ported from Shopify's Horizon theme (behavioral spec, not code):
//
//   Horizon concept                     →  this module
//   ─────────────────────────────────────────────────────────────────────────
//   templates/*.json                    →  TemplateDoc (sections map + order)
//   {% schema %} in sections/*.liquid   →  SectionDef.settings / blocks /
//                                          presets / disabled_on
//   {% schema %} in blocks/*.liquid     →  BlockDef (incl. "_" private blocks)
//   static blocks                       →  BlockInstance.static (locked,
//                                          settings-editable only)
//   settings_data.json overlay          →  SettingValues bags resolved through
//                                          resolveSettings() (lib/theme/resolve)
//
// The editor's data model IS this JSON structure; the storefront renderer
// consumes the same structure. There is no separate draft format.

export type BreakpointValue = { mobile: number; desktop: number };

/** A single setting value as stored in a template/settings document. */
export type SettingValue =
  | string
  | number
  | boolean
  | null
  | BreakpointValue
  | SettingValue[]
  | { [key: string]: SettingValue };

export type SettingValues = { [id: string]: SettingValue };

/** Widgets the generic schema interpreter knows how to render. */
export type SettingControl =
  | "text"
  | "textarea"
  | "number"
  | "range"
  | "select"
  | "checkbox"
  | "color"
  | "image_picker"
  | "video"
  | "link"
  | "product_picker"
  | "repeater"
  | "header"
  | "paragraph"
  | "breakpoint_range";

export type SettingDef = {
  id: string;
  /** Display label. `t:`-prefixed keys resolve through lib/theme/locales. */
  label: string;
  type: SettingControl;
  /** Pre-filled value. May be a `{{ settings.x }}` cross-setting reference. */
  default?: SettingValue;
  /** Inline help text under the control. */
  info?: string;
  /**
   * Conditional visibility expression evaluated LIVE against in-progress
   * values, e.g. `"cta_label != blank"` or
   * `"{{ settings.animation_type != 'NONE' }}"`.
   */
  visible_if?: string;
  placeholder?: string;
  /** number / range / breakpoint_range */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** select */
  options?: { value: string; label: string }[];
  /** repeater */
  item_fields?: SettingDef[];
  item_label?: string;
  add_label?: string;
  max_items?: number;
};

/** Which block types a section (or nestable block) accepts. */
export type BlockAccept = {
  type: string;
  /** Wildcard: any block type defined anywhere in the theme. */
  any?: boolean;
  /** Cap on instances of this type inside one parent. */
  max?: number;
};

export type SectionPreset = {
  name: string;
  settings?: SettingValues;
  /** Starter blocks (IDs are generated at insert time, Horizon-style). */
  blocks?: { type: string; static?: boolean; settings?: SettingValues }[];
};

export type SectionDef = {
  /** Definition key — matches the legacy SiteSection.key for migration. */
  type: string;
  /** `t:`-prefixed name shown in the editor + picker. */
  name: string;
  description?: string;
  /** Core sections ship with the template and cannot be deleted. */
  locked?: boolean;
  settings: SettingDef[];
  blocks: BlockAccept[];
  presets: SectionPreset[];
  /** Placement restrictions — enforced by filtering the add-picker. */
  disabled_on?: { groups?: string[]; templates?: string[] };
};

export type BlockDef = {
  /**
   * Block type key. Prefixed `_` = private/internal: wired as a static block
   * inside specific sections, never offered in a generic add-block picker.
   */
  type: string;
  name: string;
  settings: SettingDef[];
  /** Recursive nesting (Horizon `group` pattern) — reserved for open canvas. */
  blocks?: BlockAccept[];
};

// ─── Template document (the single source of truth for a page) ───────────────

export type BlockInstance = {
  type: string;
  /** Static blocks are pre-wired: settings editable, position fixed, no delete. */
  static?: boolean;
  settings: SettingValues;
  blocks?: { [instanceId: string]: BlockInstance };
  block_order?: string[];
};

export type SectionInstance = {
  type: string;
  /** Hidden sections stay in the document but don't render on the live site. */
  hidden?: boolean;
  settings: SettingValues;
  blocks: { [instanceId: string]: BlockInstance };
  block_order: string[];
};

export type TemplateDoc = {
  sections: { [instanceId: string]: SectionInstance };
  order: string[];
};

// ─── Resolved (render-time) shapes ───────────────────────────────────────────

export type ResolvedBlock = {
  id: string;
  type: string;
  static: boolean;
  settings: SettingValues;
  blocks: ResolvedBlock[];
};

export type ResolvedSection = {
  id: string;
  type: string;
  hidden: boolean;
  settings: SettingValues;
  blocks: ResolvedBlock[];
};

// ─── Global theme settings (config/settings_schema.json equivalent) ─────────

export type ThemeSettingsGroup = {
  name: string;
  settings: SettingDef[];
};

// ─── Validation schemas (shared client/server) ──────────────────────────────
import { z } from "zod";

export const breakpointValueSchema = z.object({
  mobile: z.number().int().finite(),
  desktop: z.number().int().finite(),
});

export const settingValueSchema: z.ZodType<SettingValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    breakpointValueSchema,
    z.array(settingValueSchema),
    z.record(z.string(), settingValueSchema),
  ])
) as z.ZodType<SettingValue>;

export const settingValuesSchema = z.record(z.string(), settingValueSchema);

const blockInstanceSchema: z.ZodType<BlockInstance> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    static: z.boolean().optional(),
    settings: settingValuesSchema,
    blocks: z.record(z.string(), blockInstanceSchema).optional(),
    block_order: z.array(z.string().min(1)).optional(),
  })
);

export const sectionInstanceSchema = z.object({
  type: z.string().min(1),
  hidden: z.boolean().optional(),
  settings: settingValuesSchema,
  blocks: z.record(z.string(), blockInstanceSchema),
  block_order: z.array(z.string().min(1)),
});

export const templateDocSchema = z.object({
  sections: z.record(z.string(), sectionInstanceSchema),
  order: z.array(z.string().min(1)),
});

/** POST body for the single-section render endpoint (Section Rendering API). */
export const renderSectionRequestSchema = z.object({
  type: z.string().min(1),
  settings: settingValuesSchema.default({}),
  blocks: z
    .array(
      z.object({
        type: z.string().min(1),
        settings: settingValuesSchema.default({}),
      })
    )
    .default([]),
});

