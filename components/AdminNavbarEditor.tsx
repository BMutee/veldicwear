"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NavbarContent, NavbarStyles } from "@/lib/navbar-section";
import {
  BreakpointField,
  ColorField,
  INPUT_CLS,
  LABEL_CLS,
  TAB_BTN_CLS,
  AnimationField,
} from "./AdminSectionShared";
import {
  ThemeBreakpointField,
  ThemeColorField,
  ThemeAnimationField,
  ttabCls,
  T_INPUT_CLS,
  T_LABEL_CLS,
  T_LEGEND_CLS,
} from "./theme-editor-ui";
import { registerPanelFlusher } from "./block-flusher";
import Reveal from "./motion/Reveal";

type Props = {
  initialContent: NavbarContent;
  initialSavedAt: string | null;
  defaults: NavbarContent;
  storeName: string;
  /** Embedded in the theme editor — renders compact panel UI instead of the
   *  standalone admin page chrome (no h1 header, editor-style tabs, theme
   *  field styling). Registers a flusher so the top-bar Save persists edits. */
  embedded?: boolean;
  onSaved?: () => void;
};

export default function AdminNavbarEditor({ initialContent, initialSavedAt, defaults, storeName, embedded = false, onSaved }: Props) {
  const [tab, setTab] = useState<"content" | "style">("content");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [form, setForm] = useState<NavbarContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Latest content so a registered panel flusher always saves fresh values.
  const formRef = useRef(form);
  formRef.current = form;
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => registerPanelFlusher("navbar", () => flushRef.current()), []);

  const updateLinks = (navLinks: NavbarContent["navLinks"]) => {
    setForm((prev) => ({ ...prev, navLinks }));
    setDirty(true);
  };

  const updateStyle = (patch: Partial<NavbarStyles>) => {
    setForm((prev) => ({ ...prev, styles: { ...prev.styles, ...patch } }));
    setDirty(true);
  };

  const updateLink = (index: number, patch: Partial<NavbarContent["navLinks"][number]>) => {
    updateLinks(form.navLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.navLinks.length) return;
    const next = [...form.navLinks];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateLinks(next);
  };

  const addLink = () => updateLinks([...form.navLinks, { label: "New link", href: "/" }]);
  const removeLink = (index: number) => updateLinks(form.navLinks.filter((_, i) => i !== index));

  // Single path used by the panel's Save button AND the theme editor's
  // top-bar Save (via the registered panel flusher). Throws on failure so
  // flushAllPanels can report it.
  const saveNow = async (): Promise<boolean> => {
    setSaving(true);
    setErrors([]);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/navbar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRef.current),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(Array.isArray(data?.details) ? data.details : [data?.error || "Failed to save."]);
        throw new Error("save failed");
      }
      if (data?.content) setForm(data.content as NavbarContent);
      setDirty(false);
      setSuccess("Navbar saved.");
      onSaved?.();
      return true;
    } catch (error) {
      if (!(error instanceof Error && error.message === "save failed")) {
        setErrors(["Network error. Please try again."]);
      }
      throw error;
    } finally {
      setSaving(false);
    }
  };
  flushRef.current = saveNow;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveNow();
      router.refresh();
    } catch {
      /* saveNow already surfaced the error */
    }
  };

  if (embedded) {
    // Theme-editor panel: no page header (the panel provides one), editor-style
    // tabs, Polaris field styling, single-column form + preview.
    const resetBtn =
      "inline-flex h-7 cursor-pointer items-center rounded-md border border-[#c9cccf] bg-white px-2.5 text-xs font-medium text-[#303030] transition hover:bg-[#f7f7f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50";
    const saveBtn =
      "inline-flex h-7 cursor-pointer items-center rounded-md bg-[#303030] px-3 text-xs font-medium text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50 disabled:cursor-not-allowed disabled:opacity-45";
    return (
      <div className="space-y-4">
        {success && (
          <div role="status" className="rounded-md border border-[#c6e3d1] bg-[#eef7f0] px-3 py-2 text-xs text-[#1a7f37]">
            {success}
          </div>
        )}
        {errors.length > 0 && (
          <div role="alert" className="rounded-md border border-[#f4c7c3] bg-[#fdeeee] px-3 py-2 space-y-1">
            {errors.map((error) => (
              <p key={error} className="text-xs text-[#b3261e]">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-1 border-b border-[#e3e3e3] pb-px" role="tablist" aria-label="Navbar editor">
          <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")} className={ttabCls(tab === "content")}>
            Content
          </button>
          <button type="button" role="tab" aria-selected={tab === "style"} onClick={() => setTab("style")} className={ttabCls(tab === "style")}>
            Style
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Navbar editor form">
          {tab === "content" ? (
            <ContentTab embedded links={form.navLinks} updateLink={updateLink} moveLink={moveLink} removeLink={removeLink} addLink={addLink} />
          ) : (
            <StyleTab embedded styles={form.styles} updateStyle={updateStyle} />
          )}
          <div className="flex items-center justify-between gap-3 border-t border-[#e3e3e3] pt-3">
            <button
              type="button"
              onClick={() => {
                setForm(defaults);
                setDirty(true);
                setErrors([]);
                setSuccess(null);
              }}
              className={resetBtn}
            >
              Reset to defaults
            </button>
            <span className="text-xs text-[#8a8a8a]">{dirty ? "Unsaved changes" : "All changes saved"}</span>
            <button type="submit" disabled={saving} className={saveBtn}>
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </form>

        <aside className="overflow-hidden rounded-md border border-[#e3e3e3]" aria-label="Navbar live preview">
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
            <NavbarPreview form={form} mode={previewMode} storeName={storeName} />
          </div>
        </aside>
      </div>
    );
  }

  // Standalone admin page — full-width editor with page header.
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">Navbar</h1>
          <p className="mt-1 font-body text-sm text-stone">Edit navigation links and responsive header styling.</p>
        </div>
        <div className="text-right text-xs text-stone font-mono">
          Last saved: {initialSavedAt ? new Date(initialSavedAt).toISOString() : "Never saved"}
        </div>
      </div>

      {success && <div role="status" className="rounded-lg border border-moss/30 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      {errors.length > 0 && <div role="alert" className="rounded-lg border border-clay/30 bg-clay/5 px-4 py-3 space-y-1">{errors.map((error) => <p key={error} className="text-sm text-clay">{error}</p>)}</div>}

      <div className="flex gap-1 border-b border-stone/20 pb-px" role="tablist" aria-label="Navbar editor">
        <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")} className={TAB_BTN_CLS(tab === "content")}>Content</button>
        <button type="button" role="tab" aria-selected={tab === "style"} onClick={() => setTab("style")} className={TAB_BTN_CLS(tab === "style")}>Style</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-stone/20 bg-white p-6 shadow-sm" aria-label="Navbar editor form">
          {tab === "content" ? (
            <ContentTab links={form.navLinks} updateLink={updateLink} moveLink={moveLink} removeLink={removeLink} addLink={addLink} />
          ) : (
            <StyleTab styles={form.styles} updateStyle={updateStyle} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone/20 pt-4">
            <button type="button" onClick={() => { setForm(defaults); setDirty(true); setErrors([]); setSuccess(null); }} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2.5 text-sm font-medium text-stone transition hover:bg-stone/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">Reset to defaults</button>
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : dirty ? "Save changes" : "Saved"}</button>
          </div>
        </form>

        <aside className="overflow-hidden rounded-xl border border-stone/20 shadow-sm" aria-label="Navbar live preview">
          <div className="flex items-center justify-between gap-3 border-b border-stone/20 bg-bone px-4 py-2">
            <span className="text-xs uppercase tracking-wider text-stone font-display">Live preview</span>
            <div className="flex gap-1 rounded-lg bg-stone/10 p-0.5" role="group" aria-label="Preview breakpoint">
              {(["mobile", "desktop"] as const).map((mode) => <button key={mode} type="button" onClick={() => setPreviewMode(mode)} aria-pressed={previewMode === mode} className={"cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition " + (previewMode === mode ? "bg-white text-ink shadow-sm" : "text-stone hover:text-ink")}>{mode === "mobile" ? "Mobile" : "Desktop"}</button>)}
            </div>
          </div>
          <NavbarPreview form={form} mode={previewMode} storeName={storeName} />
        </aside>
      </div>
    </div>
  );
}

function ContentTab({ embedded = false, links, updateLink, moveLink, removeLink, addLink }: {
  embedded?: boolean;
  links: NavbarContent["navLinks"];
  updateLink: (index: number, patch: Partial<NavbarContent["navLinks"][number]>) => void;
  moveLink: (index: number, direction: -1 | 1) => void;
  removeLink: (index: number) => void;
  addLink: () => void;
}) {
  const label = embedded ? T_LABEL_CLS : LABEL_CLS;
  const input = embedded ? T_INPUT_CLS : INPUT_CLS;
  const legend = embedded ? T_LEGEND_CLS : "text-sm font-semibold uppercase tracking-wide text-ink font-display";
  return (
    <fieldset className="space-y-4">
      <legend className={legend}>Navigation links</legend>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${index}-${link.href}`} className="rounded-lg border border-stone/20 bg-bone/40 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className={label}>Label<input value={link.label} onChange={(event) => updateLink(index, { label: event.target.value })} className={input} /></label>
              <label className={label}>URL<input value={link.href} onChange={(event) => updateLink(index, { href: event.target.value })} className={input} /></label>
              <div className="flex items-end gap-1">
                <button type="button" onClick={() => moveLink(index, -1)} disabled={index === 0} aria-label={`Move ${link.label} up`} className="h-11 w-10 cursor-pointer rounded-lg border border-stone/20 text-lg text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30">&uarr;</button>
                <button type="button" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1} aria-label={`Move ${link.label} down`} className="h-11 w-10 cursor-pointer rounded-lg border border-stone/20 text-lg text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30">&darr;</button>
                <button type="button" onClick={() => removeLink(index)} aria-label={`Remove ${link.label}`} className="h-11 w-10 cursor-pointer rounded-lg border border-clay/30 text-clay transition hover:bg-clay/5">&times;</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLink} disabled={links.length >= 20} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss hover:text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 disabled:cursor-not-allowed disabled:opacity-40">Add link</button>
    </fieldset>
  );
}

function StyleTab({ embedded = false, styles, updateStyle }: { embedded?: boolean; styles: NavbarStyles; updateStyle: (patch: Partial<NavbarStyles>) => void }) {
  const legend = embedded ? T_LEGEND_CLS : "text-sm font-semibold uppercase tracking-wide text-ink font-display";
  const Breakpoint = embedded ? ThemeBreakpointField : BreakpointField;
  const Color = embedded ? ThemeColorField : ColorField;
  const Animation = embedded ? ThemeAnimationField : AnimationField;
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className={legend}>Layout</legend>
        <Breakpoint label="Height (px)" mobile={styles.height.mobile} desktop={styles.height.desktop} mobileMin={48} desktopMin={48} mobileMax={160} desktopMax={160} onChangeMobile={(value) => updateStyle({ height: { ...styles.height, mobile: value } })} onChangeDesktop={(value) => updateStyle({ height: { ...styles.height, desktop: value } })} />
        <Breakpoint label="Horizontal padding (px)" mobile={styles.paddingX.mobile} desktop={styles.paddingX.desktop} mobileMin={16} desktopMin={16} mobileMax={200} desktopMax={200} onChangeMobile={(value) => updateStyle({ paddingX: { ...styles.paddingX, mobile: value } })} onChangeDesktop={(value) => updateStyle({ paddingX: { ...styles.paddingX, desktop: value } })} />
      </fieldset>
      <hr className="border-stone/20" />
      <fieldset className="space-y-4">
        <legend className={legend}>Color</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Color label="Background" value={styles.backgroundColor} onChange={(value) => updateStyle({ backgroundColor: value })} />
          <Color label="Text" value={styles.textColor} onChange={(value) => updateStyle({ textColor: value })} />
          <Color label="Link" value={styles.linkColor} onChange={(value) => updateStyle({ linkColor: value })} />
          <Color label="Link hover" value={styles.linkHoverColor} onChange={(value) => updateStyle({ linkHoverColor: value })} />
        </div>
      </fieldset>
      <hr className="border-stone/20" />
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-ink font-display">Animation</legend>
        <AnimationField value={styles.animation} onChange={(animation) => updateStyle({ animation })} />
      </fieldset>
    </div>
  );
}

function NavbarPreview({ form, mode, storeName }: { form: NavbarContent; mode: "mobile" | "desktop"; storeName: string }) {
  const styles = form.styles;
  // Preview plays the chosen entrance on mount (replay remounts it).
  return (
    <Reveal type={styles.animation.type} scrollTrigger={false}>
    <div style={{ backgroundColor: styles.backgroundColor, color: styles.textColor, height: styles.height[mode], paddingLeft: styles.paddingX[mode], paddingRight: styles.paddingX[mode] }} className="flex items-center justify-between">
      <span className="max-w-[35%] truncate font-display text-lg font-semibold">{storeName}</span>
      <div className="flex items-center gap-4">
        {form.navLinks.map((link) => <span key={`${link.href}-${link.label}`} className="font-sans text-xs" style={{ color: styles.linkColor }}>{link.label}</span>)}
      </div>
    </div>
    </Reveal>
  );
}
