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
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 500);
  };

  return (
    <section className="relative overflow-hidden bg-ink px-6 py-24">
      {/* Decorative moss glow */}
      <motion.div
        className="absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-moss/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-moss/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto max-w-2xl text-center"
      >
        <span className="eyebrow inline-block text-bone/70">
          {data.badge}
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold text-bone md:text-5xl">
          {data.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-md font-sans text-bone/60">
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
              className="w-full border border-bone/20 bg-ink px-5 py-4 font-sans text-sm text-bone outline-none transition-colors placeholder:text-bone/40 focus:border-moss"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-moss px-8 py-4 font-sans text-sm font-medium text-bone transition-colors duration-150 hover:bg-moss-hover cursor-pointer"
          >
            {data.buttonText}
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

        <p className="mt-6 text-xs text-bone/40">
          {data.disclaimer}
        </p>
      </motion.div>
    </section>
  );
}