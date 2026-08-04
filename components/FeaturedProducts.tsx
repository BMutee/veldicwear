import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductGrid from "./ProductGrid";

type FeaturedSectionContent = {
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
};

type FeaturedProductsProps = {
  content?: FeaturedSectionContent | null;
};

export default async function FeaturedProducts({ content }: FeaturedProductsProps) {
  const products = await prisma.product.findMany({
    take: 8,
    where: {
      featured: true,
    },
    include: {
      variants: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const displayProducts =
    products.length > 0
      ? products
      : await prisma.product.findMany({
          take: 8,
          include: {
            variants: true,
            images: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

  const title = content?.featuredSectionTitle || "New Arrivals";
  const subtitle = content?.featuredSectionSubtitle || "Considered pieces, built to last.";

  return (
    <section className="px-6 py-24">
      <div className="section-grounded">
        {/* Section header */}
        <div className="mb-16">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h2>
          <p className="mt-3 font-sans text-base text-stone">
            {subtitle}
          </p>
        </div>

        <ProductGrid products={displayProducts} />

        {/* View All link */}
        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="btn-outline cursor-pointer"
          >
            Shop all
            <span className="text-base transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}