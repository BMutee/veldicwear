import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "../../../lib/prisma";
import type { Prisma } from "@prisma/client";
import AdminProductsClient from "../../../components/AdminProductsClient";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    images: true;
  };
}>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdmin();

  const { edit } = await searchParams;

  const products: ProductWithRelations[] = await prisma.product.findMany({
    include: {
      variants: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-7xl">
        <AdminProductsClient initialProducts={products} editProductId={edit} />
      </div>
    </main>
  );
}
