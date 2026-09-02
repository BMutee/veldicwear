"use client";

// ─── Schema controls (§7.1 — the widgets behind every setting type) ───────────
// One component per `SettingControl` type. All controls are dumb: they receive
// a def + current value and push changes up. Labels inside compound controls
// resolve through the `t:` localization layer. The Repeater renders its item
// fields by composing these same components — the schema interpreter stays
// flat and cycle-free.

import { useState } from "react";
import type { SettingDef, SettingValue, SettingValues } from "@/lib/theme/types";
import { resolveSettings } from "@/lib/theme/resolve";
import { t } from "@/lib/theme/locales";

export const INPUT_CLASS =
  "w-full cursor-text rounded-lg border border-stone/30 bg-white px-3 py-2 text-sm text-ink placeholder:text-stone/50 transition-colors duration-150 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/25";

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

// ─── Text ─────────────────────────────────────────────────────────────────────

export function TextInput({ def, value, onChange }: ControlProps) {
  return (
    <input
      id={`sf_${def.id}`}
      type="text"
      className={INPUT_CLASS}
      placeholder={def.placeholder}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextAreaInput({ def, value, onChange }: ControlProps) {
  return (
    <textarea
      id={`sf_${def.id}`}
      rows={3}
      className={`${INPUT_CLASS} resize-y leading-relaxed`}
      placeholder={def.placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

export function NumberInput({ def, value, onChange }: ControlProps) {
  return (
    <input
      id={`sf_${def.id}`}
      type="number"
      className={INPUT_CLASS}
      min={def.min}
      max={def.max}
      step={def.step}
      value={typeof value === "number" ? value : ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? n : "");
      }}
    />
  );
}

export function RangeInput({ def, value, onChange }: ControlProps) {
  const n = typeof value === "number" ? value : Number(def.min ?? 0);
  return (
    <div className="flex items-center gap-3">
      <input
        id={`sf_${def.id}`}
        type="range"
        aria-label={t(def.label)}
        className="h-1.5 flex-1 cursor-pointer accent-moss"
        min={def.min ?? 0}
        max={def.max ?? 100}
        step={def.step ?? 1}
        value={n}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="w-12 shrink-0 rounded-md bg-bone px-2 py-1 text-center font-mono text-xs text-ink" aria-live="polite">
        {n}
        {def.unit ?? ""}
      </output>
    </div>
  );
}

/** Mobile/desktop paired range (responsive paddings, font sizes, …). */
export function BreakpointRangeInput({ def, value, onChange }: ControlProps) {
  const v = (value as Partial<{ mobile: number; desktop: number }>) ?? {};
  const clamp = (raw: unknown, fb: number) => {
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : fb;
  };
  const mobile = clamp(v.mobile, def.min ?? 0);
  const desktop = clamp(v.desktop, def.min ?? 0);
  const field = (label: string, key: "mobile" | "desktop") => (
    <div className="flex-1">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          aria-label={`${t(def.label)} — ${label}`}
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-moss"
          min={def.min ?? 0}
          max={def.max ?? 400}
          step={def.step ?? 1}
          value={key === "mobile" ? mobile : desktop}
          onChange={(e) => onChange({ mobile, desktop, [key]: Number(e.target.value) } as { mobile: number; desktop: number })}
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs text-ink" aria-live="polite">
          {key === "mobile" ? mobile : desktop}
          {def.unit ?? ""}
        </span>
      </div>
    </div>
  );
  return (
    <div className="flex gap-4 rounded-lg bg-bone p-3">
      {field("Mobile", "mobile")}
      {field("Desktop", "desktop")}
    </div>
  );
}

// ─── Choice ───────────────────────────────────────────────────────────────────

export function SelectInput({ def, value, onChange }: ControlProps) {
  return (
    <select
      id={`sf_${def.id}`}
      className={`${INPUT_CLASS} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238C8677%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M19%209l-7%207-7-7%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_0.65rem_center] bg-no-repeat pr-9`}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {(def.options ?? []).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function CheckboxInput({ def, value, onChange }: ControlProps) {
  const checked = value === true;
  return (
    <label htmlFor={`sf_${def.id}`} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-bone px-3 py-2.5">
      <span className="text-[13px] font-medium text-ink">{t(def.label)}</span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input
          id={`sf_${def.id}`}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-5 w-9 rounded-full bg-stone/40 transition-colors duration-200 peer-checked:bg-moss peer-focus-visible:ring-2 peer-focus-visible:ring-moss/40" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

// ─── Color ────────────────────────────────────────────────────────────────────

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function ColorInput({ def, value, onChange }: ControlProps) {
  const raw = typeof value === "string" ? value : "";
  const swatch = HEX_RE.test(raw) ? raw : "#ffffff";
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-stone/30"
        style={{ background: raw || undefined }}
        title={raw || "No color"}
      >
        <input
          type="color"
          aria-label={t(def.label)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <input
        id={`sf_${def.id}`}
        type="text"
        className={INPUT_CLASS}
        placeholder="Leave empty for none"
        value={raw}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Media & links ────────────────────────────────────────────────────────────

export function ImagePickerInput({ def, value, onChange }: ControlProps) {
  const raw = typeof value === "string" ? value : "";
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone/30 bg-bone">
        {raw ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an arbitrary external path
          <img src={raw} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-stone" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
          </svg>
        )}
      </div>
      <input
        id={`sf_${def.id}`}
        type="text"
        className={INPUT_CLASS}
        placeholder={def.placeholder ?? "/image.jpg or https://…"}
        value={raw}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function LinkInput({ def, value, onChange }: ControlProps) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
      <input
        id={`sf_${def.id}`}
        type="text"
        className={`${INPUT_CLASS} pl-8`}
        placeholder={def.placeholder ?? "/page or https://…"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ProductPickerInput({ def, value, onChange }: ControlProps) {
  return (
    <div>
      <input
        id={`sf_${def.id}`}
        type="text"
        className={INPUT_CLASS}
        placeholder={def.placeholder ?? "Product IDs, comma-separated"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1.5 text-xs leading-relaxed text-stone">Product IDs from Catalog → Products, separated by commas.</p>
    </div>
  );
}

// ─── Repeater (array-of-objects; lookbook looks, stats, tiles, …) ─────────────

type RepeaterItem = { [key: string]: SettingValue };

export function RepeaterInput({ def, value, onChange, ctx }: ControlProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const rawItems = Array.isArray(value) ? value : [];
  const items: RepeaterItem[] = rawItems.map((item) =>
    item && typeof item === "object" && !Array.isArray(item) ? (item as RepeaterItem) : {}
  );
  const fields = def.item_fields ?? [];
  const max = def.max_items ?? Infinity;

  const write = (next: RepeaterItem[]) => onChange(next as SettingValue);

  const itemLabel = (item: RepeaterItem, index: number) => {
    const labelField = def.item_label ? item[def.item_label] : undefined;
    const text = typeof labelField === "string" ? labelField.trim() : "";
    return text || `Item ${index + 1}`;
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    write(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        // Display values resolve defaults live; writes store the merged object.
        const resolved = resolveSettings(fields, item as SettingValues, ctx.globalSettings) as RepeaterItem;
        const open = openIndex === index;
        return (
          <div key={index} className="overflow-hidden rounded-lg border border-stone/25 bg-white">
            <RepeaterItemRow
              def={def}
              item={item}
              index={index}
              count={items.length}
              open={open}
              label={itemLabel(item, index)}
              onToggle={() => setOpenIndex(open ? null : index)}
              onMove={(to) => move(index, to)}
              onRemove={() => write(items.filter((_, i) => i !== index))}
            />
            {open && (
              <div className="space-y-3 px-3 py-3">
                {fields
                  .filter((f) => f.type !== "header" && f.type !== "paragraph")
                  .map((f) => (
                    <div key={f.id}>
                      <label htmlFor={`sf_${def.id}_${index}_${f.id}`} className="mb-1.5 block text-[13px] font-medium text-ink">
                        {t(f.label)}
                      </label>
                      <MiniField
                        def={f}
                        value={resolved[f.id]}
                        onChange={(v) => {
                          const next = [...items];
                          next[index] = { ...resolved, [f.id]: v };
                          write(next);
                        }}
                        ctx={ctx}
                      />
                      {f.info && <p className="mt-1.5 text-xs leading-relaxed text-stone">{f.info}</p>}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
      {items.length < max && (
        <button
          type="button"
          onClick={() => {
            write([...items, {}]);
            setOpenIndex(items.length);
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone/40 bg-white px-3 py-2.5 text-[13px] font-medium text-moss transition-colors duration-150 hover:border-moss hover:bg-moss/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {def.add_label ?? "Add item"}
        </button>
      )}
    </div>
  );
}

/** One collapsible repeater row: expand toggle, move up/down, remove. */
function RepeaterItemRow({
  label,
  open,
  index,
  count,
  onToggle,
  onMove,
  onRemove,
}: {
  def: SettingDef;
  item: RepeaterItem;
  label: string;
  open: boolean;
  index: number;
  count: number;
  onToggle: () => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-bone px-2 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] font-medium text-ink transition-colors hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-stone transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-stone transition-colors hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-stone transition-colors hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-stone transition-colors hover:bg-white hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/** Field renderer used inside repeater items (type → control, minus repeater). */
function MiniField({ def, value, onChange, ctx }: ControlProps) {
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
    default:
      return <TextInput def={def} value={value} onChange={onChange} ctx={ctx} />;
  }
}
