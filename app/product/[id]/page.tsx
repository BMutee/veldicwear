import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductClient from "@/components/ProductClient";
import ProductGrid from "@/components/ProductGrid";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      images: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Find lowest variant price for initial display
  const variantPrices = product.variants.map(
    (variant: { price: number | null }) => (variant.price ?? product.price),
  );
  const startingPrice =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : product.price;

  // Fetch related products (excluding current)
  const relatedProducts = await prisma.product.findMany({
    take: 4,
    where: {
      id: { not: product.id },
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
            price: variant.price ?? product.price,
          }))}
          productImages={product.images.map((img: { id: string; color: string | null; url: string }) => ({
            id: img.id,
            color: img.color,
            url: img.url,
          }))}
        />

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              You might also like
            </h2>
            <div className="mt-8">
              <ProductGrid products={relatedProducts} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}