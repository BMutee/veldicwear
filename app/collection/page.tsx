import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { normalizeImageSrc } from "@/lib/image";

type CollectionWithRelations = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  active: boolean;
  _count: { products: number };
  products: Array<{ image: string }>;
};

export default async function CollectionsIndexPage() {
  const collections: CollectionWithRelations[] = await prisma.collection.findMany({
    include: {
      _count: {
        select: { products: { where: { active: true } } },
      },
      products: {
        take: 1,
        where: { active: true },
        select: { image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allProducts = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true, images: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-ink">
        <div className="section-grounded py-20 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl font-semibold text-bone tracking-tight sm:text-6xl">
              Collections
            </h1>
            <p className="mt-4 max-w-lg font-sans text-lg text-bone/60">
              Curated selections for every ground you cover.
            </p>
          </div>
        </div>
      </section>

      {/* Collections grid */}
      {collections.length > 0 ? (
        <section className="section-grounded py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collection/${collection.slug}`}
                className="group overflow-hidden border border-stone/10 bg-white shadow-card rounded-lg transition-all duration-300 hover:border-moss hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="aspect-[16/9] overflow-hidden bg-ink">
                  {collection.products[0]?.image ? (
                    <img
                      src={normalizeImageSrc(collection.products[0].image)}
                      alt={collection.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-display text-2xl font-semibold text-bone/20 uppercase tracking-widest">
                        {collection.name.slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl font-semibold text-ink transition-colors duration-150 group-hover:text-moss">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="mt-1 font-sans text-sm text-stone line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="mt-3 font-mono text-xs text-stone uppercase tracking-wider">
                    {collection._count.products} product{collection._count.products !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="section-grounded py-16">
          <div className="border border-stone/10 bg-white py-16 shadow-card rounded-lg text-center">
            <p className="font-sans text-stone">No collections yet. Check back soon.</p>
            <Link
              href="/shop"
              className="btn-outline mt-4 cursor-pointer"
            >
              Browse all products &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Featured products */}
      {allProducts.length > 0 && (
        <section className="section-grounded pb-16">
          <h2 className="mb-8 font-display text-3xl font-semibold text-ink">
            All products
          </h2>
          <ProductGrid products={allProducts} />
          <div className="mt-8 text-center">
            <Link
              href="/shop"
              className="btn-outline cursor-pointer"
            >
              View all products
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}