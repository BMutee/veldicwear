import { requireAdmin } from "@/lib/admin-guard";
import { getTemplateDocument } from "@/lib/theme/document";
import { themeSettingsIds } from "@/lib/theme/settings-schema";
import { getStoreSettings } from "@/lib/settings";
import { createPreviewToken } from "@/lib/preview-token";
import ThemeEditor from "@/components/theme-editor/ThemeEditor";
import type { SettingValues } from "@/lib/theme/types";

export const dynamic = "force-dynamic";

// ─── Theme editor page ───────────────────────────────────────────────────────
// Loads the homepage template document (with one-time legacy migration on
// first deploy), the global theme settings, and mints a short-lived preview
// token for the design-mode iframe. Everything else — forms, structure tree,
// autosave, live preview — is driven by the schema definitions.

export default async function AdminEditorPage() {
  await requireAdmin();

  const [{ doc, source }, storeSettings] = await Promise.all([
    getTemplateDocument(),
    getStoreSettings().catch(() => null),
  ]);

  // Hand the editor only the settings the theme schema owns; the full
  // StoreSettings object remains authoritative server-side.
  const initialSettings: SettingValues = {};
  if (storeSettings) {
    const bag = storeSettings as unknown as Record<string, unknown>;
    for (const id of themeSettingsIds()) {
      if (bag[id] !== undefined && bag[id] !== null) initialSettings[id] = bag[id] as string;
    }
  }

  return (
    <ThemeEditor
      initialDoc={doc}
      initialSettings={initialSettings}
      previewToken={createPreviewToken()}
      docSource={
        source === "database"
          ? "Stored template document"
          : source === "migrated"
            ? "Migrated from legacy sections (saved on first edit)"
            : "Canonical default (database unavailable)"
      }
    />
  );
}
