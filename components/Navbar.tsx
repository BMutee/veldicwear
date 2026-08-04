"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartIcon from "./CartIcon";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const greetingName = user
    ? user.firstName?.trim() || user.name?.trim() || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "";

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const navLink =
    "text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer";

  return (
    <header className="bg-nav sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 md:px-16">
        {/* Wordmark — display (Space Grotesk) */}
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-bone"
        >
          Veldic<span className="text-bone/50">Wear</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/shop" className={`group relative font-sans text-sm ${navLink}`}>
            Shop
            {/* Moss underline */}
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-moss transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link href="/collection" className={`group relative font-sans text-sm ${navLink}`}>
            Collections
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-moss transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link href="/about" className={`group relative font-sans text-sm ${navLink}`}>
            About
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-moss transition-all duration-150 group-hover:w-full" />
          </Link>
        </nav>

        {/* Desktop Right Icons */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Account */}
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
              aria-label="Account"
            >
              <span className="hidden lg:inline">Hello, {greetingName}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
              aria-label="Account"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
              </svg>
            </Link>
          )}

          {/* Cart */}
          <CartIcon />
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-bone cursor-pointer"
          aria-label="Menu"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Expanding Search Bar */}
      {showSearch && (
        <div className="hidden border-t border-white/10 px-6 py-4 md:block">
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full border border-white/20 bg-ink px-4 py-2.5 font-sans text-sm text-white outline-none transition-colors duration-150 focus:border-white placeholder:text-white/40"
                minLength={2}
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white px-3 py-2.5 text-ink transition-colors duration-150 hover:bg-white/90 cursor-pointer"
                aria-label="Search submit"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-white/10 px-6 py-6 space-y-6 md:hidden">
          <Link
            onClick={() => setOpen(false)}
            href="/shop"
            className="block font-display text-lg text-bone/80 transition-colors duration-150 hover:text-bone"
          >
            Shop
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/collection"
            className="block font-display text-lg text-bone/80 transition-colors duration-150 hover:text-bone"
          >
            Collections
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/about"
            className="block font-display text-lg text-bone/80 transition-colors duration-150 hover:text-bone"
          >
            About
          </Link>

          {/* Mobile Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim().length >= 2) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                setOpen(false);
                setSearchQuery("");
              }
            }}
            className="flex gap-0 pt-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 border border-white/20 bg-ink px-4 py-2 font-sans text-sm text-white outline-none transition-colors duration-150 focus:border-white placeholder:text-white/40"
              minLength={2}
            />
            <button
              type="submit"
              className="bg-white px-5 py-2 text-xs font-medium text-ink transition-colors duration-150 hover:bg-white/90 cursor-pointer"
            >
              Go
            </button>
          </form>

          {/* Mobile Account */}
          {user ? (
            <div className="space-y-4 pt-2">
              <Link
                onClick={() => setOpen(false)}
                href="/account"
                className="flex items-center gap-3 font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
                </svg>
                <span>Hello, {greetingName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="block font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              onClick={() => setOpen(false)}
              href="/login"
              className="flex items-center gap-3 font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone pt-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
              </svg>
              Login / Register
            </Link>
          )}

          {/* Mobile Cart */}
          <Link
            onClick={() => setOpen(false)}
            href="/cart"
            className="flex items-center gap-3 font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone pt-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
          </Link>
        </div>
      )}
    </header>
  );
}