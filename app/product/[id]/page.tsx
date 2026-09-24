import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductClient from "@/components/ProductClient";
import ProductGrid from "@/components/ProductGrid";
import Newsletter from "@/components/Newsletter";
import {
  resolveVariantPrice,
  summarizeProductPrice,
} from "@/lib/product-price";
import type { SizeChartData } from "@/lib/size-chart";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, active: true },
    include: {
      variants: true,
      images: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Lowest priced variant drives the price shown before a size is picked — via
  // the same helper the product card uses, so card and page cannot diverge.
  const { minPrice: startingPrice } = summarizeProductPrice(
    product.price,
    product.variants,
  );

  // Fetch related products (excluding current)
  const relatedProducts = await prisma.product.findMany({
    take: 4,
    where: {
      id: { not: product.id },
      active: true,
    },
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="bg-white">
      <div className="section-grounded py-12">
        {/* Product section */}
        <ProductClient
          product={{
            id: product.id,
            name: product.name,
            price: startingPrice,
            compareAtPrice: product.compareAtPrice ?? null,
            image: product.image,
            stock: product.stock,
            description: product.description,
          }}
          sizes={product.variants.map((variant: { size: string; color: string | null; stock: number; price: number | null }) => ({
            size: variant.size,
            color: variant.color ?? undefined,
            stock: variant.stock,
            price: resolveVariantPrice(variant.price, startingPrice),
          }))}
          productImages={product.images.map((img: { id: string; color: string | null; url: string }) => ({
            id: img.id,
            color: img.color,
            url: img.url,
          }))}
          sizeChart={(product.sizeChart ?? null) as SizeChartData | null}
        />

        {/* Complete the fit — cross-sell */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Complete the fit
            </h2>
            <div className="mt-8">
              <ProductGrid products={relatedProducts} />
            </div>
          </section>
        )}

        {/* Newsletter */}
        <div className="mt-24">
          <Newsletter />
        </div>
      </div>
    </main>
  );
}