"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type PostItem = {
  id: number;
  label: string;
  gradient: string;
};

type SocialFeedContent = {
  badge?: string;
  headline?: string;
  description?: string;
  posts?: PostItem[];
  ctaLabel?: string;
  ctaLink?: string;
};

const fallback: SocialFeedContent = {
  badge: "Social",
  headline: "Follow the journey",
  description: "Tag us in your fits for a chance to be featured.",
  posts: [
    { id: 1, label: "@veldicwear", gradient: "from-moss/20 to-ink" },
    { id: 2, label: "#VELDIC", gradient: "from-stone/30 to-ink" },
    { id: 3, label: "TRAIL READY", gradient: "from-ink to-moss/10" },
    { id: 4, label: "DROP 015", gradient: "from-stone/20 to-ink" },
    { id: 5, label: "COMMUNITY", gradient: "from-ink to-stone/30" },
    { id: 6, label: "EXCLUSIVE", gradient: "from-moss/10 to-stone/20" },
  ],
  ctaLabel: "@veldicwear",
  ctaLink: "https://instagram.com/veldicwear"
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};

export default function SocialFeed() {
  const [content, setContent] = useState<SocialFeedContent | null>(null);

  useEffect(() => {
    fetch("/api/sections/social-feed")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => {});
  }, []);

  const data = content || fallback;
  const posts = data.posts || fallback.posts || [];

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

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4"
        >
          {posts.map((post: PostItem) => (
            <motion.div
              key={post.id}
              variants={item}
              className={`group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden border border-stone/10 transition-all duration-300 hover:-translate-y-1 hover:border-moss`}
            >
              {/* Pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `linear-gradient(45deg, rgba(140,134,119,0.4) 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-moss/0 transition-colors duration-300 group-hover:bg-moss/5" />

              {/* Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="absolute right-3 top-3 h-5 w-5 text-stone transition-colors duration-300 group-hover:text-moss"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>

              {/* Label */}
              <span className="relative z-10 text-center font-sans text-sm font-medium tracking-widest text-stone transition-colors duration-300 group-hover:text-moss">
                {post.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            href={data.ctaLink || "https://instagram.com/veldicwear"}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline group cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            {data.ctaLabel}
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}