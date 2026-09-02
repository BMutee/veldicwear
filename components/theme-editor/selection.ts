// ─── Editor selection (shared across the theme-editor components) ─────────────

export type Selection =
  | { kind: "section"; id: string }
  | { kind: "block"; sectionId: string; id: string }
  | { kind: "theme-settings" }
  | null;
