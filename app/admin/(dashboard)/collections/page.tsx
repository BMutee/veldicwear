import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminCollectionsClient from "@/components/AdminCollectionsClient";

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
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-5xl">
        <AdminCollectionsClient
          initialCollections={collections}
          allProducts={allProducts}
        />
      </div>
    </main>
  );
}