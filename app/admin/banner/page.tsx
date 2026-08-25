import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminBlocksClient from "@/components/AdminBlocksClient";

const BANNER_SECTION_KEY = "banner";

// The Banner is now a Block (type HERO) owned by SiteSection("banner") via
// `sectionKey` — "Banner = Hero without a mandatory background image". This
// page is the block editor bound to that section. The legacy
// `SiteSection("banner")` content row is left in place but UNREAD — the same
// "documented as unused, not deleted" pattern as the hero migration.
export default async function AdminBannerPage() {
  await requireAdmin();

  const section = await prisma.siteSection.findUnique({
    where: { key: BANNER_SECTION_KEY },
    select: { key: true },
  });
  if (!section) throw new Error(`Missing SiteSection("${BANNER_SECTION_KEY}")`);

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <AdminBlocksClient sectionKey={BANNER_SECTION_KEY} />
      </div>
    </main>
  );
}