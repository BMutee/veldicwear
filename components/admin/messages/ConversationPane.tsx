"use client";

import { useEffect, useRef } from "react";
import { Badge, Button, Select } from "@/components/admin-ui/primitives";
import Composer from "./Composer";
import CustomerContextPanel from "./CustomerContextPanel";
import {
  buildTimeline,
  type Assignee,
  type CannedResponse,
  type MessageThread,
  type TimelineEntry,
} from "./types";

/**
 * The right-hand pane: who you're talking to, the full history, and the box you
 * answer in.
 *
 * Inbound messages, our replies and internal notes share one chronological
 * timeline — that's what makes it read as a conversation rather than a form and
 * a reply log stacked on top of each other.
 */

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Bubble({ entry }: { entry: TimelineEntry }) {
  if (entry.kind === "inbound") {
    return (
      <div className="flex gap-2.5">
        <span
          aria-hidden="true"
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-[10px] font-bold text-ink/60"
        >
          {initials(entry.data.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-stone">
            <span className="font-semibold text-ink">{entry.data.name}</span> ·{" "}
            {clock(entry.at)}
          </p>
          {entry.data.subject && (
            <p className="mt-1 text-xs font-semibold text-ink">{entry.data.subject}</p>
          )}
          <div className="mt-1 rounded-lg rounded-tl-sm border border-stone/25 bg-white px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
              {entry.data.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (entry.kind === "reply") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <p className="text-right text-xs text-stone">
            {entry.data.adminName ?? "Support"} · {clock(entry.at)} ·{" "}
            <span className="font-semibold text-moss">emailed</span>
          </p>
          <div className="mt-1 rounded-lg rounded-tr-sm bg-moss px-4 py-3 text-white">
            <p className="whitespace-pre-wrap text-sm leading-6">{entry.data.body}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-[90%] rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Internal note · {entry.data.adminName ?? "Admin"} · {clock(entry.at)}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
          {entry.data.body}
        </p>
      </div>
    </div>
  );
}

export default function ConversationPane({
  thread,
  assignees,
  canned,
  sending,
  onSend,
  onAssign,
  onToggleArchive,
  onDelete,
  onSaveCanned,
  onManageCanned,
}: {
  thread: MessageThread;
  assignees: Assignee[];
  canned: CannedResponse[];
  sending: boolean;
  onSend: (body: string, mode: "reply" | "note") => void;
  onAssign: (assigneeId: string | null) => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onSaveCanned: (title: string, body: string) => Promise<void>;
  onManageCanned: () => void;
}) {
  const timeline = buildTimeline(thread);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEntryId = timeline.length > 0 ? timeline[timeline.length - 1].at : null;

  // Keep the newest message in view. Keyed on the last entry's timestamp so it
  // only fires when something was actually added, not on every re-render.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastEntryId, thread.id]);

  let lastDay = "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="border-b border-stone/20 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white"
            >
              {initials(thread.customerName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{thread.customerName}</p>
              <a
                href={`mailto:${thread.email}`}
                className="truncate text-xs text-moss underline underline-offset-2 hover:text-ink"
              >
                {thread.email}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {thread.status === "archived" && <Badge tone="neutral">Archived</Badge>}
            {thread.lastReplyAt && <Badge tone="success">Replied</Badge>}
            {thread.unreadCount > 0 && <Badge tone="accent">{thread.unreadCount} new</Badge>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="assignee" className="text-xs font-medium text-stone">
            Assigned to
          </label>
          <Select
            value={thread.assignedToId ?? ""}
            onChange={(v) => onAssign(v || null)}
            ariaLabel="Assign this conversation to a teammate"
            className="w-auto min-w-[10rem] py-1 text-xs"
            options={[
              { value: "", label: "Unassigned" },
              ...assignees.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <span className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onToggleArchive}>
              {thread.status === "archived" ? "Unarchive" : "Archive"}
            </Button>
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </span>
        </div>
      </div>

      <CustomerContextPanel threadId={thread.id} />

      {/* Timeline */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-bone px-4 py-4">
        {timeline.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone">This conversation is empty.</p>
        ) : (
          timeline.map((entry, i) => {
            const day = dayKey(entry.at);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={`${entry.kind}-${entry.at}-${i}`} className="space-y-4">
                {showDay && (
                  <p className="sticky top-0 z-10 text-center text-[11px] font-semibold uppercase tracking-wide text-stone">
                    {dayLabel(entry.at)}
                  </p>
                )}
                <Bubble entry={entry} />
              </div>
            );
          })
        )}
      </div>

      <Composer
        customerName={thread.customerName}
        sending={sending}
        canned={canned}
        onSend={onSend}
        onSaveCanned={onSaveCanned}
        onManageCanned={onManageCanned}
      />
    </div>
  );
}
