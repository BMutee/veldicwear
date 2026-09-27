"use client";

import { Badge } from "@/components/admin-ui/primitives";
import {
  lastActivity,
  previewText,
  type MessageThread,
  type TimelineEntry,
} from "./types";

/**
 * The conversation list, messenger-style: avatar, name, preview of the newest
 * thing anyone said, and a timestamp that reads as a clock time for today and a
 * date for anything older.
 */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (isToday(iso)) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function who(entry: TimelineEntry): string {
  if (entry.kind === "inbound") return entry.data.name;
  if (entry.kind === "reply") return entry.data.adminName ?? "Support";
  return `${entry.data.adminName ?? "Admin"} · note`;
}

export default function ThreadList({
  threads,
  selectedId,
  loading,
  onSelect,
}: {
  threads: MessageThread[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading && threads.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-stone">Loading conversations…</p>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-ink">No conversations here</p>
        <p className="mt-1 text-sm text-stone">
          New contact form submissions land in the inbox automatically.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone/15">
      {threads.map((thread) => {
        const active = thread.id === selectedId;
        const unread = thread.unreadCount > 0;
        const latest = lastActivity(thread);
        const preview = previewText(latest);

        return (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-moss/40 ${
                active ? "bg-moss/5" : "hover:bg-ink/[0.03]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active ? "bg-moss text-white" : "bg-ink/5 text-ink/60"
                }`}
              >
                {initials(thread.customerName)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      unread ? "font-bold text-ink" : "font-semibold text-ink"
                    }`}
                  >
                    {thread.customerName}
                  </span>
                  <span className="shrink-0 text-xs text-stone">
                    {formatStamp(thread.lastMessageAt)}
                  </span>
                </span>

                <span className="mt-0.5 flex items-center gap-1.5">
                  {unread && (
                    <span
                      aria-label={`${thread.unreadCount} unread`}
                      className="h-2 w-2 shrink-0 rounded-full bg-moss"
                    />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-xs ${
                      unread ? "font-medium text-ink" : "text-stone"
                    }`}
                  >
                    {latest ? `${who(latest)}: ${preview}` : thread.subject}
                  </span>
                </span>

                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {thread.assignedToName && (
                    <Badge tone="accent">{thread.assignedToName}</Badge>
                  )}
                  {thread.lastReplyAt && <Badge tone="success">Replied</Badge>}
                  {thread.status === "archived" && <Badge tone="neutral">Archived</Badge>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
