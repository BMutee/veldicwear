"use client";

import { motion } from "framer-motion";
import { useState, FormEvent, useEffect } from "react";

type NewsletterContent = {
  badge?: string;
  headline?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
  disclaimer?: string;
};

const fallback: NewsletterContent = {
  badge: "Stay connected",
  headline: "Never miss a drop",
  description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
  placeholder: "Enter your email",
  buttonText: "Subscribe",
  successMessage: "You're in! Welcome to the Veldic community.",
  errorMessage: "Please enter a valid email address.",
  disclaimer: "No spam. Unsubscribe anytime."
};

export default function Newsletter({ initialContent }: { initialContent?: NewsletterContent | null }) {
  const [content, setContent] = useState<NewsletterContent | null>(initialContent ?? null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    // Theme document supplies content (app/page.tsx) — legacy fetch is a
    // fallback for prop-less callers only.
    if (initialContent) return;
    fetch("/api/sections/newsletter")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => {});
  }, [initialContent]);

  const data = content || fallback;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter-section" }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="relative overflow-hidden glass-edge bg-white/60 px-6 py-24 backdrop-blur-2xl">
      {/* Decorative color glows (blue / violet / peach) — the glass panel blurs them */}
      <motion.div
        className="absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-moss/15 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-violet-300/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/15 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto max-w-2xl text-center"
      >
        <span className="eyebrow inline-block">
          {data.badge}
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl">
          {data.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-md font-sans text-stone">
          {data.description}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              placeholder={data.placeholder}
              className="w-full border border-ink/15 bg-white/80 px-5 py-4 font-sans text-sm text-ink shadow-inner outline-none backdrop-blur transition-colors placeholder:text-stone/70 focus:border-moss"
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-moss px-8 py-4 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-moss-hover disabled:cursor-wait disabled:opacity-70 cursor-pointer"
          >
            {status === "submitting" ? "Subscribing…" : data.buttonText}
          </button>
        </form>

        {status === "success" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 font-sans text-sm text-moss"
          >
            {data.successMessage}
          </motion.p>
        )}
        {status === "error" && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 font-sans text-sm text-clay"
          >
            {data.errorMessage}
          </motion.p>
        )}

        <p className="mt-6 text-xs text-stone/70">
          {data.disclaimer}
        </p>
      </motion.div>
    </section>
  );
}