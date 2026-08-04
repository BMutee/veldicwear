import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/ProductGrid";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="section-grounded py-12 sm:py-16">
        <div className="border-b border-stone/10 pb-6">
          <p className="eyebrow">Collection</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Shop all
          </h1>
          <p className="mt-2 font-sans text-sm text-stone">
            Premium lifestyle & activewear — built for every journey.
          </p>
        </div>

        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
      </div>
    </main>
  );
}