"use client";

import Link from "next/link";
import type { ActiveAnnouncement, AnnouncementStyle } from "@/lib/announcement";

// Site-wide announcement strip rendered above the sticky navbar.
// V3: light frosted strip (glass) with blue promo; warning uses a soft
// orange tint so the whole homepage stays light and modern.

const STYLE_CLS: Record<AnnouncementStyle, string> = {
  info: "glass-strong border-b border-white/60 text-ink",
  warning: "bg-clay/10 border-b border-white/60 text-clay",
  promo: "bg-moss text-white border-b border-white/60",
};

export default function AnnouncementBar({
  announcement,
}: {
  announcement: ActiveAnnouncement | null;
}) {
  if (!announcement) return null;

  const inner = (
    <p className="text-center text-sm font-medium tracking-wide">{announcement.message}</p>
  );

  return (
    <div className={`w-full ${STYLE_CLS[announcement.style] ?? STYLE_CLS.info}`}>
      <div className="mx-auto max-w-[1280px] px-4 py-2 text-center">
        {announcement.link ? (
          <Link
            href={announcement.link}
            className="flex items-center justify-center gap-2 transition-colors duration-150 hover:opacity-90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {inner}
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}