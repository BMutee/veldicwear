import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminProductsClient from "@/components/AdminProductsClient";
import { PageContainer } from "@/components/admin-ui/primitives";

type ProductVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  costPrice: number | null;
  productId: string;
  cjVariantId: string | null;
};

type ProductImage = {
  id: string;
  color: string | null;
  url: string;
  productId: string;
};

type ProductWithRelations = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  barcode: string | null;
  trackInventory: boolean;
  sellOutOfStock: boolean;
  weight: number | null;
  weightUnit: string | null;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  collectionId: string | null;
  sizeChart?: unknown;
  variants: ProductVariant[];
  images: ProductImage[];
};

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
    <PageContainer wide>
      <AdminProductsClient initialProducts={products} editProductId={edit} />
    </PageContainer>
  );
}
