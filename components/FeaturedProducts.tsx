import Link from "next/link";

const products = [
  {
    id: 1,
    name: "Classic Black Hoodie",
    price: "$49",
  },
  {
    id: 2,
    name: "Minimal White Tee",
    price: "$29",
  },
  {
    id: 3,
    name: "Urban Street Jacket",
    price: "$89",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="bg-black px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          Featured Products
        </h2>

        <p className="mt-4 text-center text-white/60">
          Hand-picked essentials for modern style
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <div className="h-48 w-full bg-zinc-800 mb-4" />

              <h3 className="text-lg font-semibold text-white">
                {product.name}
              </h3>

              <p className="mt-2 text-white/60">{product.price}</p>

              <Link
                href="/product"
                className="mt-4 inline-block text-sm text-yellow-400 hover:text-yellow-300"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}