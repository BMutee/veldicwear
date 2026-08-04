"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

type SocialLink = {
  platform: string;
  href: string;
  ariaLabel: string;
};

type FooterContent = {
  brandName?: string;
  brandDescription?: string;
  shopLinks?: FooterLink[];
  supportLinks?: FooterLink[];
  companyLinks?: FooterLink[];
  socialLinks?: SocialLink[];
  paymentMethods?: string[];
  bottomLinks?: FooterLink[];
};

const fallback: FooterContent = {
  brandName: "Veldic Wear",
  brandDescription:
    "Premium lifestyle & activewear for every journey. Wear the ground you cover.",
  shopLinks: [
    { label: "All Products", href: "/shop" },
    { label: "Collections", href: "/collection" },
    { label: "New Arrivals", href: "/shop?category=new-arrivals" },
    { label: "Limited Edition", href: "/shop?category=limited" },
  ],
  supportLinks: [
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping" },
    { label: "Size Guide", href: "/size-guide" },
  ],
  companyLinks: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  socialLinks: [
    { platform: "Instagram", href: "https://instagram.com/veldicwear", ariaLabel: "Instagram" },
    { platform: "Twitter", href: "https://twitter.com/veldicwear", ariaLabel: "Twitter / X" },
    { platform: "TikTok", href: "https://tiktok.com/@veldicwear", ariaLabel: "TikTok" },
    { platform: "YouTube", href: "https://youtube.com/@veldicwear", ariaLabel: "YouTube" },
  ],
  paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"],
  bottomLinks: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

const SocialIcon = ({ platform }: { platform: string }) => {
  if (platform === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (platform === "Twitter") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 4l11.733 16h4.267l-11.733 -16zM4 20l6.768 -6.768M17.232 4.768l-6.768 6.768" />
      </svg>
    );
  }
  if (platform === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  if (platform === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    );
  }
  return null;
};

export default function Footer() {
  const [content, setContent] = useState<FooterContent | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/sections/footer")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => {});
  }, []);

  const data = content || fallback;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 0) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-nav px-6 py-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight text-bone"
            >
              {data.brandName}
            </Link>
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-bone/60">
              {data.brandDescription}
            </p>

            <form onSubmit={handleSubscribe} className="mt-6 flex gap-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 border-b border-bone/20 bg-transparent px-0 py-2.5 font-sans text-sm text-bone outline-none transition-colors duration-150 placeholder:text-bone/50 focus:border-moss"
              />
              <button
                type="submit"
className="bg-white px-5 py-2.5 font-sans text-xs font-medium text-ink transition-colors duration-150 hover:bg-white/90 cursor-pointer"
              >
                {subscribed ? "Done!" : "Subscribe"}
              </button>
            </form>
          </div>

          {data.shopLinks && data.shopLinks.length > 0 && (
            <div>
              <h4 className="eyebrow">Shop</h4>
              <ul className="mt-5 space-y-3">
                {data.shopLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-bone/60 transition-colors duration-150 hover:text-bone cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.supportLinks && data.supportLinks.length > 0 && (
            <div>
              <h4 className="eyebrow">Support</h4>
              <ul className="mt-5 space-y-3">
                {data.supportLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-bone/60 transition-colors duration-150 hover:text-bone cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            {data.companyLinks && data.companyLinks.length > 0 && (
              <>
                <h4 className="eyebrow">Company</h4>
                <ul className="mt-5 space-y-3">
                  {data.companyLinks.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="font-sans text-sm text-bone/60 transition-colors duration-150 hover:text-bone cursor-pointer"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {data.socialLinks && data.socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {data.socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bone/60 transition-colors duration-150 hover:text-bone cursor-pointer"
                    aria-label={link.ariaLabel}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-bone/10 pt-8 sm:flex-row">
          <p className="font-sans text-xs text-bone/40">
            &copy; {new Date().getFullYear()} {data.brandName}. All rights reserved.
          </p>

          {data.paymentMethods && data.paymentMethods.length > 0 && (
            <div className="flex items-center gap-3 text-bone/40">
              {data.paymentMethods.map((method, i) => (
                <span key={i} className="font-mono text-xs tracking-wide">{method}</span>
              ))}
            </div>
          )}

          {data.bottomLinks && data.bottomLinks.length > 0 && (
            <div className="flex gap-6">
              {data.bottomLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="font-sans text-xs text-bone/40 transition-colors duration-150 hover:text-bone cursor-pointer"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}