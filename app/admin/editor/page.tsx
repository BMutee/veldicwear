import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { SECTION_REGISTRY } from "@/lib/section-registry";
import { createPreviewToken } from "@/lib/preview-token";
import AdminEditorClient, { type EditorSection } from "@/components/AdminEditorClient";

export const dynamic = "force-dynamic";

// ─── Theme editor page ───────────────────────────────────────────────────────
// Loads every registered homepage section with its saved content and hands it
// to the three-pane editor client (section tree / live preview / settings).
// The preview token lets the iframe render hidden sections for the admin.

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

  return <AdminEditorClient initialSections={initialSections} defs={defs} previewToken={createPreviewToken()} />;
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
