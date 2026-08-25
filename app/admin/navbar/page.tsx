import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminNavbarEditor from "@/components/AdminNavbarEditor";
import { NAVBAR_DEFAULT_CONTENT, parseNavbarContent } from "@/lib/navbar-section";
import { getStoreSettings } from "@/lib/settings";

export default async function AdminNavbarPage() {
  await requireAdmin();
  const section = await prisma.siteSection.findUnique({ where: { key: "navbar" } });
  const settings = await getStoreSettings();
  const updatedAt = section?.updatedAt ?? null;
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <AdminNavbarEditor
          initialContent={parseNavbarContent(section?.content)}
          initialSavedAt={updatedAt ? updatedAt.toISOString() : null}
          defaults={NAVBAR_DEFAULT_CONTENT}
          storeName={settings.storeName || "Veldic Wear"}
        />
      </div>
    </main>
  );
}
