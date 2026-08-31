"use client";

// ─── Theme editor (Shopify-editor logic for Veldic Wear) ─────────────────────
// Three-pane workspace modeled on the Shopify theme editor:
//   left   — ordered, drag-reorderable section tree with per-section
//            visibility (the JSON template's "order" array + enabled flags)
//   center — live preview of the real homepage loaded with a signed preview
//            token so draft/hidden sections render; device toggle + refresh
//   right  — settings panel: auto-generated forms from the section registry
//            (JSON sections, autosaved) or a shortcut into the existing block
//            editors (hero / banner / featured-products)

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionFieldDef } from "@/lib/section-registry";
import SectionSettingsForm, { type SectionSettings } from "./SectionSettingsForm";

export type EditorSection = {
  id: string;
  key: string;
  label: string | null;
  published: boolean;
  position: number;
  content: unknown;
};

export type EditorDef = {
  key: string;
  name: string;
  description?: string;
  kind: "json" | "blocks";
  fields: SectionFieldDef[];
  defaultContent: Record<string, unknown>;
};

// Block-backed sections keep their content in Block rows and are edited by the
// existing dedicated editors — the theme editor deep-links into them.
const BLOCK_EDITOR_LINKS: Record<string, { href: string; label: string }> = {
  hero: { href: "/admin/homepage", label: "Open hero block editor" },
  banner: { href: "/admin/banner", label: "Open banner block editor" },
  "featured-products": { href: "/admin/featured-products", label: "Open featured products editor" },
};

export default function AdminEditorClient({
  initialSections,
  defs,
  previewToken,
}: {
  initialSections: EditorSection[];
  defs: EditorDef[];
  previewToken: string;
}) {
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [showAdd, setShowAdd] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ id: string; content: SectionSettings } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selected = sections.find((section) => section.id === selectedId) ?? null;
  const selectedDef = selected ? defs.find((def) => def.key === selected.key) ?? null : null;
  const previewSrc = `/?preview=1&t=${encodeURIComponent(previewToken)}`;

  // Scroll-preserving preview refresh: same-origin iframe, so the parent can
  // read the scroll offset and restore it after the reload lands.
  const refreshPreview = () => {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const y = frame.contentWindow?.scrollY ?? 0;
      frame.onload = () => {
        try {
          frame.contentWindow?.scrollTo(0, y);
        } catch {
          /* cross-document timing — ignore */
        }
      };
      frame.contentWindow?.location.reload();
    } catch {
      frame.src = previewSrc;
    }
  };

  // Debounced autosave for the settings panel (Shopify saves on change).
  const scheduleSave = (sectionId: string, content: SectionSettings) => {
    pendingSave.current = { id: sectionId, content };
    setSaveState("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 700);
  };

  const flushSave = async () => {
    const pending = pendingSave.current;
    if (!pending) return;
    pendingSave.current = null;
    setSaveState("saving");
    try {
      const response = await fetch("/api/admin/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pending.id, content: pending.content }),
      });
      if (!response.ok) throw new Error("save failed");
      setSaveState("saved");
      refreshPreview();
    } catch {
      setSaveState("error");
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const togglePublished = async (section: EditorSection) => {
    const next = !section.published;
    setSections((prev) => prev.map((item) => (item.id === section.id ? { ...item, published: next } : item)));
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, published: next }),
    });
    if (!response.ok) {
      setSections((prev) => prev.map((item) => (item.id === section.id ? { ...item, published: !next } : item)));
      return;
    }
    refreshPreview();
  };

  const reorder = async (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = sections.findIndex((section) => section.id === event.active.id);
    const newIndex = sections.findIndex((section) => section.id === event.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);
    const response = await fetch("/api/admin/editor/sections/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((section) => section.id) }),
    });
    if (!response.ok) setSections(sections); // revert on failure
    refreshPreview();
  };

  const addSection = async (section: EditorSection) => {
    setSections((prev) => prev.map((item) => (item.id === section.id ? { ...item, published: true } : item)));
    setShowAdd(false);
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, published: true }),
    });
    if (!response.ok) {
      setSections((prev) => prev.map((item) => (item.id === section.id ? { ...item, published: false } : item)));
      return;
    }
    setSelectedId(section.id);
    refreshPreview();
  };

  const resetToDefaults = () => {
    if (!selected || !selectedDef || selectedDef.kind !== "json") return;
    if (!window.confirm(`Reset "${selectedDef.name}" settings to defaults? This overwrites the current content.`)) return;
    const defaults = structuredClone(selectedDef.defaultContent) as SectionSettings;
    setSections((prev) => prev.map((item) => (item.id === selected.id ? { ...item, content: defaults } : item)));
    scheduleSave(selected.id, defaults);
  };

  const saveLabel =
    saveState === "pending" ? "Unsaved changes…" :
    saveState === "saving" ? "Saving…" :
    saveState === "saved" ? "Saved" :
    saveState === "error" ? "Save failed — retry by editing again" : "";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone/5 text-ink">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone/20 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-lg font-semibold">Homepage theme editor</h1>
          {saveLabel && (
            <span
              role="status"
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                saveState === "error" ? "bg-clay/10 text-clay" : "bg-moss/10 text-moss"
              }`}
            >
              {saveLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone/20 p-0.5" role="group" aria-label="Preview device">
            <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition ${device === "desktop" ? "bg-ink text-white" : "text-stone hover:text-ink"}`}>
              Desktop
            </button>
            <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition ${device === "mobile" ? "bg-ink text-white" : "text-stone hover:text-ink"}`}>
              Mobile
            </button>
          </div>
          <button type="button" onClick={refreshPreview} className="cursor-pointer rounded-lg border border-stone/20 px-3 py-1.5 text-xs font-medium text-stone transition hover:border-moss hover:text-moss focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
            Refresh preview
          </button>
          <a href={previewSrc} target="_blank" rel="noreferrer" className="cursor-pointer rounded-lg bg-moss px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-moss-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
            Open preview ↗
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: section tree (the JSON template's "order" array) */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-stone/20 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone">Sections</h2>
            <button type="button" onClick={() => setShowAdd((v) => !v)} aria-expanded={showAdd} className="cursor-pointer rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
              {showAdd ? "Close" : "+ Add section"}
            </button>
          </div>
          {showAdd && (
            <div className="mx-3 mb-3 space-y-1 rounded-xl border border-stone/20 bg-stone/5 p-2">
              {defs.map((def) => {
                const existing = sections.find((section) => section.key === def.key);
                const isOn = existing?.published;
                return (
                  <button
                    key={def.key}
                    type="button"
                    disabled={!existing || isOn}
                    onClick={() => existing && void addSection(existing)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{def.name}</span>
                      {def.description && <span className="block truncate text-xs text-stone">{def.description}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-stone">{isOn ? "Added" : existing ? "Show" : "—"}</span>
                  </button>
                );
              })}
              <p className="px-3 pb-1 pt-2 text-xs text-stone">Sections unavailable here are managed on their dedicated pages (hero, banner, featured products).</p>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
            <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
                {sections.map((section, index) => (
                  <SortableSectionRow
                    key={section.id}
                    section={section}
                    name={defs.find((def) => def.key === section.key)?.name ?? section.label ?? section.key}
                    selected={section.id === selectedId}
                    index={index}
                    onSelect={() => setSelectedId(section.id)}
                    onToggle={() => void togglePublished(section)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <p className="border-t border-stone/20 px-4 py-3 text-xs text-stone">Drag to reorder — the homepage renders top to bottom in this order. Hidden sections stay saved but don&apos;t render.</p>
        </aside>
        {/* Center: live preview of the real homepage */}
        <main className="flex min-w-0 flex-1 items-start justify-center overflow-y-auto bg-stone/10 p-4">
          <div
            className={
              device === "mobile"
                ? "mx-auto w-[390px] max-w-full overflow-hidden rounded-2xl border border-stone/30 bg-white shadow-lg"
                : "w-full overflow-hidden rounded-2xl border border-stone/30 bg-white shadow-lg"
            }
          >
            <iframe
              ref={iframeRef}
              src={previewSrc}
              title="Homepage preview"
              className={device === "mobile" ? "h-[780px] w-full" : "h-[calc(100vh-8.5rem)] w-full"}
            />
          </div>
        </main>

        {/* Right: settings panel for the selected section */}
        <aside className="flex w-[26rem] shrink-0 flex-col overflow-y-auto border-l border-stone/20 bg-white">
          {selected && selectedDef ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-stone/20 px-5 py-4">
                <h2 className="font-display text-lg font-semibold">{selectedDef.name}</h2>
                {selectedDef.description && <p className="mt-1 text-sm text-stone">{selectedDef.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone/20 px-3 py-1.5 text-xs font-medium text-stone">
                    <input type="checkbox" checked={selected.published} onChange={() => void togglePublished(selected)} className="h-4 w-4 cursor-pointer accent-moss" />
                    Visible on site
                  </label>
                  {selectedDef.kind === "json" && (
                    <button type="button" onClick={resetToDefaults} className="cursor-pointer rounded-lg border border-stone/20 px-3 py-1.5 text-xs font-medium text-stone transition hover:border-clay hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                      Reset to defaults
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 px-5 py-5">
                {selectedDef.kind === "blocks" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-stone">
                      This section is built from blocks. Use the dedicated editor to manage its blocks, styles, and animations.
                    </p>
                    {BLOCK_EDITOR_LINKS[selected.key] && (
                      <a href={BLOCK_EDITOR_LINKS[selected.key].href} className="inline-block cursor-pointer rounded-lg bg-clay px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                        {BLOCK_EDITOR_LINKS[selected.key].label} →
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <SectionSettingsForm
                      fields={selectedDef.fields}
                      content={structuredClone(selected.content ?? {}) as SectionSettings}
                      onChange={(next) => {
                        setSections((prev) => prev.map((item) => (item.id === selected.id ? { ...item, content: next } : item)));
                        scheduleSave(selected.id, next);
                      }}
                    />
                    <p className="mt-6 text-xs text-stone">Changes save automatically and update the preview.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-stone">Select a section to edit its settings.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Sortable section row (left tree) ────────────────────────────────────────

function SortableSectionRow({
  section,
  name,
  selected,
  index,
  onSelect,
  onToggle,
}: {
  section: EditorSection;
  name: string;
  selected: boolean;
  index: number;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={selected ? "rounded-xl border border-moss bg-moss/5 shadow-sm" : "rounded-xl border border-stone/20 bg-white shadow-sm hover:border-moss/50"}
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${name}`}
          className="cursor-grab touch-none rounded p-1.5 text-stone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 active:cursor-grabbing"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M7 4a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2zM7 9a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2zm-6 5a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2z" />
          </svg>
        </button>
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
          <span className={`block truncate text-sm font-medium ${section.published ? "text-ink" : "text-stone"}`}>
            {name}
            {!section.published && <span className="ml-2 text-xs font-normal text-clay">hidden</span>}
          </span>
          <span className="block text-xs text-stone">#{index + 1}</span>
        </button>
        <label className="shrink-0 cursor-pointer px-2" title={section.published ? "Hide on site" : "Show on site"}>
          <input type="checkbox" checked={section.published} onChange={onToggle} aria-label={`Toggle ${name} visibility`} className="h-4 w-4 cursor-pointer accent-moss" />
        </label>
      </div>
      {isDragging && <span className="sr-only">Dragging {name}</span>}
    </li>
  );
}



