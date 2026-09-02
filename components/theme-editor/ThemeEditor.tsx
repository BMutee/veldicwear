"use client";

// ─── Theme editor host (§5 — the three-pane editor) ───────────────────────────
// LEFT: structure tree / settings panel / theme settings, all driven by the
//       generic schema interpreter — no per-section UI code exists anywhere.
// RIGHT: live storefront preview in a same-origin iframe carrying the preview
//        token (design mode). Sections in the preview post `select` messages
//        back; the editor highlights the clicked section and opens its form.
//
// Persistence: the editor's data model IS the stored JSON document. Every
// mutation produces a new document draft; a debounced autosave (800ms) PUTs it
// to /api/admin/theme/document and then asks the preview to router.refresh()
// — RSC re-renders morph the DOM while preserving scroll and component state.
// Theme settings autosave separately to PUT /api/admin/settings.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SettingValue, SettingValues, TemplateDoc } from "@/lib/theme/types";
import { SECTION_DEFS, getSectionDef } from "@/lib/theme/definitions/sections";
import { getBlockDef } from "@/lib/theme/definitions/blocks";
import { createSectionInstance } from "@/lib/theme/instances";
import { themeSettingsDefs, themeSettingsIds } from "@/lib/theme/settings-schema";
import { t } from "@/lib/theme/locales";
import SchemaForm from "./SchemaForm";
import StructureTree from "./StructureTree";
import type { Selection } from "./selection";
import { EditorEvents, emit, postToFrame } from "./bus";

type SaveState = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 800;

export default function ThemeEditor({
  initialDoc,
  initialSettings,
  previewToken,
  docSource,
}: {
  initialDoc: TemplateDoc;
  initialSettings: SettingValues;
  previewToken: string;
  docSource: string;
}) {
  const [doc, setDoc] = useState<TemplateDoc>(initialDoc);
  const [selection, setSelection] = useState<Selection>(null);
  const [storeSettings, setStoreSettings] = useState<SettingValues>(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = `/?preview=1&t=${encodeURIComponent(previewToken)}`;

  const refreshPreview = useCallback(() => {
    postToFrame(frameRef.current, { type: "veldic-editor-refresh" });
    emit(EditorEvents.PreviewRefreshed, null);
  }, []);

  // ── Document autosave ───────────────────────────────────────────────────────
  const docFirst = useRef(true);
  const docTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (docFirst.current) {
      docFirst.current = false;
      return;
    }
    setSaveState("dirty");
    if (docTimer.current) clearTimeout(docTimer.current);
    docTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch("/api/admin/theme/document", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Save failed (${res.status})`);
        }
        setSaveState("saved");
        setError(null);
        emit(EditorEvents.DocSaved, null);
        refreshPreview();
      } catch (err) {
        setSaveState("error");
        setError(err instanceof Error ? err.message : "Unable to save changes.");
      }
    }, AUTOSAVE_MS);
    return () => {
      if (docTimer.current) clearTimeout(docTimer.current);
    };
  }, [doc, refreshPreview]);

  // ── Theme settings autosave (separate endpoint; partial-field PUT) ─────────
  const settingsFirst = useRef(true);
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (settingsFirst.current) {
      settingsFirst.current = false;
      return;
    }
    setSaveState("dirty");
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const ids = new Set(themeSettingsIds());
        const payload: SettingValues = {};
        for (const [key, value] of Object.entries(storeSettings)) {
          if (ids.has(key)) payload[key] = value;
        }
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Settings save failed (${res.status})`);
        setSaveState("saved");
        setError(null);
        refreshPreview();
      } catch (err) {
        setSaveState("error");
        setError(err instanceof Error ? err.message : "Unable to save theme settings.");
      }
    }, AUTOSAVE_MS);
    return () => {
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, [storeSettings, refreshPreview]);

  // ── Preview → editor: click-to-select ───────────────────────────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "veldic-editor-select") {
        const id = typeof event.data.id === "string" ? event.data.id : "";
        if (id) setSelection((prev) => (prev?.kind === "section" && prev.id === id ? prev : { kind: "section", id }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Editor → preview: highlight the selection ───────────────────────────────
  useEffect(() => {
    if (selection?.kind === "section") {
      postToFrame(frameRef.current, { type: "veldic-editor-highlight", id: selection.id });
    } else if (selection?.kind === "block") {
      postToFrame(frameRef.current, { type: "veldic-editor-highlight", id: selection.sectionId });
    }
  }, [selection]);

  // ── Mutations (immutable drafts → autosave) ─────────────────────────────────
  const mutateDoc = useCallback((updater: (draft: TemplateDoc) => void) => {
    setDoc((prev) => {
      const draft = structuredClone(prev) as TemplateDoc;
      updater(draft);
      return draft;
    });
    emit(EditorEvents.DocMutated, null);
  }, []);

  const handleSelect = useCallback(
    (next: Selection) => {
      // Sections whose content lives in a single static block (hero, banner,
      // featured products) jump straight to that block's form — the section
      // itself has nothing to edit.
      if (next?.kind === "section") {
        const instance = doc.sections[next.id];
        const def = instance ? getSectionDef(instance.type) : undefined;
        if (def && def.settings.length === 0 && def.blocks.length > 0) {
          const firstBlockId = instance?.block_order[0];
          if (firstBlockId && instance?.blocks[firstBlockId]) {
            setSelection({ kind: "block", sectionId: next.id, id: firstBlockId });
            return;
          }
        }
      }
      setSelection(next);
    },
    [doc.sections]
  );

  const handleSectionSettingChange = useCallback(
    (sectionId: string) => (fieldId: string, value: SettingValue) => {
      mutateDoc((draft) => {
        const section = draft.sections[sectionId];
        if (section) section.settings[fieldId] = value;
      });
    },
    [mutateDoc]
  );

  const handleBlockSettingChange = useCallback(
    (sectionId: string, blockId: string) => (fieldId: string, value: SettingValue) => {
      mutateDoc((draft) => {
        const block = draft.sections[sectionId]?.blocks[blockId];
        if (block) block.settings[fieldId] = value;
      });
    },
    [mutateDoc]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      mutateDoc((draft) => {
        const [moved] = draft.order.splice(fromIndex, 1);
        draft.order.splice(toIndex, 0, moved);
      });
    },
    [mutateDoc]
  );

  const handleToggleHidden = useCallback(
    (sectionId: string) => {
      mutateDoc((draft) => {
        const section = draft.sections[sectionId];
        if (section) section.hidden = !(section.hidden ?? false);
      });
    },
    [mutateDoc]
  );

  const handleRemoveSection = useCallback(
    (sectionId: string) => {
      mutateDoc((draft) => {
        delete draft.sections[sectionId];
        draft.order = draft.order.filter((id) => id !== sectionId);
      });
      setSelection((prev) => (prev && "id" in prev && prev.id === sectionId ? null : prev));
    },
    [mutateDoc]
  );

  const handleAddSection = useCallback(
    (type: string, presetIndex: number) => {
      const { id, instance } = createSectionInstance(type, presetIndex);
      mutateDoc((draft) => {
        draft.sections[id] = instance;
        draft.order.push(id);
      });
      setAddOpen(false);
      setSelection({ kind: "section", id });
    },
    [mutateDoc]
  );

  const handleThemeSettingChange = useCallback((fieldId: string, value: SettingValue) => {
    setStoreSettings((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  const sel = selection;
  const selSectionId = sel?.kind === "section" ? sel.id : sel?.kind === "block" ? sel.sectionId : null;
  const selBlockId = sel?.kind === "block" ? sel.id : null;
  const selSection = selSectionId ? doc.sections[selSectionId] : undefined;
  const selDef = selSection ? getSectionDef(selSection.type) : undefined;
  const selBlock = selBlockId && selSection ? selSection.blocks[selBlockId] : undefined;
  const selBlockDef = selBlock ? getBlockDef(selBlock.type) : undefined;

  const saveLabel: Record<SaveState, string> = {
    saved: "All changes saved",
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed",
  };

  return (
    <div className="flex h-screen flex-col bg-bone">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-stone/20 bg-white px-4">
        <Link
          href="/admin"
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-stone transition-colors duration-150 hover:bg-bone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Admin
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-ink">Homepage theme editor</h1>
          <p className="truncate text-xs text-stone">{docSource}</p>
        </div>
        <span
          title={saveState === "error" && error ? error : undefined}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            saveState === "error" ? "bg-clay/10 text-clay" : saveState === "saved" ? "bg-moss/10 text-moss" : "bg-stone/10 text-stone"
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${saveState === "error" ? "bg-clay" : saveState === "saved" ? "bg-moss" : "bg-stone"}`} />
          {saveState === "error" && error ? error : saveLabel[saveState]}
        </span>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone/30 px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View store
        </a>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left pane */}
        <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-stone/20 bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {sel === null ? (
              <StructureTree
                doc={doc}
                defs={SECTION_DEFS}
                selection={selection}
                onSelect={handleSelect}
                onReorder={handleReorder}
                onToggleHidden={handleToggleHidden}
                onRemoveSection={handleRemoveSection}
              />
            ) : sel.kind === "theme-settings" ? (
              <SchemaForm
                title="Theme settings"
                subtitle="Global options inherited by every section"
                schema={themeSettingsDefs()}
                values={storeSettings}
                globalSettings={storeSettings}
                onChange={handleThemeSettingChange}
              />
            ) : selDef && selSection ? (
              <SchemaForm
                title={t(sel.kind === "block" && selBlockDef ? selBlockDef.name : selDef.name)}
                subtitle={
                  sel.kind === "block" && selBlockDef
                    ? `${t(selBlockDef.name)} · inside ${t(selDef.name)}`
                    : t(selDef.description) || undefined
                }
                schema={sel.kind === "block" && selBlockDef ? selBlockDef.settings : selDef.settings}
                values={sel.kind === "block" ? selBlock?.settings ?? {} : selSection.settings}
                globalSettings={storeSettings}
                onChange={sel.kind === "block" && selSectionId && selBlockId ? handleBlockSettingChange(selSectionId, selBlockId) : handleSectionSettingChange(selSectionId ?? "")}
              />
            ) : null}
          </div>
          <div className="shrink-0 border-t border-stone/20 p-3">
            {sel === null ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ink/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add section
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone/30 px-3 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 4.5L2 12l7.5 7.5M2 12h20" />
                </svg>
                Back to structure
              </button>
            )}
          </div>
        </aside>

        {/* Preview pane */}
        <main className="min-w-0 flex-1 bg-bone p-4">
          <iframe
            ref={frameRef}
            src={previewUrl}
            title="Storefront preview"
            className="h-full w-full rounded-xl border border-stone/20 bg-white shadow-sm"
          />
        </main>
      </div>

      {addOpen && <AddSectionPicker onAdd={handleAddSection} onClose={() => setAddOpen(false)} />}

    </div>
  );
}

/** §7.3 — "Add section" picker: one card per definition, presets expandable. */
function AddSectionPicker({ onAdd, onClose }: { onAdd: (type: string, presetIndex: number) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Add section">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-sm" />
      <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone/20 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone/20 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Add a section</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-stone transition-colors duration-150 hover:bg-bone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
          {SECTION_DEFS.map((def) => (
            <SectionCard key={def.type} type={def.type} name={t(def.name)} description={t(def.description)} presetCount={def.presets.length} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  type,
  name,
  description,
  presetCount,
  onAdd,
}: {
  type: string;
  name: string;
  description: string;
  presetCount: number;
  onAdd: (type: string, presetIndex: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-stone/25 transition-colors duration-150 hover:border-moss/50">
      {presetCount > 1 ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full cursor-pointer flex-col items-start gap-1 p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss/40"
        >
          <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-ink">
            {name}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className={`h-3.5 w-3.5 shrink-0 text-stone transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
          <span className="text-xs leading-relaxed text-stone">{description}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(type, 0)}
          className="flex w-full cursor-pointer flex-col items-start gap-1 p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss/40"
        >
          <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-ink">
            {name}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4 shrink-0 text-moss">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <span className="text-xs leading-relaxed text-stone">{description}</span>
        </button>
      )}
      {presetCount > 1 && open && (
        <div className="space-y-1 border-t border-stone/15 px-2.5 py-2.5">
          {getPresets(type).map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onAdd(type, index)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-moss/5 hover:text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
            >
              <span className="truncate">{t(preset.name)}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-stone" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getPresets(type: string) {
  return getSectionDef(type)?.presets ?? [];
}


