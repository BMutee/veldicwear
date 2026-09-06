"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type BrandStoryContent = {
  badge?: string;
  headline?: string;
  headlineAccent?: string;
  paragraphs?: string[];
  stats?: { value: string; label: string }[];
  ctaText?: string;
  ctaLink?: string;
};

const fallback: BrandStoryContent = {
  badge: "Our story",
  headline: "Built for the\nground you cover",
  headlineAccent: "ground you cover",
  paragraphs: [
    "Veldic Wear is rooted in the open terrain — the veld, the trail, the long way home. We design for the journey, not the image.",
    "Every piece is cut from premium fabrics, made to move with you and last beyond the season. Built for the ground, not the gym mirror.",
    "This is clothing for people who measure progress in miles and mornings, not hype."
  ],
  stats: [
    { value: "2018", label: "Founded" },
    { value: "40+", label: "Drops" },
    { value: "100%", label: "Ground-ready" }
  ],
  ctaText: "Read our story",
  ctaLink: "/about"
};

export default function BrandStory({ initialContent }: { initialContent?: BrandStoryContent | null }) {
  const [content, setContent] = useState<BrandStoryContent | null>(initialContent ?? null);

  useEffect(() => {
    // Theme document supplies content (app/page.tsx) — legacy fetch is a
    // fallback for prop-less callers only.
    if (initialContent) return;
    fetch("/api/sections/brand-story")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => {});
  }, [initialContent]);

  const data = content || fallback;

  return (
    <section className="relative overflow-hidden glass-edge bg-white/55 px-6 py-24 backdrop-blur-2xl">
      {/* Decorative color glow (blue / lavender) behind the glass */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/10 blur-3xl" />
      <div className="absolute -right-32 -top-32 h-[360px] w-[360px] rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative z-10 section-grounded">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Text */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="eyebrow inline-block"
            >
              {data.badge}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-ink md:text-5xl"
            >
              {(data.headline || "").split("\n").map((line, i) => (
                <span key={i}>
                  {line === data.headlineAccent ? (
                    <span className="text-moss">{line}</span>
                  ) : (
                    line
                  )}
                  {i < (data.headline || "").split("\n").length - 1 && <br />}
                </span>
              ))}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 space-y-5 font-sans leading-relaxed text-stone"
            >
              {(data.paragraphs || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </motion.div>

            {(data.stats || []).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-8"
              >
                {(data.stats || []).map((stat, i) => (
                  <div key={i}>
                    <p className="font-mono text-3xl text-ink">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-stone">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href={data.ctaLink || "/about"}
                className="btn-outline mt-10 cursor-pointer"
              >
                {data.ctaText || "Read our story"}
                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative h-[400px] w-full max-w-md overflow-hidden glass-strong md:h-[500px]">
              {/* Minimal abstract terrain */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-6 h-24 w-24 border border-moss/40 bg-moss/10" />
                  <p className="font-display text-6xl font-semibold text-ink/10">
                    VW
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-stone">
                    Est. 2018
                  </p>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute left-4 top-4 h-8 w-8 border-l border-t border-moss/40" />
              <div className="absolute right-4 top-4 h-8 w-8 border-r border-t border-moss/40" />
              <div className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-moss/40" />
              <div className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-moss/40" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}