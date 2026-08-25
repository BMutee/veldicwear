"use client";

import { useState } from "react";
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
import Reveal from "./motion/Reveal";

type Props = {
  initialContent: FooterContent;
  initialSavedAt: string | null;
  defaults: FooterContent;
  /** Store name for the live preview — brand identity now lives in StoreSettings. */
  storeName: string;
};

type LinkKey = "shopLinks" | "supportLinks" | "companyLinks";

export default function AdminFooterEditor({
  initialContent,
  initialSavedAt,
  defaults,
  storeName,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(
          Array.isArray(data?.details) ? data.details : [data?.error || "Failed to save."]
        );
        setSaving(false);
        return;
      }
      if (data?.content) setForm(data.content as FooterContent);
      setSuccessMsg("Footer saved.");
      setDirty(false);
      setSaving(false);
      router.refresh();
    } catch {
      setErrors(["Network error. Please try again."]);
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(defaults);
    setDirty(true);
    setErrors([]);
    setSuccessMsg(null);
  };

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
}: {
  title: string;
  links: { label: string; href: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: "label" | "href", value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
        {title}
      </legend>
      {links.map((l, i) => (
        <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className={LABEL_CLS}>
            Label
            <input value={l.label} onChange={(e) => onChange(i, "label", e.target.value)} className={INPUT_CLS} />
          </label>
          <label className={LABEL_CLS}>
            URL
            <input value={l.href} onChange={(e) => onChange(i, "href", e.target.value)} className={INPUT_CLS + " font-mono"} />
          </label>
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${title} link`}
            className="cursor-pointer rounded-lg border border-clay/20 px-3 py-2 text-xs font-medium text-clay hover:bg-clay/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 transition font-body"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="cursor-pointer rounded-lg border border-stone/20 px-3 py-1.5 text-xs font-medium text-stone hover:text-ink hover:bg-stone/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 transition font-body"
      >
        + Add link
      </button>
    </fieldset>
  );
}

function ContentTab({
  form,
  updateBrand,
  updateLink,
  addLink,
  removeLink,
  updatePayments,
}: {
  form: FooterContent;
  updateBrand: (patch: Partial<Pick<FooterContent, "brandDescription">>) => void;
  updateLink: (key: LinkKey, i: number, field: "label" | "href", value: string) => void;
  addLink: (key: LinkKey) => void;
  removeLink: (key: LinkKey, i: number) => void;
  updatePayments: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
          Brand description
        </legend>
        <label className={LABEL_CLS}>
          Description
          <textarea
            value={form.brandDescription}
            onChange={(e) => updateBrand({ brandDescription: e.target.value })}
            rows={3}
            className={INPUT_CLS}
          />
        </label>
      </fieldset>

      <hr className="border-stone/20" />

      <LinkGroup
        title="Shop links"
        links={form.shopLinks}
        onAdd={() => addLink("shopLinks")}
        onRemove={(i) => removeLink("shopLinks", i)}
        onChange={(i, f, v) => updateLink("shopLinks", i, f, v)}
      />
      <LinkGroup
        title="Support links"
        links={form.supportLinks}
        onAdd={() => addLink("supportLinks")}
        onRemove={(i) => removeLink("supportLinks", i)}
        onChange={(i, f, v) => updateLink("supportLinks", i, f, v)}
      />
      <LinkGroup
        title="Company links"
        links={form.companyLinks}
        onAdd={() => addLink("companyLinks")}
        onRemove={(i) => removeLink("companyLinks", i)}
        onChange={(i, f, v) => updateLink("companyLinks", i, f, v)}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
          Payment methods
        </legend>
        <label className={LABEL_CLS}>
          Comma-separated
          <input
            value={form.paymentMethods.join(", ")}
            onChange={(e) => updatePayments(e.target.value)}
            placeholder="Visa, MC, Amex, PayPal, Apple Pay"
            className={INPUT_CLS}
          />
        </label>
      </fieldset>
    </div>
  );
}


function StyleTab({
  styles,
  updateStyle,
}: {
  styles: FooterStyles;
  updateStyle: (patch: Partial<FooterStyles>) => void;
}) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
          Spacing
        </legend>
        <PaddingFields
          padding={styles}
          onChange={(key, breakpoint, value) =>
            updateStyle({ [key]: { ...styles[key], [breakpoint]: value } })
          }
          minTop={40}
          minBottom={40}
        />
      </fieldset>

      <hr className="border-stone/20" />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
          Color
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Background" value={styles.backgroundColor} onChange={(v) => updateStyle({ backgroundColor: v })} />
          <ColorField label="Text" value={styles.textColor} onChange={(v) => updateStyle({ textColor: v })} />
          <ColorField label="Link" value={styles.linkColor} onChange={(v) => updateStyle({ linkColor: v })} />
          <ColorField label="Link hover" value={styles.linkHoverColor} onChange={(v) => updateStyle({ linkHoverColor: v })} />
        </div>
      </fieldset>

      <hr className="border-stone/20" />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
          Animation
        </legend>
        <AnimationField
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

