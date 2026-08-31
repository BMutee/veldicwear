"use client";

// ─── Auto-generated section settings form ────────────────────────────────────
// The Shopify theme editor renders form controls from each section's
// {% schema %} "settings" declaration — the merchant never edits raw JSON.
// This component does the same for Veldic Wear: it renders controls from a
// SectionFieldDef[] (lib/section-registry.ts) and reports changes upward; the
// theme editor debounces them into an autosave PUT.

import type { SectionFieldDef } from "@/lib/section-registry";

// ─── Polaris-styled primitives (local to the theme editor) ───────────────────
// The Shopify theme editor uses its own neutral design system, not the brand
// palette, so the settings panel ships its own input/label/color primitives
// instead of reusing the brand-styled ones from AdminSectionShared.
const INPUT_CLS =
  "w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2 text-sm text-[#303030] shadow-[0_1px_0_0_rgba(0,0,0,0.05)] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#005bd3] focus:ring-2 focus:ring-[#005bd3]/25";
const LABEL_CLS = "block space-y-1.5 text-sm font-medium text-[#303030]";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const normalizedForPicker = /^#[0-9a-fA-F]{3}$/.test(value)
    ? "#" + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]
    : value;
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(normalizedForPicker) ? normalizedForPicker : "#000000";

  return (
    <div className={LABEL_CLS}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-[#c9cccf] transition focus-within:ring-2 focus-within:ring-[#005bd3]/40">
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                onChange(e.target.value.toUpperCase());
              }
            }}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className="block h-full w-full"
            style={{ backgroundColor: pickerValue }}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
          placeholder="#FFFFFF"
          spellCheck={false}
          className={INPUT_CLS + " font-mono"}
        />
      </div>
    </div>
  );
}

export type SectionSettings = Record<string, unknown>;

type ChangeHandler = (next: SectionSettings) => void;

export default function SectionSettingsForm({
  fields,
  content,
  onChange,
}: {
  fields: SectionFieldDef[];
  content: SectionSettings;
  onChange: ChangeHandler;
}) {
  if (fields.length === 0) {
    return <p className="text-sm text-stone">This section has no page-level settings.</p>;
  }
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldControl key={field.key} field={field} content={content} onChange={onChange} />
      ))}
    </div>
  );
}

// ─── Single field ────────────────────────────────────────────────────────────

function FieldControl({
  field,
  content,
  onChange,
}: {
  field: SectionFieldDef;
  content: SectionSettings;
  onChange: ChangeHandler;
}) {
  const value = content[field.key];

  switch (field.type) {
    case "text":
    case "link":
      return (
        <label className={LABEL_CLS}>
          <span>{field.label}</span>
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange({ ...content, [field.key]: e.target.value })}
            className={INPUT_CLS + (field.type === "link" ? " font-mono" : "")}
          />
          {field.help && <Help text={field.help} />}
        </label>
      );

    case "textarea":
      return (
        <label className={LABEL_CLS}>
          <span>{field.label}</span>
          <textarea
            rows={3}
            value={typeof value === "string" ? value : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange({ ...content, [field.key]: e.target.value })}
            className={INPUT_CLS + " resize-y"}
          />
          {field.help && <Help text={field.help} />}
        </label>
      );

    case "color":
      return (
        <ColorField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          onChange={(next) => onChange({ ...content, [field.key]: next })}
        />
      );

    case "number":
      return (
        <label className={LABEL_CLS}>
          <span>{field.label}</span>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            inputMode="numeric"
            value={typeof value === "number" ? value : 0}
            onChange={(e) => {
              const next = Number(e.target.value);
              const clamped = Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, next));
              onChange({ ...content, [field.key]: clamped });
            }}
            className={INPUT_CLS + " font-mono"}
          />
          {field.help && <Help text={field.help} />}
        </label>
      );

    case "toggle":
      return (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-stone">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange({ ...content, [field.key]: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-moss"
          />
          {field.label}
          {field.help && <Help text={field.help} />}
        </label>
      );

    case "select":
      return (
        <label className={LABEL_CLS}>
          <span>{field.label}</span>
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange({ ...content, [field.key]: e.target.value })}
            className={INPUT_CLS + " cursor-pointer"}
          >
            {!value && <option value="">—</option>}
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.help && <Help text={field.help} />}
        </label>
      );

    case "repeater":
      return (
        <RepeaterField field={field} content={content} onChange={onChange} />
      );

    default:
      return null;
  }
}

function Help({ text }: { text: string }) {
  return <span className="block text-xs font-normal text-stone">{text}</span>;
}

// ─── Repeater (Shopify-style list setting) ───────────────────────────────────
// Ordered list of items, each rendered with the field's itemFields. Mirrors
// Shopify's repeater/list blocks: add, remove, and reorder entries; each entry
// gets its own mini-form.

function blankItem(field: SectionFieldDef): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const itemField of field.itemFields ?? []) {
    if (itemField.type === "toggle") item[itemField.key] = false;
    else if (itemField.type === "number") item[itemField.key] = 0;
    else if (itemField.type === "select") item[itemField.key] = itemField.options?.[0]?.value ?? "";
    else item[itemField.key] = "";
  }
  return item;
}

function RepeaterField({
  field,
  content,
  onChange,
}: {
  field: SectionFieldDef;
  content: SectionSettings;
  onChange: ChangeHandler;
}) {
  const items: Record<string, unknown>[] = Array.isArray(content[field.key])
    ? (content[field.key] as Record<string, unknown>[])
    : [];

  const write = (next: Record<string, unknown>[]) => onChange({ ...content, [field.key]: next });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    write(next);
  };

  return (
    <div className={LABEL_CLS}>
      <span>{field.label}</span>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-stone">Nothing here yet.</p>}
        {items.map((item, index) => {
          const previewField = (field.itemFields ?? []).find(
            (f) => typeof item[f.key] === "string" && (item[f.key] as string).trim() !== ""
          );
          return (
            <div key={index} className="rounded-xl border border-stone/20 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-stone">
                  {field.itemLabel ?? "item"} {index + 1}
                  {previewField && (
                    <span className="ml-2 font-normal normal-case tracking-normal text-ink">
                      {String(item[previewField.key])}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="cursor-pointer rounded p-1 text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down" className="cursor-pointer rounded p-1 text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => write(items.filter((_, i) => i !== index))} aria-label="Remove" className="cursor-pointer rounded p-1 text-stone transition hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              </div>
              <div className="space-y-4">
                {(field.itemFields ?? []).map((itemField) => (
                  <FieldControl
                    key={itemField.key}
                    field={itemField}
                    content={item}
                    onChange={(nextItem) => write(items.map((entry, i) => (i === index ? nextItem : entry)))}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => write([...items, blankItem(field)])}
        className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2.5 text-sm font-medium text-stone transition hover:border-moss hover:text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
      >
        {field.addLabel ?? "Add item"}
      </button>
    </div>
  );
}

