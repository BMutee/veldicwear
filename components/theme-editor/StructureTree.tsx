"use client";

// ─── Structure tree (§7.2 — the "sections" pane) ──────────────────────────────
// Lists the template document's sections in render order with their nested
// blocks. Supports:
//   click        → select (opens the settings panel for that section/block)
//   drag & drop  → reorder sections (plus ↑/↓ buttons as an a11y fallback)
//   eye toggle   → hide/show a section (stays in the document, dimmed in preview)
//   trash        → remove a section (unless its definition is locked)
// Locked (core) sections show a lock badge and cannot be deleted; their static
// blocks show a "Locked" pill — settings editable, position fixed.

import { useRef, useState } from "react";
import type { SectionDef, TemplateDoc } from "@/lib/theme/types";
import { getBlockDef } from "@/lib/theme/definitions/blocks";
import { t } from "@/lib/theme/locales";
import type { Selection } from "./selection";

export default function StructureTree({
  doc,
  defs,
  selection,
  onSelect,
  onReorder,
  onToggleHidden,
  onRemoveSection,
}: {
  doc: TemplateDoc;
  defs: SectionDef[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleHidden: (sectionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const defByType = new Map(defs.map((def) => [def.type, def]));

  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null && dragIndex !== targetIndex) onReorder(dragIndex, targetIndex);
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
  };

  return (
    <ul role="list" className="space-y-1" aria-label="Homepage sections">
      {doc.order.map((sectionId, index) => {
        const instance = doc.sections[sectionId];
        if (!instance) return null;
        const def = defByType.get(instance.type);
        if (!def) return null;

        const selected =
          (selection?.kind === "section" && selection.id === sectionId) ||
          (selection?.kind === "block" && selection.sectionId === sectionId);
        const hidden = instance.hidden ?? false;
        const dropActive = dropIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <li
            key={sectionId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragEnter={() => {
              dragCounter.current += 1;
              setDropIndex(index);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
              dragCounter.current -= 1;
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
              dragCounter.current = 0;
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            className={dropActive ? "border-t-2 border-t-moss" : ""}
          >
            <div
              className={`group rounded-lg border transition-colors duration-150 ${
                selected ? "border-moss/50 bg-moss/5" : "border-transparent hover:bg-bone"
              }`}
            >
              <div className="flex items-center gap-1 px-1.5 py-1.5">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-stone/50 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <circle cx="9" cy="6" r="1.3" />
                    <circle cx="15" cy="6" r="1.3" />
                    <circle cx="9" cy="12" r="1.3" />
                    <circle cx="15" cy="12" r="1.3" />
                    <circle cx="9" cy="18" r="1.3" />
                    <circle cx="15" cy="18" r="1.3" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "section", id: sectionId })}
                  aria-current={selected ? "true" : undefined}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col rounded-md px-1.5 py-0.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
                >
                  <span className={`truncate text-[13px] font-medium ${hidden ? "text-stone line-through" : "text-ink"}`}>
                    {t(def.name)}
                  </span>
                  {def.locked && (
                    <span className="mt-0.5 inline-flex w-fit items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-stone">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-2.5 w-2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Core
                    </span>
                  )}
                </button>
                <span className="flex shrink-0 items-center">
                  <TreeButton
                    label={hidden ? `Show ${t(def.name)}` : `Hide ${t(def.name)}`}
                    onClick={() => onToggleHidden(sectionId)}
                  >
                    {hidden ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </TreeButton>
                  {def.locked ? (
                    <span className="flex h-7 w-7 items-center justify-center text-stone/30" title="Core sections cannot be deleted">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                  ) : (
                    <TreeButton label={`Remove ${t(def.name)}`} danger onClick={() => onRemoveSection(sectionId)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </TreeButton>
                  )}
                </span>

              </div>
              {/* Blocks under the selected section */}
              {selected && instance.block_order.length > 0 && (
                <ul role="list" className="mb-1.5 ml-8 space-y-0.5 border-l border-stone/20 pl-2">
                  {instance.block_order.map((blockId) => {
                    const block = instance.blocks[blockId];
                    if (!block) return null;
                    const blockDef = getBlockDef(block.type);
                    const blockSelected = selection?.kind === "block" && selection.id === blockId;
                    const isStatic = block.static ?? false;
                    return (
                      <li key={blockId}>
                        <button
                          type="button"
                          onClick={() => onSelect({ kind: "block", sectionId, id: blockId })}
                          aria-current={blockSelected ? "true" : undefined}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 ${
                            blockSelected ? "bg-moss/10 text-moss" : "text-stone hover:bg-bone hover:text-ink"
                          }`}
                        >
                          {isStatic ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3 shrink-0" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                          )}
                          <span className="truncate">{t(blockDef?.name) || block.type}</span>
                          {isStatic && <span className="ml-auto text-[10px] uppercase tracking-wide text-stone/60">Locked</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TreeButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-stone opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-white hover:text-ink focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-moss/40 ${
        danger ? "hover:!text-clay focus-visible:!ring-clay/40" : ""
      }`}
    >
      {children}
    </button>
  );
}
