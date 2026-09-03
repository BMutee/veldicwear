import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminCollectionsClient from "@/components/AdminCollectionsClient";
import { PageContainer } from "@/components/admin-ui/primitives";

export default async function AdminCollectionsPage() {
  await requireAdmin();

  const [collections, allProducts] = await Promise.all([
    prisma.collection.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PageContainer wide>
      <AdminCollectionsClient
        initialCollections={collections}
        allProducts={allProducts}
      />
    </PageContainer>
  );
}