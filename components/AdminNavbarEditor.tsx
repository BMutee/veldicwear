"use client";

import { useState } from "react";
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
import Reveal from "./motion/Reveal";

type Props = {
  initialContent: NavbarContent;
  initialSavedAt: string | null;
  defaults: NavbarContent;
  storeName: string;
};

export default function AdminNavbarEditor({ initialContent, initialSavedAt, defaults, storeName }: Props) {
  const [tab, setTab] = useState<"content" | "style">("content");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [form, setForm] = useState<NavbarContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors([]);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/navbar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(Array.isArray(data?.details) ? data.details : [data?.error || "Failed to save."]);
        setSaving(false);
        return;
      }
      if (data?.content) setForm(data.content as NavbarContent);
      setDirty(false);
      setSuccess("Navbar saved.");
      setSaving(false);
      router.refresh();
    } catch {
      setErrors(["Network error. Please try again."]);
      setSaving(false);
    }
  };

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

function ContentTab({ links, updateLink, moveLink, removeLink, addLink }: {
  links: NavbarContent["navLinks"];
  updateLink: (index: number, patch: Partial<NavbarContent["navLinks"][number]>) => void;
  moveLink: (index: number, direction: -1 | 1) => void;
  removeLink: (index: number) => void;
  addLink: () => void;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold uppercase tracking-wide text-ink font-display">Navigation links</legend>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={`${index}-${link.href}`} className="rounded-lg border border-stone/20 bg-bone/40 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className={LABEL_CLS}>Label<input value={link.label} onChange={(event) => updateLink(index, { label: event.target.value })} className={INPUT_CLS} /></label>
              <label className={LABEL_CLS}>URL<input value={link.href} onChange={(event) => updateLink(index, { href: event.target.value })} className={INPUT_CLS} /></label>
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

function StyleTab({ styles, updateStyle }: { styles: NavbarStyles; updateStyle: (patch: Partial<NavbarStyles>) => void }) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-ink font-display">Layout</legend>
        <BreakpointField label="Height (px)" mobile={styles.height.mobile} desktop={styles.height.desktop} mobileMin={48} desktopMin={48} mobileMax={160} desktopMax={160} onChangeMobile={(value) => updateStyle({ height: { ...styles.height, mobile: value } })} onChangeDesktop={(value) => updateStyle({ height: { ...styles.height, desktop: value } })} />
        <BreakpointField label="Horizontal padding (px)" mobile={styles.paddingX.mobile} desktop={styles.paddingX.desktop} mobileMin={16} desktopMin={16} mobileMax={200} desktopMax={200} onChangeMobile={(value) => updateStyle({ paddingX: { ...styles.paddingX, mobile: value } })} onChangeDesktop={(value) => updateStyle({ paddingX: { ...styles.paddingX, desktop: value } })} />
      </fieldset>
      <hr className="border-stone/20" />
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-ink font-display">Color</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Background" value={styles.backgroundColor} onChange={(value) => updateStyle({ backgroundColor: value })} />
          <ColorField label="Text" value={styles.textColor} onChange={(value) => updateStyle({ textColor: value })} />
          <ColorField label="Link" value={styles.linkColor} onChange={(value) => updateStyle({ linkColor: value })} />
          <ColorField label="Link hover" value={styles.linkHoverColor} onChange={(value) => updateStyle({ linkHoverColor: value })} />
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
