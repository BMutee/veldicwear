// lib/announcement.ts
// Server-side helper for surfacing the active site-wide announcement.
// Falls back to null when none is active or within its date window.

import { prisma } from "@/lib/prisma";

export type AnnouncementStyle = "info" | "warning" | "promo";

export type ActiveAnnouncement = {
  id: string;
  message: string;
  link: string | null;
  style: AnnouncementStyle;
};

/**
 * Return the single announcement to show as a site-wide strip, or null.
 *
 * Filtering:
 *  - active must be true
 *  - now must be within [startDate, endDate] when each is set
 *      (missing startDate  = "always started")
 *      (missing endDate    = "never expires")
 *  - when multiple rows qualify, the most recently updated wins
 *    (sorted by `updatedAt` desc, with `createdAt` desc as a tiebreak so
 *    same-timestamp updates resolve deterministically to the newest create)
 *
 * NOTE on timestamps: the Announcement table/migration already has an
 * `updatedAt` column, but the Prisma model previously omitted it — so admin
 * edits were not tracked and we couldn't sort by "most recently updated".
 * `schema.prisma` now declares `updatedAt @updatedAt` (aligned to the
 * existing DB column, no new migration). The admin put/create routes already
 * write this model, and Prisma auto-fills @updatedAt on update.
 */
export async function getActiveAnnouncement(): Promise<ActiveAnnouncement | null> {
  const now = new Date();

  const candidates = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      message: true,
      link: true,
      style: true,
      startDate: true,
      endDate: true,
    },
  });

  for (const a of candidates) {
    const started = !a.startDate || a.startDate <= now;
    const notExpired = !a.endDate || now <= a.endDate;
    if (started && notExpired) {
      return {
        id: a.id,
        message: a.message,
        link: a.link,
        style: (a.style as AnnouncementStyle) || "info",
      };
    }
  }

  return null;
}