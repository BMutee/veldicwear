"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FooterContent, FooterStyles } from "@/lib/footer-section";
import {
  INPUT_CLS,
  LABEL_CLS,
  TAB_BTN_CLS,
  ColorField,
  PaddingFields,
  AnimationField,
} from "./AdminSectionShared";
import {
  ThemeColorField,
  ThemePaddingFields,
  ThemeAnimationField,
  ttabCls,
  T_INPUT_CLS,
  T_LABEL_CLS,
  T_LEGEND_CLS,
} from "./theme-editor-ui";
import { registerPanelFlusher } from "./block-flusher";
import Reveal from "./motion/Reveal";

type Props = {
  initialContent: FooterContent;
  initialSavedAt: string | null;
  defaults: FooterContent;
  /** Store name for the live preview — brand identity now lives in StoreSettings. */
  storeName: string;
  /** Embedded in the theme editor — renders compact panel UI instead of the
   *  standalone admin page chrome (no h1 header, editor-style tabs, theme
   *  field styling). Registers a flusher so the top-bar Save persists edits. */
  embedded?: boolean;
  onSaved?: () => void;
};

type LinkKey = "shopLinks" | "supportLinks" | "companyLinks";

export default function AdminFooterEditor({
  initialContent,
  initialSavedAt,
  defaults,
  storeName,
  embedded = false,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<"content" | "style">("content");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  // Bumping this remounts the preview so entrance animations replay.
  const [animReplay, setAnimReplay] = useState(0);
  const [form, setForm] = useState<FooterContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  // Latest content so a registered panel flusher always saves fresh values.
  const formRef = useRef(form);
  // Keep the latest content without writing the ref during render.
  useEffect(() => {
    formRef.current = form;
  });
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => registerPanelFlusher("footer", () => flushRef.current()), []);

  // Single path used by the panel's Save button AND the theme editor's
  // top-bar Save (via the registered panel flusher). Throws on failure so
  // flushAllPanels can report it.
  const saveNow = async (): Promise<boolean> => {
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRef.current),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(Array.isArray(data?.details) ? data.details : [data?.error || "Failed to save."]);
        setSaving(false);
        return false;
      }
      if (data?.content) setForm(data.content as FooterContent);
      setSuccessMsg("Footer saved.");
      setDirty(false);
      setSaving(false);
      onSaved?.();
      router.refresh();
      return true;
    } catch {
      setErrors(["Network error. Please try again."]);
      setSaving(false);
      return false;
    }
  };

  const updateBrand = (patch: Partial<Pick<FooterContent, "brandDescription">>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };
  const updateStyle = (patch: Partial<FooterStyles>) => {
    setForm((prev) => ({ ...prev, styles: { ...prev.styles, ...patch } }));
    setDirty(true);
  };

  const updateLink = (key: LinkKey, i: number, field: "label" | "href", value: string) => {
    setForm((prev) => {
      const arr = [...prev[key]];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, [key]: arr };
    });
    setDirty(true);
  };
  const addLink = (key: LinkKey) => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], { label: "", href: "/" }] }));
    setDirty(true);
  };
  const removeLink = (key: LinkKey, i: number) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }));
    setDirty(true);
  };

  const updatePayments = (value: string) => {
    setForm((prev) => ({
      ...prev,
      paymentMethods: value.split(",").map((s) => s.trim()).filter(Boolean),
    }));
    setDirty(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveNow();
      router.refresh();
    } catch {
      /* saveNow already surfaced the error */
    }
  };

  // Keep the latest flush callback without writing the ref during render.
  useEffect(() => {
    flushRef.current = saveNow;
  });

  const handleReset = () => {
    setForm(defaults);
    setDirty(true);
    setErrors([]);
    setSuccessMsg(null);
  };

  if (embedded) {
    // Theme-editor panel: no page header (the panel provides one), editor-style
    // tabs, Polaris field styling, single-column form + compact preview.
    const resetBtn =
      "inline-flex h-7 cursor-pointer items-center rounded-md border border-[#c9cccf] bg-white px-2.5 text-xs font-medium text-[#303030] transition hover:bg-[#f7f7f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50";
    const saveBtn =
      "inline-flex h-7 cursor-pointer items-center rounded-md bg-[#303030] px-3 text-xs font-medium text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50 disabled:cursor-not-allowed disabled:opacity-45";
    return (
      <div className="space-y-4">
        {successMsg && (
          <div role="status" className="rounded-md border border-[#c6e3d1] bg-[#eef7f0] px-3 py-2 text-xs text-[#1a7f37]">
            {successMsg}
          </div>
        )}
        {errors.length > 0 && (
          <div role="alert" className="rounded-md border border-[#f4c7c3] bg-[#fdeeee] px-3 py-2 space-y-1">
            {errors.map((m, i) => (
              <p key={i} className="text-xs text-[#b3261e]">
                {m}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#e3e3e3] pb-px" role="tablist" aria-label="Footer editor">
          <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")} className={ttabCls(tab === "content")}>
            Content
          </button>
          <button type="button" role="tab" aria-selected={tab === "style"} onClick={() => setTab("style")} className={ttabCls(tab === "style")}>
            Style
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Footer editor form">
          {tab === "content" ? (
            <ContentTab embedded form={form} updateBrand={updateBrand} updateLink={updateLink} addLink={addLink} removeLink={removeLink} updatePayments={updatePayments} />
          ) : (
            <StyleTab embedded styles={form.styles} updateStyle={updateStyle} />
          )}
          <div className="flex items-center justify-between gap-3 border-t border-[#e3e3e3] pt-3">
            <button type="button" onClick={handleReset} className={resetBtn}>
              Reset to defaults
            </button>
            <span className="text-xs text-[#8a8a8a]">{dirty ? "Unsaved changes" : "All changes saved"}</span>
            <button type="submit" disabled={saving} className={saveBtn}>
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </form>

        <aside className="overflow-hidden rounded-md border border-[#e3e3e3]" aria-label="Footer live preview">
          <div className="flex items-center justify-between gap-3 border-b border-[#e3e3e3] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">Live preview</span>
            <div className="flex gap-0.5 rounded-md bg-[#f1f1f1] p-0.5" role="group" aria-label="Preview breakpoint">
              {(["mobile", "desktop"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewMode(mode)}
                  aria-pressed={previewMode === mode}
                  className={"cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition " + (previewMode === mode ? "bg-white text-[#303030] shadow-sm" : "text-[#616161] hover:text-[#303030]")}
                >
                  {mode === "mobile" ? "Mobile" : "Desktop"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div key={"footer-preview-" + animReplay}>
              <FooterPreview form={form} storeName={storeName} mode={previewMode} />
            </div>
            {form.styles.animation.type !== "NONE" && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAnimReplay((k) => k + 1)}
                  className="cursor-pointer rounded px-2 py-1 text-[11px] text-[#616161] transition hover:text-[#303030] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50"
                >
                  Replay animation
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    );
  }

  const lastSaved = initialSavedAt
    ? new Date(initialSavedAt).toLocaleString()
    : "Never saved";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
            Footer
          </h1>
          <p className="mt-1 font-body text-sm text-stone">
            Edit footer links, brand description and visual style. Brand identity,
            contact details, social links, copyright and the footer nav links are
            managed in the Settings tab (StoreSettings row). Edits in the preview
            are live and not yet saved.
          </p>
        </div>
        <div className="text-right text-xs text-stone font-mono">
          <div>Last saved: {lastSaved}</div>
        </div>
      </div>

      {successMsg && (
        <div role="status" className="rounded-lg border border-moss/30 bg-moss/5 px-4 py-3 text-sm text-moss font-body">
          {successMsg}
        </div>
      )}
      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-clay/30 bg-clay/5 px-4 py-3 space-y-1 font-body">
          {errors.map((m, i) => (
            <p key={i} className="text-sm text-clay">{m}</p>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-stone/20 pb-px" role="tablist" aria-label="Footer editor">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "content"}
          onClick={() => setTab("content")}
          className={TAB_BTN_CLS(tab === "content")}
        >
          Content
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "style"}
          onClick={() => setTab("style")}
          className={TAB_BTN_CLS(tab === "style")}
        >
          Style
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-stone/20 bg-white p-6 shadow-sm"
          aria-label="Footer editor form"
        >
          {tab === "content" ? (
            <ContentTab
              form={form}
              updateBrand={updateBrand}
              updateLink={updateLink}
              addLink={addLink}
              removeLink={removeLink}
              updatePayments={updatePayments}
            />
          ) : (
            <StyleTab styles={form.styles} updateStyle={updateStyle} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone/20">
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2.5 text-sm font-medium text-stone hover:text-ink hover:bg-stone/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 transition font-body"
            >
              Reset to defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:opacity-50 disabled:cursor-not-allowed font-body"
            >
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </form>

        <aside
          className="rounded-xl border border-stone/20 overflow-hidden shadow-sm"
          aria-label="Live preview"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone/20 bg-bone px-4 py-2">
            <span className="text-xs uppercase tracking-wider text-stone font-display">Live preview</span>
            <div className="flex gap-1 rounded-lg bg-stone/10 p-0.5" role="group" aria-label="Preview breakpoint">
              {(["mobile", "desktop"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setPreviewMode(mode)} aria-pressed={previewMode === mode} className={"cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition font-body " + (previewMode === mode ? "bg-white text-ink shadow-sm" : "text-stone hover:text-ink")}>
                  {mode === "mobile" ? "Mobile" : "Desktop"}
                </button>
              ))}
            </div>
          </div>
          <div key={"footer-preview-" + animReplay}>
            <FooterPreview form={form} storeName={storeName} mode={previewMode} />
          </div>
          {form.styles.animation.type !== "NONE" && (
            <div className="flex justify-end border-t border-stone/20 bg-bone px-4 py-2">
              <button
                type="button"
                onClick={() => setAnimReplay((k) => k + 1)}
                className="cursor-pointer rounded px-2 py-1 text-xs text-stone transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
              >
                Replay animation
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}


function LinkGroup({
  title,
  links,
  onAdd,
  onRemove,
  onChange,
  embedded = false,
}: {
  title: string;
  links: { label: string; href: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: "label" | "href", value: string) => void;
  embedded?: boolean;
}) {
  const legend = embedded ? T_LEGEND_CLS : "text-sm font-semibold text-ink font-display uppercase tracking-wide";
  const label = embedded ? T_LABEL_CLS : LABEL_CLS;
  const input = embedded ? T_INPUT_CLS : INPUT_CLS;
  const removeBtn = embedded
    ? "inline-flex h-7 cursor-pointer items-center rounded-md border border-[#f4c7c3] px-2.5 text-xs font-medium text-[#b3261e] transition hover:bg-[#fdeeee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50"
    : "cursor-pointer rounded-lg border border-clay/20 px-3 py-2 text-xs font-medium text-clay hover:bg-clay/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 transition font-body";
  const addBtn = embedded
    ? "inline-flex h-7 cursor-pointer items-center rounded-md border border-[#c9cccf] bg-white px-2.5 text-xs font-medium text-[#303030] transition hover:bg-[#f7f7f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50"
    : "cursor-pointer rounded-lg border border-stone/20 px-3 py-1.5 text-xs font-medium text-stone hover:text-ink hover:bg-stone/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 transition font-body";
  return (
    <fieldset className="space-y-3">
      <legend className={legend}>
        {title}
      </legend>
      {links.map((l, i) => (
        <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className={label}>
            Label
            <input value={l.label} onChange={(e) => onChange(i, "label", e.target.value)} className={input} />
          </label>
          <label className={label}>
            URL
            <input value={l.href} onChange={(e) => onChange(i, "href", e.target.value)} className={input + " font-mono"} />
          </label>
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${title} link`}
            className={removeBtn}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className={addBtn}
      >
        + Add link
      </button>
    </fieldset>
  );
}

function ContentTab({
  embedded = false,
  form,
  updateBrand,
  updateLink,
  addLink,
  removeLink,
  updatePayments,
}: {
  embedded?: boolean;
  form: FooterContent;
  updateBrand: (patch: Partial<Pick<FooterContent, "brandDescription">>) => void;
  updateLink: (key: LinkKey, i: number, field: "label" | "href", value: string) => void;
  addLink: (key: LinkKey) => void;
  removeLink: (key: LinkKey, i: number) => void;
  updatePayments: (value: string) => void;
}) {
  const legend = embedded ? T_LEGEND_CLS : "text-sm font-semibold text-ink font-display uppercase tracking-wide";
  const label = embedded ? T_LABEL_CLS : LABEL_CLS;
  const input = embedded ? T_INPUT_CLS : INPUT_CLS;
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className={legend}>
          Brand description
        </legend>
        <label className={label}>
          Description
          <textarea
            value={form.brandDescription}
            onChange={(e) => updateBrand({ brandDescription: e.target.value })}
            rows={3}
            className={input}
          />
        </label>
      </fieldset>

      <hr className={embedded ? "border-[#e3e3e3]" : "border-stone/20"} />

      <LinkGroup
        embedded={embedded}
        title="Shop links"
        links={form.shopLinks}
        onAdd={() => addLink("shopLinks")}
        onRemove={(i) => removeLink("shopLinks", i)}
        onChange={(i, f, v) => updateLink("shopLinks", i, f, v)}
      />
      <LinkGroup
        embedded={embedded}
        title="Support links"
        links={form.supportLinks}
        onAdd={() => addLink("supportLinks")}
        onRemove={(i) => removeLink("supportLinks", i)}
        onChange={(i, f, v) => updateLink("supportLinks", i, f, v)}
      />
      <LinkGroup
        embedded={embedded}
        title="Company links"
        links={form.companyLinks}
        onAdd={() => addLink("companyLinks")}
        onRemove={(i) => removeLink("companyLinks", i)}
        onChange={(i, f, v) => updateLink("companyLinks", i, f, v)}
      />

      <fieldset className="space-y-3">
        <legend className={legend}>
          Payment methods
        </legend>
        <label className={label}>
          Comma-separated
          <input
            value={form.paymentMethods.join(", ")}
            onChange={(e) => updatePayments(e.target.value)}
            placeholder="Visa, MC, Amex, PayPal, Apple Pay"
            className={input}
          />
        </label>
      </fieldset>
    </div>
  );
}


function StyleTab({
  embedded = false,
  styles,
  updateStyle,
}: {
  embedded?: boolean;
  styles: FooterStyles;
  updateStyle: (patch: Partial<FooterStyles>) => void;
}) {
  const legend = embedded ? T_LEGEND_CLS : "text-sm font-semibold text-ink font-display uppercase tracking-wide";
  const Color = embedded ? ThemeColorField : ColorField;
  const Animation = embedded ? ThemeAnimationField : AnimationField;
  const hrCls = embedded ? "border-[#e3e3e3]" : "border-stone/20";
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className={legend}>
          Spacing
        </legend>
        {embedded ? (
          <ThemePaddingFields
            padding={styles}
            onChange={(next) => updateStyle(next)}
            minTop={40}
            minBottom={40}
          />
        ) : (
          <PaddingFields
            padding={styles}
            onChange={(key, breakpoint, value) =>
              updateStyle({ [key]: { ...styles[key], [breakpoint]: value } })
            }
            minTop={40}
            minBottom={40}
          />
        )}
      </fieldset>

      <hr className={hrCls} />

      <fieldset className="space-y-4">
        <legend className={legend}>
          Color
        </legend>
        <div className={embedded ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
          <Color label="Background" value={styles.backgroundColor} onChange={(v) => updateStyle({ backgroundColor: v })} />
          <Color label="Text" value={styles.textColor} onChange={(v) => updateStyle({ textColor: v })} />
          <Color label="Link" value={styles.linkColor} onChange={(v) => updateStyle({ linkColor: v })} />
          <Color label="Link hover" value={styles.linkHoverColor} onChange={(v) => updateStyle({ linkHoverColor: v })} />
        </div>
      </fieldset>

      <hr className={hrCls} />

      <fieldset className="space-y-4">
        <legend className={legend}>
          Animation
        </legend>
        <Animation
          value={styles.animation}
          onChange={(animation) => updateStyle({ animation })}
        />
      </fieldset>
    </div>
  );
}

function FooterPreview({
  form,
  storeName,
  mode,
}: {
  form: FooterContent;
  storeName: string;
  mode: "mobile" | "desktop";
}) {
  const s = form.styles;
  const breakpoint = mode === "mobile" ? "mobile" : "desktop";
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: s.backgroundColor,
        color: s.textColor,
        paddingTop: s.paddingTop[breakpoint],
        paddingBottom: s.paddingBottom[breakpoint],
        paddingLeft: s.paddingX[breakpoint],
        paddingRight: s.paddingX[breakpoint],
      }}
    >
      {/* Preview plays the chosen entrance on mount; the Replay button below
          remounts it. Reduced-motion disables it via CSS, same as production. */}
      <Reveal type={s.animation.type} scrollTrigger={false}>
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">
            {storeName}
          </div>
          <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed opacity-60">
            {form.brandDescription}
          </p>
        </div>

        {(["shopLinks", "supportLinks", "companyLinks"] as const).map((key) => {
          const label =
            key === "shopLinks" ? "Shop" : key === "supportLinks" ? "Support" : "Company";
          const links = form[key];
          if (!links || links.length === 0) return null;
          return (
            <div key={key}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-60">
                {label}
              </div>
              <ul className="mt-3 space-y-2">
                {links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="font-sans text-sm opacity-80 cursor-pointer">
                      {link.label || "—"}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-current/10 pt-6">
        <p className="font-sans text-xs opacity-40">
          &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
        </p>

        {form.paymentMethods.length > 0 && (
          <div className="flex items-center gap-3 opacity-40">
            {form.paymentMethods.map((method, i) => (
              <span key={i} className="font-mono text-xs tracking-wide">{method}</span>
            ))}
          </div>
        )}
      </div>
      </Reveal>
    </div>
  );
}

