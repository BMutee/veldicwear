"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type DBCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
};

type CategoriesHeaderContent = {
  badge?: string;
  headline?: string;
  description?: string;
};

const fallbackHeader: CategoriesHeaderContent = {
  badge: "Collections",
  headline: "Shop by terrain",
  description: "From low ground to high ground — find your journey.",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Categories({ content }: { content?: CategoriesHeaderContent | null }) {
  const [collections, setCollections] = useState<DBCollection[]>([]);
  const [headerContent, setHeaderContent] = useState<CategoriesHeaderContent | null>(content ?? null);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data))
      .catch(() => {});

    // Theme document supplies the header content (app/page.tsx) — the legacy
    // /api/sections fetch is only a fallback for callers without props.
    if (content) return;
    fetch("/api/sections/categories-header")
      .then((r) => r.json())
      .then((data) => setHeaderContent(data))
      .catch(() => {});
  }, [content]);

  const header = headerContent || fallbackHeader;

  const displayCollections = collections.length > 0 ? collections.slice(0, 4) : [];

  if (displayCollections.length === 0) {
    return null;
  }

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
            {header.badge}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl"
          >
            {header.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-lg font-sans text-stone"
          >
            {header.description}
          </motion.p>
        </div>

        {/* Collection grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {displayCollections.map((col) => (
            <motion.div key={col.id} variants={item}>
              <Link
                href={`/collection/${col.slug}`}
                className="group relative flex h-72 flex-col justify-end overflow-hidden bg-ink transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                {/* Background image or fallback */}
                {col.image && (
                  <img
                    src={col.image}
                    alt={col.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="mb-3 h-1 w-10 bg-moss transition-all duration-300 group-hover:w-16" />
                  <h3 className="font-display text-2xl font-semibold text-bone">
                    {col.name}
                  </h3>
                  {col.description && (
                    <p className="mt-1 text-sm text-bone/70 font-sans line-clamp-2">
                      {col.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 font-sans text-sm text-bone opacity-0 transition-all duration-300 group-hover:opacity-100 cursor-pointer">
                    <span>Shop now</span>
                    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}