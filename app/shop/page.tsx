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
  {
    id: 4,
    name: "Premium Sweatpants",
    price: "$39",
  },
  {
    id: 5,
    name: "Oversized Tee",
    price: "$25",
  },
  {
    id: 6,
    name: "Luxury Hoodie",
    price: "$59",
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <h1 className="text-4xl font-bold text-white text-center">
          Shop Collection
        </h1>

        <p className="mt-3 text-center text-white/60">
          Discover premium essentials for modern style
        </p>

        {/* Product Grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              {/* Image placeholder */}
              <div className="h-52 w-full bg-zinc-800 mb-4" />

              <h2 className="text-lg font-semibold text-white">
                {product.name}
              </h2>

              <p className="mt-2 text-white/60">{product.price}</p>

              <Link
                href={`/product/${product.id}`}
                className="mt-4 inline-block text-sm text-yellow-400 hover:text-yellow-300"
              >
                View Product →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}