"use client";

// ─── Editor event bus (§5.3) ─────────────────────────────────────────────────
// Cosmetic/coordination events inside the editor host, kept deliberately
// separate from the render/morph pipeline. The preview iframe communicates via
// postMessage (see components/SectionHighlighter.tsx); this bus coordinates
// the host-side panes.

type Handler = (payload: unknown) => void;

const listeners = new Map<string, Set<Handler>>();

export const EditorEvents = {
  SelectionChanged: "selection:changed",
  DocMutated: "doc:mutated",
  DocSaved: "doc:saved",
  SaveError: "save:error",
  PreviewRefreshed: "preview:refreshed",
} as const;

export function on(event: string, handler: Handler): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler);
  return () => set?.delete(handler);
}

export function emit(event: string, payload?: unknown): void {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      /* a broken subscriber must never break the bus */
    }
  });
}

/** postMessage helpers toward the preview iframe (same-origin only). */
export function postToFrame(
  frame: HTMLIFrameElement | null,
  message: { type: string; [key: string]: unknown }
): void {
  try {
    frame?.contentWindow?.postMessage(message, window.location.origin);
  } catch {
    /* frame not ready */
  }
}
