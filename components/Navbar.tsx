"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-light tracking-[0.3em] text-white"
        >
          VELDIC WEAR
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-white/80 hover:text-white transition">
            Home
          </Link>
          <Link href="/shop" className="text-white/80 hover:text-white transition">
            Shop
          </Link>
          <Link href="/collection" className="text-white/80 hover:text-white transition">
            Collection
          </Link>
          <Link href="/contact" className="text-white/80 hover:text-white transition">
            Contact
          </Link>
        </nav>

        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black px-6 py-4 space-y-4">
          <Link onClick={() => setOpen(false)} href="/" className="block text-white/80">
            Home
          </Link>
          <Link onClick={() => setOpen(false)} href="/shop" className="block text-white/80">
            Shop
          </Link>
          <Link onClick={() => setOpen(false)} href="/collection" className="block text-white/80">
            Collection
          </Link>
          <Link onClick={() => setOpen(false)} href="/contact" className="block text-white/80">
            Contact
          </Link>
        </div>
      )}
    </header>
  );
}