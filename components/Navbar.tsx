"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CartIcon from "./CartIcon";
import CurrencyPicker from "./CurrencyPicker";
import { useAuth } from "@/hooks/useAuth";
import type { StoreSettings } from "@/lib/store-settings";
import { parseNavbarContent } from "@/lib/navbar-section";
import Reveal from "@/components/motion/Reveal";

export default function Navbar({
  settings,
  content,
  currency,
}: {
  settings?: StoreSettings | null;
  content?: unknown;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const data = parseNavbarContent(content);
  const styles = data.styles;

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

  const storeName = settings?.storeName || "Veldic Wear";

  return (
    <>
      <style>{`\n        .veldic-navbar-link { color: ${styles.linkColor}; }\n        .veldic-navbar-link:hover { color: ${styles.linkHoverColor}; }\n        .veldic-navbar-control { color: ${styles.textColor}; }\n        .veldic-navbar-control:hover { color: ${styles.linkHoverColor}; }\n        .veldic-navbar-row {\n          --navbar-height: ${styles.height.mobile}px;\n          --navbar-pad-x: ${styles.paddingX.mobile}px;\n          --logo-w: 160px;\n        }\n        @media (min-width: 768px) {\n          .veldic-navbar-row {\n            --navbar-height: ${styles.height.desktop}px;\n            --navbar-pad-x: ${styles.paddingX.desktop}px;\n            --logo-w: 240px;\n          }\n        }\n      `}</style>
      <header
        className="veldic-navbar glass-edge sticky top-0 z-50 border-b border-white/60"
        style={{
          backgroundColor: `color-mix(in srgb, ${styles.backgroundColor} 72%, transparent)`,
          color: styles.textColor,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
      {/* Entrance animation (admin-configurable; defaults to load-triggered
          for above-the-fold chrome). Reduced-motion is fully disabled via CSS. */}
      <Reveal type={styles.animation.type} scrollTrigger={styles.animation.scrollTrigger}>
      <div
        className="veldic-navbar-row mx-auto flex max-w-[1280px] items-center justify-between"
        style={{
          minHeight: "var(--navbar-height)",
          paddingLeft: "var(--navbar-pad-x)",
          paddingRight: "var(--navbar-pad-x)",
        }}
      >
        {/* Wordmark — display (Space Grotesk). Renders the store logo if set,
            otherwise falls back to the text wordmark. */}
        {settings?.logo?.trim() && !logoFailed ? (
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-ink"
            aria-label={storeName}
          >
            {/* Width-driven sizing — store logos are usually wide wordmarks,
                so the width is explicit (160px mobile / 240px desktop) and the
                height follows the image's own aspect ratio. A max-height cap
                guards against tall/square logo files. */}
            <Image
              src={settings.logo}
              alt={storeName}
              width={1881}
              height={279}
              priority
              unoptimized
              onError={() => setLogoFailed(true)}
              className="object-contain"
              style={{ width: "var(--logo-w)", height: "auto", maxHeight: "calc(var(--navbar-height) - 12px)" }}
            />
          </Link>
        ) : (
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-ink"
          >
            {storeName}
          </Link>
        )}

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {data.navLinks.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="veldic-navbar-link group relative font-sans text-sm cursor-pointer transition-colors duration-150">
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-moss transition-all duration-150 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Desktop Right Icons */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="veldic-navbar-control transition-colors duration-150 cursor-pointer"
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
              className="veldic-navbar-control flex items-center gap-2 font-sans text-sm transition-colors duration-150 cursor-pointer"
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
              className="veldic-navbar-control transition-colors duration-150 cursor-pointer"
              aria-label="Account"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
              </svg>
            </Link>
          )}

          {/* Currency */}
          <CurrencyPicker initialCurrency={currency} />

          {/* Cart */}
          <CartIcon />
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="veldic-navbar-control md:hidden cursor-pointer"
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
      </Reveal>

      {/* Expanding Search Bar */}
      {showSearch && (
        <div className="hidden border-t border-ink/10 px-6 py-4 md:block">
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full border border-ink/15 bg-white/80 px-4 py-2.5 font-sans text-sm text-ink shadow-inner outline-none backdrop-blur transition-colors duration-150 placeholder:text-stone/70 focus:border-moss focus:bg-white/95"
                minLength={2}
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-moss px-3 py-2.5 text-white transition-colors duration-150 hover:bg-moss-hover cursor-pointer"
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
        <div className="border-t border-ink/10 bg-white/75 px-6 py-6 space-y-6 backdrop-blur-xl md:hidden">
          {data.navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}-mobile`}
              onClick={() => setOpen(false)}
              href={link.href}
              className="veldic-navbar-link block font-display text-lg transition-colors duration-150 cursor-pointer"
            >
              {link.label}
            </Link>
          ))}

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
              className="flex-1 border border-ink/15 bg-white/80 px-4 py-2 font-sans text-sm text-ink outline-none shadow-inner transition-colors duration-150 focus:border-moss placeholder:text-stone/70"
              minLength={2}
            />
            <button
              type="submit"
              className="bg-moss px-5 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-moss-hover cursor-pointer"
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
                className="flex items-center gap-3 font-sans text-sm text-ink/80 transition-colors duration-150 hover:text-moss"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-8 8-8s8 4 8 8" />
                </svg>
                <span>Hello, {greetingName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="block font-sans text-sm text-ink/80 transition-colors duration-150 hover:text-moss cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              onClick={() => setOpen(false)}
              href="/login"
              className="flex items-center gap-3 font-sans text-sm text-ink/80 transition-colors duration-150 hover:text-moss pt-2"
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
            className="flex items-center gap-3 font-sans text-sm text-ink/80 transition-colors duration-150 hover:text-moss pt-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
          </Link>
        {/* Mobile Currency */}
          <div className="pt-2">
            <CurrencyPicker variant="mobile" initialCurrency={currency} />
          </div>
        </div>
      )}
      </header>
    </>
  );
}