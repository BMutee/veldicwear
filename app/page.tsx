import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <h1 className="text-3xl font-bold tracking-wide">
          <Link href="/">Veldic Wear</Link>
        </h1>

        <div className="flex gap-8">
          <Link href="/shop" className="hover:text-yellow-400 transition">
            Shop
          </Link>

          <Link href="/about" className="hover:text-yellow-400 transition">
            About
          </Link>

          <Link href="/contact" className="hover:text-yellow-400 transition">
            Contact
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center text-center px-6">
        <h2 className="text-6xl font-extrabold leading-tight">
          Elevate Your Style
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-gray-300">
          Discover premium fashion crafted for modern luxury. Timeless
          collections, exceptional quality, and effortless elegance.
        </p>

        <div className="mt-10 flex gap-5">
          <Link
            href="/shop"
            className="rounded-md bg-yellow-500 px-8 py-4 font-semibold text-black transition hover:bg-yellow-400"
          >
            Shop Now
          </Link>

          <Link
            href="/collection"
            className="rounded-md border border-white px-8 py-4 font-semibold transition hover:bg-white hover:text-black"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="bg-white py-20 text-black">
        <div className="mx-auto max-w-4xl px-8 text-center">
          <h3 className="text-4xl font-bold">About Veldic Wear</h3>

          <p className="mt-6 text-lg leading-8 text-gray-700">
            Veldic Wear is a premium clothing brand focused on timeless design,
            exceptional quality, and modern elegance. Our goal is to create
            clothing that inspires confidence and style.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400">
        © 2026 Veldic Wear. All rights reserved.
      </footer>
    </main>
  );
}