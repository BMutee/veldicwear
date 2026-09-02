// ─── Global theme settings schema (config/settings_schema.json equivalent) ──
// This file is the FORM DEFINITION — it never contains user data. The values
// live in the StoreSettings row (the settings_data.json equivalent) and are
// overlaid at render time through the same resolveSettings() used for section
// and block settings. Adding a control here instantly adds it to the editor's
// "Theme settings" panel — zero editor-UI code.

import type { ThemeSettingsGroup } from "./types";

export const THEME_SETTINGS_SCHEMA: ThemeSettingsGroup[] = [
  {
    name: "t:settings.groups.brand",
    settings: [
      { id: "storeName", label: "t:settings.store_name", type: "text", default: "VELDIC WEAR" },
      { id: "logo", label: "t:settings.logo", type: "image_picker", info: "Shown in the navbar. Recommended: wide PNG/SVG." },
      {
        id: "currency",
        label: "t:settings.currency",
        type: "select",
        default: "USD",
        options: [
          { value: "USD", label: "USD — US Dollar" },
          { value: "CAD", label: "CAD — Canadian Dollar" },
          { value: "EUR", label: "EUR — Euro" },
        ],
      },
      { id: "currencySymbol", label: "t:settings.currency_symbol", type: "text", default: "$" },
    ],
  },
  {
    name: "t:settings.groups.contact",
    settings: [
      { id: "email", label: "t:settings.email", type: "text", placeholder: "hello@example.com" },
      { id: "phone", label: "t:settings.phone", type: "text", placeholder: "+1 555 000 0000" },
      { id: "address", label: "t:settings.address", type: "text" },
    ],
  },
  {
    name: "t:settings.groups.social",
    settings: [
      { id: "instagram", label: "Instagram", type: "link", placeholder: "https://instagram.com/…" },
      { id: "facebook", label: "Facebook", type: "link", placeholder: "https://facebook.com/…" },
      { id: "twitter", label: "Twitter / X", type: "link", placeholder: "https://x.com/…" },
      { id: "tiktok", label: "TikTok", type: "link", placeholder: "https://tiktok.com/@…" },
      { id: "youtube", label: "YouTube", type: "link", placeholder: "https://youtube.com/@…" },
    ],
  },
  {
    name: "t:settings.groups.footer",
    settings: [
      { id: "copyrightText", label: "t:settings.copyright", type: "text", default: "All rights reserved." },
    ],
  },
];

/** Flat list of every global setting control (for the form interpreter). */
export function themeSettingsDefs() {
  return THEME_SETTINGS_SCHEMA.flatMap((group) => group.settings);
}

/** Ids persisted through PUT /api/admin/settings (footerNavLinks excluded —
 *  it is owned by the dedicated footer editor's JSON payload). */
export function themeSettingsIds(): string[] {
  return themeSettingsDefs().map((def) => def.id);
}
