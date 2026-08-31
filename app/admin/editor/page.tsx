import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { SECTION_REGISTRY } from "@/lib/section-registry";
import { createPreviewToken } from "@/lib/preview-token";
import AdminEditorClient, { type EditorSection } from "@/components/AdminEditorClient";
import { NAVBAR_DEFAULT_CONTENT, parseNavbarContent } from "@/lib/navbar-section";
import { FOOTER_DEFAULT_CONTENT, parseFooterContent } from "@/lib/footer-section";
import { getStoreSettings } from "@/lib/settings";
import Script from "next/script";

export const dynamic = "force-dynamic";

// ─── Theme editor page ───────────────────────────────────────────────────────
// Loads every registered homepage section plus the global (navbar/footer) and
// store settings, then hands them to the editor client. The "Navbar", "Footer"
// and "Sections" entries in the left tree edit these global pieces inline, so
// the merchant never leaves the theme editor — same as Shopify's global
// header/footer sections.

export default async function AdminEditorPage() {
  await requireAdmin();

  const keys = SECTION_REGISTRY.map((section) => section.key);
  const rows = await prisma.siteSection.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, label: true, published: true, position: true, content: true },
    orderBy: { position: "asc" },
  });

  const initialSections: EditorSection[] = rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    published: row.published,
    position: row.position,
    content: parseContent(row.content),
  }));

  const defs = SECTION_REGISTRY.map((section) => ({
    key: section.key,
    name: section.name,
    description: section.description,
    kind: section.kind,
    deletable: section.deletable,
    fields: section.fields,
    defaultContent: section.defaultContent,
  }));

  // Global sections (navbar/footer) — loaded for inline editing in the panel.
  const [navbarSection, footerSection] = await Promise.all([
    prisma.siteSection.findUnique({ where: { key: "navbar" } }),
    prisma.siteSection.findUnique({ where: { key: "footer" } }),
  ]);

  let storeName = "Veldic Wear";
  try {
    storeName = (await getStoreSettings()).storeName || storeName;
  } catch {
    /* keep fallback */
  }

  return (
    <>
      <AdminEditorClient
        initialSections={initialSections}
        defs={defs}
        previewToken={createPreviewToken()}
        navbar={{
          content: parseNavbarContent(navbarSection?.content),
          savedAt: navbarSection?.updatedAt ? navbarSection.updatedAt.toISOString() : null,
          defaults: NAVBAR_DEFAULT_CONTENT,
        }}
        footer={{
          content: parseFooterContent(footerSection?.content),
          savedAt: footerSection?.updatedAt ? footerSection.updatedAt.toISOString() : null,
          defaults: FOOTER_DEFAULT_CONTENT,
        }}
        storeName={storeName}
      />
      {/* Cloudinary Upload Widget — the inline hero editor's image picker relies on it,
          and this page sits outside the (dashboard) layout that normally loads it. */}
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
    </>
  );
}

function parseContent(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
