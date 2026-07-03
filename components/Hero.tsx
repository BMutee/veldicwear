import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex min-h-[90vh] items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-black px-6">
      <div className="max-w-4xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-yellow-400">
          Premium Fashion
        </p>

        <h1 className="text-5xl font-extrabold leading-tight text-white md:text-7xl">
          Elevate Your Style
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          Premium clothing designed for confidence, comfort, and timeless
          elegance.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/shop"
            className="rounded-md bg-yellow-500 px-8 py-4 font-semibold text-black transition hover:bg-yellow-400"
          >
            Shop Now
          </Link>

          <Link
            href="/collection"
            className="rounded-md border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-black"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    </section>
  );
}