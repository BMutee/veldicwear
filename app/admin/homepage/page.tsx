import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminBlocksClient from "@/components/AdminBlocksClient";

const HERO_SECTION_KEY = "hero";

// The Hero is now a Block owned by SiteSection("hero") via `sectionKey`.
// This page is the block editor bound to that section. The legacy
// `SiteSection("hero")` content row is left in place but UNREAD — the same
// "documented as unused, not deleted" pattern as the old `Homepage` model.
export default async function AdminHomepagePage() {
  await requireAdmin();

  const section = await prisma.siteSection.findUnique({
    where: { key: HERO_SECTION_KEY },
    select: { key: true },
  });
  if (!section) throw new Error(`Missing SiteSection("${HERO_SECTION_KEY}")`);

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <AdminBlocksClient sectionKey={HERO_SECTION_KEY} />
      </div>
    </main>
  );
}

