"use client";

// ─── SchemaForm: the generic schema interpreter (§7.1) ───────────────────────
// ONE form-rendering engine reads ANY setting schema — section settings,
// block settings, and global theme settings — and produces the appropriate
// controls, group headers, help text, and conditional visibility. Adding a new
// section type to the platform requires zero editor-UI code: only a schema.
//
// `visible_if` expressions are evaluated CLIENT-SIDE against the live
// (unsaved) values on every change (§7.3), so fields appear/disappear as the
// merchant works. Labels resolve through the `t:` localization layer (§7.4).

import { useMemo } from "react";
import type { SettingDef, SettingValue, SettingValues } from "@/lib/theme/types";
import { evaluateVisibleIf, resolveSettings } from "@/lib/theme/resolve";
import { t } from "@/lib/theme/locales";
import {
  BreakpointRangeInput,
  CheckboxInput,
  ColorInput,
  ImagePickerInput,
  LinkInput,
  NumberInput,
  ProductPickerInput,
  RangeInput,
  RepeaterInput,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "./controls";

export type ControlContext = {
  /** Ambient global settings (for visible_if + cross-setting default refs). */
  globalSettings: SettingValues;
};

export type ControlProps = {
  def: SettingDef;
  value: SettingValue;
  onChange: (value: SettingValue) => void;
  ctx: ControlContext;
};

export default function SchemaForm({
  title,
  subtitle,
  schema,
  values,
  globalSettings = {},
  onChange,
}: {
  /** Panel heading (plain text — already resolved by the caller). */
  title?: string;
  subtitle?: string;
  /** The setting definitions to render, in order. */
  schema: SettingDef[];
  /** Stored overlay — may be partial; defaults fill the rest. */
  values: SettingValues;
  globalSettings?: SettingValues;
  onChange: (id: string, value: SettingValue) => void;
}) {
  const defs = schema;
  // Live-resolved values: stored overlay over schema defaults. Recomputed on
  // every change, which is what makes visible_if reactive before saving.
  const resolved = useMemo(() => resolveSettings(defs, values, globalSettings), [defs, values, globalSettings]);

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-4 border-b border-stone/15 pb-3">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-stone">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">
        {defs.map((def) => {
          if (def.type === "header") {
            return (
              <div key={`header_${def.id}`} className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone">{t(def.label)}</p>
                <div className="mt-2 h-px bg-stone/20" />
              </div>
            );
          }
          if (def.type === "paragraph") {
            return (
              <p key={`para_${def.id}`} className="rounded-lg bg-bone px-3 py-2 text-xs leading-relaxed text-stone">
                {t(def.label)}
              </p>
            );
          }
          if (!evaluateVisibleIf(def.visible_if, resolved, globalSettings)) return null;

          return (
            <div key={def.id}>
              <label htmlFor={`sf_${def.id}`} className="mb-1.5 block text-[13px] font-medium text-ink">
                {t(def.label)}
              </label>
              <SettingControlField def={def} value={resolved[def.id]} onChange={(v) => onChange(def.id, v)} ctx={{ globalSettings }} />
              {def.info && <p className="mt-1.5 text-xs leading-relaxed text-stone">{def.info}</p>}
            </div>
          );
        })}
        {defs.filter((d) => d.type !== "header" && d.type !== "paragraph").length === 0 && (
          <p className="rounded-lg bg-bone px-3 py-3 text-sm text-stone">This section has no editable settings.</p>
        )}
      </div>
    </div>
  );
}

function SettingControlField({ def, value, onChange, ctx }: ControlProps) {
  switch (def.type) {
    case "textarea":
      return <TextAreaInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "number":
      return <NumberInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "range":
      return <RangeInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "select":
      return <SelectInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "checkbox":
      return <CheckboxInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "color":
      return <ColorInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "image_picker":
    case "video":
      return <ImagePickerInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "link":
      return <LinkInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "product_picker":
      return <ProductPickerInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "breakpoint_range":
      return <BreakpointRangeInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "repeater":
      return <RepeaterInput def={def} value={value} onChange={onChange} ctx={ctx} />;
    case "text":
    default:
      return <TextInput def={def} value={value} onChange={onChange} ctx={ctx} />;
  }
}

