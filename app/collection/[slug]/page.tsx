import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { normalizeImageSrc } from "@/lib/image";

export default async function SingleCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: { variants: true, images: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="relative bg-ink">
        <div className="section-grounded py-20 sm:py-28">
          <div className="max-w-2xl">
            <Link
              href="/collection"
              className="mb-6 inline-flex items-center gap-1.5 font-sans text-sm text-moss transition-colors duration-150 hover:text-bone"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All collections
            </Link>
            <h1 className="font-display text-5xl font-semibold text-bone tracking-tight sm:text-6xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-4 max-w-lg font-sans text-lg text-bone/60">
                {collection.description}
              </p>
            )}
            {collection.image && (
              <div className="mt-8">
                <img
                  src={normalizeImageSrc(collection.image)}
                  alt={collection.name}
                  className="h-64 w-full max-w-2xl object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-grounded py-16">
        {collection.products.length > 0 ? (
          <>
            <p className="mb-8 font-sans text-sm text-stone">
              {collection.products.length} product{collection.products.length !== 1 ? "s" : ""}
            </p>
            <ProductGrid products={collection.products} />
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="font-sans text-stone">No products in this collection yet.</p>
            <Link
              href="/shop"
              className="btn-outline mt-4 cursor-pointer"
            >
              Browse all products &rarr;
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}