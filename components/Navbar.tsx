import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-bold tracking-widest text-white"
        >
          VELDIC WEAR
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white hover:text-yellow-400 transition">
            Home
          </Link>

          <Link href="/shop" className="text-white hover:text-yellow-400 transition">
            Shop
          </Link>

          <Link href="/about" className="text-white hover:text-yellow-400 transition">
            About
          </Link>

          <Link href="/contact" className="text-white hover:text-yellow-400 transition">
            Contact
          </Link>
        </nav>

        <button className="rounded border border-white px-4 py-2 text-white transition hover:bg-white hover:text-black md:hidden">
          Menu
        </button>
      </div>
    </header>
  );
}