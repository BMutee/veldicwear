import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminFooterEditor from "@/components/AdminFooterEditor";
import { FOOTER_DEFAULT_CONTENT, parseFooterContent } from "@/lib/footer-section";
import { getStoreSettings } from "@/lib/settings";

const KEY = "footer";

export default async function AdminFooterPage() {
  await requireAdmin();

  const section = await prisma.siteSection.findUnique({ where: { key: KEY } });
  const content = parseFooterContent(section?.content);
  const updatedAt = section?.updatedAt ?? null;

  let storeName = "Veldic Wear";
  try {
    const settings = await getStoreSettings();
    storeName = settings.storeName || storeName;
  } catch {
    /* keep fallback */
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <AdminFooterEditor
          initialContent={content}
          initialSavedAt={updatedAt ? updatedAt.toISOString() : null}
          defaults={FOOTER_DEFAULT_CONTENT}
          storeName={storeName}
        />
      </div>
    </main>
  );
}
