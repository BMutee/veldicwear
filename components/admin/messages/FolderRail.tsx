"use client";

import type { InboxFilter } from "./types";

/**
 * Mailbox folder rail.
 *
 * Vertical rather than a horizontal tab bar, because that is where people look
 * for it: Outlook, Gmail and Apple Mail all put the folders down the left edge.
 */

type Folder = {
  id: InboxFilter;
  label: string;
  icon: string;
  /** Unread conversations in this folder, shown as a count chip. */
  count?: number;
};

function FolderIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICONS = {
  inbox: "M2.25 13.5h3.86a2.25 2.25 0 012.25 0h3.26a2.25 2.25 0 012.25 0h3.86m-18 0V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75m-18 0v3.75A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25v-3.75",
  unread: "M12 6.75a6.75 6.75 0 016.75 6.75c0 1.5-.5 2.9-1.35 4L12 21l-5.4-3.5a6.77 6.77 0 01-1.35-4A6.75 6.75 0 016.75 6.75",
  sent: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  archive: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  all: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
} as const;

export default function FolderRail({
  active,
  counts,
  onChange,
}: {
  active: InboxFilter;
  counts: { unread: number; sent: number; open: number };
  onChange: (next: InboxFilter) => void;
}) {
  const folders: Folder[] = [
    { id: "open", label: "Inbox", icon: ICONS.inbox, count: counts.open },
    { id: "unread", label: "Unread", icon: ICONS.unread, count: counts.unread },
    { id: "sent", label: "Sent", icon: ICONS.sent, count: counts.sent },
    { id: "archived", label: "Archive", icon: ICONS.archive },
    { id: "all", label: "All mail", icon: ICONS.all },
  ];

  return (
    <nav
      aria-label="Mail folders"
      className="rounded-xl border border-stone/20 bg-white p-2 shadow-sm lg:sticky lg:top-6 lg:self-start"
    >
      <ul className="space-y-0.5">
        {folders.map((f) => {
          const isActive = f.id === active;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onChange(f.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50 ${
                  isActive
                    ? "bg-moss/10 font-semibold text-moss"
                    : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                <FolderIcon path={f.icon} />
                <span className="min-w-0 flex-1 truncate">{f.label}</span>
                {f.count !== undefined && f.count > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      f.id === "unread" ? "bg-moss text-white" : "bg-ink/5 text-stone"
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
