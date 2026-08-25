import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminBlocksClient from "@/components/AdminBlocksClient";

const FEATURED_SECTION_KEY = "featured-products";

// FeaturedProducts is now a manually-curated FEATURED_PRODUCTS block owned by
// SiteSection("featured-products") via `sectionKey`. This page is the block
// editor bound to that section. The legacy SiteSection("featured-products")
// content row is left in place but UNREAD — the same "documented as unused,
// not deleted" pattern as the hero/banner migrations.
export default async function AdminFeaturedProductsPage() {
  await requireAdmin();

  const section = await prisma.siteSection.findUnique({
    where: { key: FEATURED_SECTION_KEY },
    select: { key: true },
  });
  if (!section) throw new Error(`Missing SiteSection("${FEATURED_SECTION_KEY}")`);

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink">
      <div className="mx-auto max-w-7xl">
        <AdminBlocksClient sectionKey={FEATURED_SECTION_KEY} />
      </div>
    </main>
  );
}
