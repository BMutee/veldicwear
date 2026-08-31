"use client";

// ─── Theme editor (Shopify theme-editor replica) ─────────────────────────────
// Chrome and behavior mirror admin.shopify.com's theme editor:
//   top bar   — exit chevron, theme name, centered device toggle, View, Save
//   left pane — "Theme sections" tree (drag handle, name, visibility eye,
//               chevron), "+ Add section" with searchable picker, and a
//               settings view with a back chevron (single swap pane)
//   canvas    — live homepage preview iframe (same-origin, signed preview
//               token) with desktop/mobile framing and click-to-select
// Design tokens follow Shopify Polaris: #303030 ink, #616161 muted, #e3e3e3
// hairlines, #f1f1f1 canvas, #005bd3 interactive blue, system font stack.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import EditorBlocksManager from "./EditorBlocksManager";

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
  /** Core sections can't be removed from the homepage (registry flag). */
  deletable?: boolean;
  fields: SectionFieldDef[];
  defaultContent: Record<string, unknown>;
};

const FONT = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" };
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50";
const ICON_BTN = `flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#616161] transition hover:bg-[#f1f1f1] hover:text-[#303030] ${FOCUS}`;
const SECONDARY_BTN = `flex h-8 cursor-pointer items-center rounded-md border border-[#c9cccf] bg-white px-3 text-[13px] font-medium text-[#303030] shadow-[0_1px_0_0_rgba(0,0,0,0.05)] transition hover:bg-[#f7f7f7] ${FOCUS}`;

type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "settings" | "add">("tree");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [query, setQuery] = useState("");
  // Unsaved JSON-content edits keyed by section id — persisted only on Save
  // (Shopify behavior: the top-bar Save button publishes pending changes).
  const [drafts, setDrafts] = useState<Record<string, SectionSettings>>({});
  const dirty = Object.keys(drafts).length > 0;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selected = sections.find((s) => s.id === selectedId) ?? null;
  const selectedDef = selected ? defs.find((d) => d.key === selected.key) ?? null : null;
  const previewSrc = `/?preview=1&t=${encodeURIComponent(previewToken)}`;

  const flash = (state: Exclude<SaveState, "idle" | "saving">) => {
    setSaveState(state);
    window.setTimeout(() => setSaveState("idle"), 2200);
  };

  const refreshPreview = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      frame.contentWindow?.location.reload();
    } catch {
      frame.src = previewSrc;
    }
  }, [previewSrc]);

  const postHighlight = useCallback((id: string | null) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "veldic-editor-highlight", id }, window.location.origin);
    } catch {
      /* iframe not ready */
    }
  }, []);

  // Highlight the selected section inside the preview whenever selection moves.
  useEffect(() => {
    postHighlight(selectedId);
  }, [selectedId, postHighlight]);

  // Clicks inside the preview (SectionHighlighter) select here in the sidebar.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "veldic-editor-select") return;
      const id = typeof event.data.id === "string" ? event.data.id : "";
      if (id && sections.some((s) => s.id === id)) {
        setSelectedId(id);
        setView("settings");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sections]);

  // Guard against losing unsaved content edits (Shopify does the same).
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const setDraftContent = (id: string, content: SectionSettings) =>
    setDrafts((prev) => ({ ...prev, [id]: content }));

  // The content currently being edited: the draft if one exists, else stored.
  const currentContent = (section: EditorSection): SectionSettings =>
    (drafts[section.id] as SectionSettings | undefined) ??
    (section.content as SectionSettings | undefined) ??
    {};

  const togglePublished = async (section: EditorSection) => {
    const next = !section.published;
    const snapshot = sections;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, published: next } : s)));
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, published: next }),
    });
    if (!response.ok) setSections(snapshot);
    else refreshPreview();
  };

  const reorder = async (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === event.active.id);
    const newIndex = sections.findIndex((s) => s.id === event.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const snapshot = sections;
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);
    const response = await fetch("/api/admin/editor/sections/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((s) => s.id) }),
    });
    if (!response.ok) setSections(snapshot);
    else refreshPreview();
  };

  // "Add section" candidates: registry defs not currently live on the homepage.
  const hiddenDefs = defs.filter((d) => !sections.some((s) => s.key === d.key && s.published));
  const matchingDefs = hiddenDefs.filter((d) =>
    d.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  // Publishes the section and moves it to the bottom of the homepage.
  const addSection = async (key: string) => {
    const section = sections.find((s) => s.key === key);
    if (!section) return;
    const snapshot = sections;
    const ordered = [...sections.filter((s) => s.id !== section.id), { ...section, published: true }];
    setSections(ordered);
    setView("tree");
    const publish = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: section.id, published: true }),
    });
    const order = await fetch("/api/admin/editor/sections/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((s) => s.id) }),
    });
    if (!publish.ok || !order.ok) {
      setSections(snapshot);
      return;
    }
    setSelectedId(section.id);
    setView("settings");
    refreshPreview();
  };

  // Top-bar Save: persists every pending content draft, then refreshes.
  const save = async () => {
    if (!dirty || saveState === "saving") return;
    setSaveState("saving");
    try {
      for (const [id, content] of Object.entries(drafts)) {
        const response = await fetch("/api/admin/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, content }),
        });
        if (!response.ok) throw new Error("save failed");
      }
      setSections((prev) =>
        prev.map((s) => (drafts[s.id] !== undefined ? { ...s, content: drafts[s.id] } : s))
      );
      setDrafts({});
      flash("saved");
      refreshPreview();
    } catch {
      flash("error");
    }
  };

  const resetDefaults = () => {
    if (!selected || !selectedDef || selectedDef.kind !== "json") return;
    if (!window.confirm(`Reset "${selectedDef.name}" settings to their defaults? This discards your current edits.`)) return;
    setDraftContent(selected.id, structuredClone(selectedDef.defaultContent) as SectionSettings);
  };

  // "Remove from homepage": unpublishes the section (its content is preserved
  // and it reappears in the Add section picker) — mirrors Shopify's remove.
  const removeSection = async () => {
    if (!selected || selectedDef?.deletable !== true) return;
    const label = selectedDef?.name ?? selected.key;
    if (!window.confirm(`Remove "${label}" from the homepage? Its content is kept and it can be re-added later.`)) return;
    const snapshot = sections;
    setSections((prev) => prev.map((s) => (s.id === selected.id ? { ...s, published: false } : s)));
    setSelectedId(null);
    setView("tree");
    const response = await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, published: false }),
    });
    if (!response.ok) {
      setSections(snapshot);
      return;
    }
    refreshPreview();
  };


  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f1f1] text-[#303030]" style={FONT}>
      {/* Top bar — exit, title, device toggle, View, Save */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e3e3e3] bg-white px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href="/admin"
            aria-label="Exit theme editor"
            className={ICON_BTN}
            onClick={(e) => {
              if (dirty && !window.confirm("Leave with unsaved changes?")) e.preventDefault();
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <span className="h-5 w-px bg-[#e3e3e3]" aria-hidden="true" />
          <p className="truncate text-[13px] font-semibold">Veldic Wear · Homepage</p>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-[#f1f1f1] p-0.5" role="group" aria-label="Preview device">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            aria-pressed={device === "desktop"}
            title="Desktop preview"
            className={ICON_BTN + (device === "desktop" ? " bg-white text-[#303030] shadow-sm" : "")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            aria-pressed={device === "mobile"}
            title="Mobile preview"
            className={ICON_BTN + (device === "mobile" ? " bg-white text-[#303030] shadow-sm" : "")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a href={previewSrc} target="_blank" rel="noopener noreferrer" className={SECONDARY_BTN}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saveState === "saving"}
            aria-live="polite"
            className={`flex h-8 cursor-pointer items-center rounded-md px-3.5 text-[13px] font-medium text-white transition ${FOCUS} ${
              saveState === "error"
                ? "bg-[#b3261e] hover:bg-[#8f1f18]"
                : "bg-[#303030] hover:bg-black"
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "error" ? "Failed — retry" : "Save"}
          </button>
        </div>
      </header>
      {/* Body — left rail + preview canvas */}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-[#e3e3e3] bg-white">
          {view === "tree" && (
            <>
              <div className="flex h-12 shrink-0 items-center px-4">
                <h2 className="text-[13px] font-semibold">Theme sections</h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void reorder(e)}>
                  <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                      {sections.map((s) => (
                        <SortableSectionRow
                          key={s.id}
                          section={s}
                          name={defs.find((d) => d.key === s.key)?.name ?? s.label ?? s.key}
                          selected={selectedId === s.id}
                          onSelect={() => {
                            setSelectedId(s.id);
                            setView("settings");
                          }}
                          onToggle={() => void togglePublished(s)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
              <div className="shrink-0 border-t border-[#e3e3e3] p-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setView("add");
                  }}
                  className={SECONDARY_BTN + " w-full justify-center"}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add section
                </button>
              </div>
            </>
          )}
          {view === "settings" && selected && selectedDef && (
            <>
              <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[#e3e3e3] px-2">
                <button type="button" onClick={() => setView("tree")} aria-label="Back to sections" className={ICON_BTN}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold">{selectedDef.name}</h2>
                {selectedDef.kind === "json" && (
                  <button type="button" onClick={resetDefaults} aria-label="Reset to defaults" title="Reset to defaults" className={ICON_BTN}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                )}
                {selectedDef.deletable && (
                  <button type="button" onClick={() => void removeSection()} aria-label="Remove section" title="Remove from homepage" className={ICON_BTN}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {selectedDef.kind === "json" ? (
                  <>
                    {selectedDef.description && <p className="mb-4 text-xs leading-relaxed text-[#616161]">{selectedDef.description}</p>}
                    <SectionSettingsForm
                      fields={selectedDef.fields}
                      content={currentContent(selected)}
                      onChange={(next) => setDraftContent(selected.id, next)}
                    />
                    <div className="mt-6 rounded-md bg-[#f1f1f1] px-3 py-2.5">
                      <p className="text-xs text-[#616161]">
                        {drafts[selected.id] !== undefined ? "You have unsaved changes." : "Changes here appear on the live homepage after saving."}
                      </p>
                      {drafts[selected.id] !== undefined && (
                        <button type="button" onClick={() => void save()} className={`mt-2 cursor-pointer text-xs font-medium text-[#005bd3] hover:underline ${FOCUS}`}>
                          Save changes
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <EditorBlocksManager sectionKey={selectedDef.key} onSaved={refreshPreview} />
                )}
              </div>
            </>
          )}
          {view === "add" && (
            <>
              <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[#e3e3e3] px-2">
                <button type="button" onClick={() => setView("tree")} aria-label="Back to sections" className={ICON_BTN}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold">Add section</h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sections"
                  aria-label="Search sections"
                  className={`h-8 w-full rounded-md border border-[#c9cccf] bg-white px-3 text-[13px] placeholder:text-[#8a8a8a] focus:border-[#005bd3] focus:outline-none focus:ring-1 focus:ring-[#005bd3] ${FOCUS}`}
                />
                <div className="mt-3 space-y-0.5">
                  {matchingDefs.length === 0 && (
                    <p className="px-2 py-6 text-center text-[13px] text-[#616161]">
                      {hiddenDefs.length === 0 ? "All sections are already on the homepage." : "No sections match your search."}
                    </p>
                  )}
                  {matchingDefs.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => void addSection(d.key)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-left transition hover:bg-[#f7f7f7] ${FOCUS}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[#303030]">{d.name}</span>
                        {d.description && <span className="mt-0.5 block truncate text-xs text-[#616161]">{d.description}</span>}
                      </span>
                      <svg className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>
        {/* Preview canvas — gray backdrop, device-framed live homepage */}
        <main className="flex min-w-0 flex-1 items-stretch justify-center overflow-hidden p-4">
          <div
            className={`h-full overflow-hidden bg-white transition-[width,border-radius] duration-200 ${
              device === "desktop"
                ? "w-full max-w-[1400px] rounded-lg border border-[#e3e3e3] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                : "w-[390px] max-w-full rounded-[28px] border-[10px] border-[#303030] shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
            }`}
          >
            <iframe ref={iframeRef} src={previewSrc} title="Homepage preview" className="h-full w-full border-0" />
          </div>
        </main>
      </div>
    </div>
  );
}

// Draggable row in the "Theme sections" tree — grip handle, name, eye toggle,
// chevron into settings. Mirrors Shopify's section rows including hidden-row
// muted state and dragging elevation.
function SortableSectionRow({
  section,
  name,
  selected,
  onSelect,
  onToggle,
}: {
  section: EditorSection;
  name: string;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group flex h-10 items-center gap-0.5 rounded-md px-1 transition-colors ${
        selected ? "bg-[#eef2f6]" : "hover:bg-[#f7f7f7]"
      } ${isDragging ? "z-10 bg-white shadow-md" : ""} ${section.published ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${name}`}
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[#8a8a8a] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="5" r="1.6" />
          <circle cx="15" cy="5" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="19" r="1.6" />
          <circle cx="15" cy="19" r="1.6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className={`min-w-0 flex-1 cursor-pointer truncate text-left text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50 ${
          section.published ? "text-[#303030]" : "text-[#616161]"
        } ${selected ? "font-semibold" : "font-normal"}`}
      >
        {name}
      </button>
      {!section.published && (
        <span className="mr-1 shrink-0 text-[10px] font-medium uppercase tracking-wide text-[#8a8a8a]">
          Hidden
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={section.published ? `Hide ${name}` : `Show ${name}`}
        title={section.published ? "Hide section" : "Show section"}
        className={ICON_BTN}
      >
        {section.published ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        )}
      </button>
      <button type="button" onClick={onSelect} aria-label={`Edit ${name}`} title="Edit section" className={ICON_BTN}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
