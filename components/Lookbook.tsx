"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type LookItem = {
  title: string;
  description: string;
  background: string;
  accent: string;
};

type LookbookContent = {
  badge?: string;
  headline?: string;
  description?: string;
  looks?: LookItem[];
  ctaText?: string;
  ctaLink?: string;
};

const fallback: LookbookContent = {
  badge: "Lookbook",
  headline: "Curated looks",
  description: "Pre-styled outfits designed to inspire your next journey.",
  looks: [
    { id: 1, title: "Low Ground", description: "Easy layers for everyday terrain", background: "bg-stone/10", accent: "bg-moss" },
    { id: 2, title: "Mid Ground", description: "Versatile pieces for shifting weather", background: "bg-stone/20", accent: "bg-moss" },
    { id: 3, title: "High Ground", description: "Technical kit for the long way up", background: "bg-stone/30", accent: "bg-moss" },
  ] as any,
  ctaText: "View full lookbook",
  ctaLink: "/collection"
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export default function Lookbook({ initialContent }: { initialContent?: LookbookContent | null }) {
  const [content, setContent] = useState<LookbookContent | null>(initialContent ?? null);

  useEffect(() => {
    // Theme document supplies content (app/page.tsx) — legacy fetch is a
    // fallback for prop-less callers only.
    if (initialContent) return;
    fetch("/api/sections/lookbook")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => {});
  }, [initialContent]);

  const data = content || fallback;
  const looks = data.looks || fallback.looks || [];

  return (
    <section className="px-6 py-24">
      <div className="section-grounded">
        {/* Section header */}
        <div className="mb-14 text-center">
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
            className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl"
          >
            {data.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-lg font-sans text-stone"
          >
            {data.description}
          </motion.p>
        </div>

        {/* Look cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {looks.map((look: any, index: number) => (
            <motion.div
              key={look.id || index}
              variants={item}
              className="group relative flex h-[500px] flex-col justify-end overflow-hidden border border-stone/10 transition-all duration-300 hover:border-moss hover:-translate-y-1"
            >
              {/* Background */}
              <div className={`absolute inset-0 ${look.background || "bg-stone/10"} transition-opacity duration-300 group-hover:opacity-80`} />

              {/* Topographic lines motif (subtle, not hero) */}
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `radial-gradient(circle at 25px 25px, rgba(140,134,119,0.4) 1px, transparent 0)`,
                  backgroundSize: "50px 50px",
                }}
              />

              {/* Number (mono) */}
              <div className="absolute right-6 top-6 font-mono text-8xl text-ink/10 select-none">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div className="relative z-10 p-8">
                <div className={`mb-4 h-1 w-12 ${look.accent || "bg-moss"} transition-all duration-300 group-hover:w-20`} />
                <h3 className="font-display text-3xl font-semibold text-ink">
                  {look.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  {look.description}
                </p>
                <div className="mt-6 flex items-center gap-2 font-sans text-sm text-moss opacity-0 transition-all duration-300 group-hover:opacity-100 cursor-pointer">
                  <span>View look</span>
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <Link
            href={data.ctaLink || "/collection"}
            className="btn-outline cursor-pointer"
          >
            {data.ctaText}
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}