"use client";

// ─── Inline blocks manager for block-backed sections ─────────────────────────
// In the Shopify theme editor, a section's blocks (hero slides, featured
// products, buttons…) are edited inside the section panel itself — never on a
// separate page. This component brings that behavior to the theme editor for
// the block-backed sections (Hero, Promo banner, Featured products): a nested
// blocks list with drag-reorder, add/remove, and each block's content + style
// editors rendered inline. It reuses the exact exported editors the standalone
// block pages use (AdminBlocksClient), so editing behavior stays identical.
// Changes autosave (debounced) and refresh the live preview via onSaved.

import { useCallback, useEffect, useRef, useState } from "react";
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
import { labels, ContentEditor, StyleEditor, type BlockRow } from "./AdminBlocksClient";
import type { BlockType } from "@/lib/block-section";

const FONT = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" };
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005bd3]/50";

// Sections whose block composition is fixed to one type (mirrors the standalone
// featured-products editor); hero/banner accept the full block palette so the
// composition stays as flexible as the old pages allowed.
const ALLOWED: Record<string, BlockType[]> = {
  "featured-products": ["FEATURED_PRODUCTS"],
};
const ALL_TYPES: BlockType[] = ["HERO", "RICH_TEXT", "IMAGE", "BUTTON", "IMAGE_TEXT", "GALLERY", "FEATURED_PRODUCTS"];

type Status = "idle" | "saving" | "saved" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export default function EditorBlocksManager({ sectionKey, onSaved }: { sectionKey: string; onSaved?: () => void }) {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"content" | "style">("content");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [picker, setPicker] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Omit<BlockRow, "order"> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const api = `/api/admin/sections/${sectionKey}/blocks`;
  const banner = sectionKey === "banner";
  const allowed = ALLOWED[sectionKey] ?? ALL_TYPES;
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api);
      const rows: BlockRow[] = res.ok ? await res.json() : [];
      const sorted = [...rows].sort((a, b) => a.order - b.order);
      setBlocks(sorted);
      setSelectedId((prev) => (prev && sorted.some((b) => b.id === prev) ? prev : sorted[0]?.id ?? null));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const scheduleSave = (row: BlockRow) => {
    pending.current = { id: row.id, type: row.type, content: row.content, styles: row.styles };
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSave(), 600);
  };

  const flushSave = async () => {
    const row = pending.current;
    if (!row) return;
    pending.current = null;
    try {
      const res = await fetch(api, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  };

  const updateSelected = (patch: Partial<BlockRow>) => {
    const row = blocks.find((b) => b.id === selectedId);
    if (!row) return;
    const nextRow = { ...row, ...patch };
    setBlocks((prev) => prev.map((b) => (b.id === row.id ? nextRow : b)));
    scheduleSave(nextRow);
  };

  const addBlock = async (type: BlockType) => {
    setStatus("saving");
    try {
      const res = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
      if (!res.ok) throw new Error("create failed");
      const created = (await res.json()) as BlockRow;
      await load();
      setSelectedId(created?.id ?? null);
      setTab("content");
      setPicker(false);
      setStatus("idle");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  };

  const deleteBlock = async (id: string) => {
    const row = blocks.find((b) => b.id === id);
    if (!row || !window.confirm(`Delete this ${labels[row.type]} block?`)) return;
    setStatus("saving");
    try {
      const res = await fetch(`${api}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      if (selectedId === id) setSelectedId(null);
      await load();
      setStatus("idle");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  };

  const reorder = async (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === event.active.id);
    const newIndex = blocks.findIndex((b) => b.id === event.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i + 1 }));
    setBlocks(next);
    try {
      const res = await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: next.map((b) => b.id) }) });
      if (!res.ok) throw new Error("reorder failed");
      onSaved?.();
    } catch {
      await load();
    }
  };

  return (
    <div style={FONT} className="flex flex-col">
      {/* Blocks list header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">Blocks</p>
        {status !== "idle" && (
          <span role="status" className={`text-[11px] ${status === "error" ? "text-[#b3261e]" : "text-[#616161]"}`}>
            {STATUS_TEXT[status]}
          </span>
        )}
      </div>

      {loading ? (
        <p className="px-4 pb-3 text-[13px] text-[#616161]">Loading blocks…</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void reorder(e)}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="mx-3 space-y-1">
              {blocks.map((b) => (
                <BlockRowItem
                  key={b.id}
                  block={b}
                  selected={b.id === selectedId}
                  onSelect={() => {
                    setSelectedId(b.id);
                    setTab("content");
                  }}
                  onDelete={() => void deleteBlock(b.id)}
                />
              ))}
              {blocks.length === 0 && <li className="px-1 py-2 text-[13px] text-[#616161]">No blocks yet.</li>}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Add block — single-type sections add directly; others get a picker */}
      <div className="px-3 pb-3 pt-2">
        {allowed.length === 1 ? (
          <button
            type="button"
            onClick={() => void addBlock(allowed[0])}
            disabled={blocks.length >= 1}
            className={`w-full cursor-pointer rounded-lg border border-[#8a8a8a] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            {blocks.length >= 1 ? "Block limit reached" : "Add block"}
          </button>
        ) : picker ? (
          <div className="rounded-lg border border-[#e3e3e3] bg-white p-2 shadow-sm">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#616161]">Add block</p>
            {allowed.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => void addBlock(type)}
                className={`w-full cursor-pointer rounded px-3 py-2 text-left text-[13px] text-[#303030] transition hover:bg-[#f1f1f1] ${FOCUS}`}
              >
                {labels[type]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPicker(false)}
              className={`w-full cursor-pointer rounded px-3 py-1.5 text-[12px] text-[#616161] transition hover:text-[#303030] ${FOCUS}`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicker(true)}
            className={`w-full cursor-pointer rounded-lg border border-[#8a8a8a] bg-white px-3 py-2 text-[13px] font-medium text-[#303030] transition hover:bg-[#f7f7f7] ${FOCUS}`}
          >
            Add block
          </button>
        )}
      </div>

      {/* Selected block editor — the exact editors the standalone pages use */}
      {selected && (
        <div className="border-t border-[#e3e3e3] px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[13px] font-semibold text-[#303030]">{labels[selected.type]}</p>
            <div className="flex shrink-0 rounded-md border border-[#e3e3e3] p-0.5">
              {(["content", "style"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`cursor-pointer rounded px-2.5 py-1 text-[12px] capitalize transition ${tab === t ? "bg-[#303030] text-white" : "text-[#616161] hover:text-[#303030]"} ${FOCUS}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === "content" ? (
            <ContentEditor block={selected} onChange={(content) => updateSelected({ content })} banner={banner} />
          ) : (
            <StyleEditor block={selected} onChange={(styles) => updateSelected({ styles })} banner={banner} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sortable block row (Shopify block-list style) ───────────────────────────
// Drag handle + label + delete, selected state = solid border like Shopify's
// block rows in the section panel.

function BlockRowItem({
  block,
  selected,
  onSelect,
  onDelete,
}: {
  block: BlockRow;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center rounded-lg border bg-white transition ${
        selected ? "border-[#303030] shadow-sm" : "border-transparent"
      } ${isDragging ? "z-10 opacity-70 shadow-md" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${labels[block.type]} block`}
        className={`cursor-grab touch-none rounded p-2 text-[#8a8a8a] transition hover:text-[#303030] active:cursor-grabbing ${FOCUS}`}
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="3" r="1.4" />
          <circle cx="9" cy="3" r="1.4" />
          <circle cx="3" cy="8" r="1.4" />
          <circle cx="9" cy="8" r="1.4" />
          <circle cx="3" cy="13" r="1.4" />
          <circle cx="9" cy="13" r="1.4" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className={`min-w-0 flex-1 cursor-pointer truncate py-2 pr-1 text-left text-[13px] text-[#303030] ${
          selected ? "font-medium" : ""
        } ${FOCUS}`}
      >
        {labels[block.type]}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${labels[block.type]} block`}
        className={`mr-1.5 cursor-pointer rounded p-1.5 text-[#8a8a8a] transition hover:bg-[#fef1f0] hover:text-[#b3261e] ${FOCUS}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </li>
  );
}
