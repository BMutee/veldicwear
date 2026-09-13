"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { parseFooterContent } from "@/lib/footer-section";
import type { StoreSettings } from "@/lib/store-settings";
import {
  getStoreSocialLinks,
  getFooterNavLinks,
  DEFAULT_STORE_SETTINGS,
} from "@/lib/store-settings";
import Reveal from "@/components/motion/Reveal";

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
  if (platform === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M18 2H15C13.9 2 13 2.9 13 4v3h-2V4c0-1.1-.9-2-2-2H8.5V7H8c-1.1 0-2 .9-2 2v5.5c0 .55.45 1 1 1h6.5v6h2v-6H18l.5-1V7c0-1.1-.9-2-2-2z" />
      </svg>
    );
  }
  return null;
};

export default function Footer({
  content,
  settings,
}: {
  content?: unknown;
  settings?: StoreSettings | null;
}) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const data = parseFooterContent(content);
  const styles = data.styles;

  // Brand identity, contact, social links, copyright and footer nav now come
  // from the singleton StoreSettings row (edited in the Settings tab). The
  // footer SiteSection content now only carries description, link groups,
  // payment methods and the admin-editable visual styles.
  const base = settings ?? DEFAULT_STORE_SETTINGS;
  const storeName = base.storeName || "Veldic Wear";
  const copyrightText = base.copyrightText || "All rights reserved.";
  const socialLinks = getStoreSocialLinks(settings);
  const footerNavLinks = getFooterNavLinks(settings);

  const cssVars = {
    "--footer-link": styles.linkColor,
    "--footer-link-hover": styles.linkHoverColor,
  } as React.CSSProperties;

  // Contact details that are actually set in store settings.
  const contactItems = [
    { label: "Phone", value: base.phone, href: base.phone ? `tel:${base.phone}` : null },
    { label: "Address", value: base.address, href: null },
  ].filter((c) => c.value);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError(true);
      return;
    }
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "footer" }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      setSubscribed(true);
      setEmail("");
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`\n        .veldic-footer {\n          --footer-pad-top: ${styles.paddingTop.mobile}px;\n          --footer-pad-bottom: ${styles.paddingBottom.mobile}px;\n          --footer-pad-x: ${styles.paddingX.mobile}px;\n        }\n        @media (min-width: 768px) {\n          .veldic-footer {\n            --footer-pad-top: ${styles.paddingTop.desktop}px;\n            --footer-pad-bottom: ${styles.paddingBottom.desktop}px;\n            --footer-pad-x: ${styles.paddingX.desktop}px;\n          }\n        }\n      `}</style>
      <footer
        className="veldic-footer glass-edge"
        style={{
          backgroundColor: `color-mix(in srgb, ${styles.backgroundColor} 88%, transparent)`,
          color: styles.textColor,
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          paddingTop: "var(--footer-pad-top)",
          paddingBottom: "var(--footer-pad-bottom)",
          paddingLeft: "var(--footer-pad-x)",
          paddingRight: "var(--footer-pad-x)",
          ...cssVars,
        }}
      >
      {/* Entrance animation (admin-configurable); reduced-motion is fully
          disabled via CSS regardless of this setting. */}
      <Reveal type={styles.animation.type} scrollTrigger={styles.animation.scrollTrigger}>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight">
              {storeName}
            </Link>
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-stone">
              {data.brandDescription}
            </p>

            {contactItems.length > 0 && (
              <div className="mt-6">
                <h4 className="eyebrow">Contact</h4>
                <ul className="mt-3 space-y-1.5 font-sans text-sm text-stone">
                  {contactItems.map((c) => (
                    <li key={c.label}>
                      {c.href ? (
                        <a href={c.href} className="footer-link cursor-pointer" aria-label={`${c.label}: ${c.value}`}>
                          {c.value}
                        </a>
                      ) : (
                        <span className="opacity-60">{c.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubscribe} className="mt-6 flex gap-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                }}
                placeholder="Enter your email"
                required
                aria-label="Email address"
                className="flex-1 border-b border-ink/20 bg-transparent px-0 py-2.5 font-sans text-sm outline-none transition-colors duration-150 placeholder:text-stone/60 focus:border-moss"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-moss px-5 py-2.5 font-sans text-xs font-medium text-white transition-colors duration-150 hover:bg-moss-hover disabled:cursor-wait disabled:opacity-70 cursor-pointer"
              >
                {subscribed ? "Done!" : submitting ? "…" : "Subscribe"}
              </button>
            </form>
            {error && !subscribed && (
              <p className="mt-2 font-sans text-xs text-clay" role="alert">
                Something went wrong. Please check your email and try again.
              </p>
            )}
          </div>

          {data.shopLinks && data.shopLinks.length > 0 && (
            <div>
              <h4 className="eyebrow">Shop</h4>
              <ul className="mt-5 space-y-3">
                {data.shopLinks.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="footer-link font-sans text-sm cursor-pointer">
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
                    <Link href={link.href} className="footer-link font-sans text-sm cursor-pointer">
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
                      <Link href={link.href} className="footer-link font-sans text-sm cursor-pointer">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link cursor-pointer"
                    aria-label={link.ariaLabel}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row">
          <p className="font-sans text-xs text-stone/70">
            &copy; {new Date().getFullYear()} {storeName}. {copyrightText}
          </p>

          {data.paymentMethods && data.paymentMethods.length > 0 && (
            <div className="flex items-center gap-3 text-stone/70">
              {data.paymentMethods.map((method, i) => (
                <span key={i} className="font-mono text-xs tracking-wide">{method}</span>
              ))}
            </div>
          )}

          {footerNavLinks.length > 0 && (
            <div className="flex gap-6">
              {footerNavLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="footer-link font-sans text-xs cursor-pointer"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </Reveal>
      </footer>
    </>
  );
}

