// Shared registry of mounted inline block editors so the theme editor's
// top-bar "Save" can flush every block's pending autosave in one go. Without
// this, block-section edits are only saved when each block's debounce fires,
// and the top-bar Save appears disabled for them.

type Flusher = () => Promise<unknown>;

const flushers = new Map<string, Flusher>();

/** Register a mounted block editor's flush fn; returns an unregister fn. */
export function registerBlockFlusher(key: string, flusher: Flusher): () => void {
  flushers.set(key, flusher);
  return () => {
    if (flushers.get(key) === flusher) flushers.delete(key);
  };
}

/** Flush every mounted inline block's pending autosave. Throws if any fails. */
export async function flushAllBlocks(): Promise<void> {
  const results = await Promise.allSettled([...flushers.values()].map((fn) => fn()));
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("One or more blocks failed to save.");
  }
}

// ─── Global panels (Navbar / Footer) ─────────────────────────────────────────
// The same concept drives the embedded global editors: register a flusher that
// persists the panel's latest content, and the theme editor's top-bar Save
// flushes everything at once.

const panelFlushers = new Map<string, Flusher>();

export function registerPanelFlusher(key: string, flusher: Flusher): () => void {
  panelFlushers.set(key, flusher);
  return () => {
    if (panelFlushers.get(key) === flusher) panelFlushers.delete(key);
  };
}

export async function flushAllPanels(): Promise<void> {
  const results = await Promise.allSettled([...panelFlushers.values()].map((fn) => fn()));
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("One or more panels failed to save.");
  }
}