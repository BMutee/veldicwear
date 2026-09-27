/**
 * Client-side shapes for the admin inbox.
 *
 * These mirror what /api/admin/messages returns (lib/message-threads.ts builds
 * the query). Dates arrive as ISO strings over JSON and are formatted at render
 * time, so they are typed as `string` here rather than `Date`.
 */

export type ThreadMessage = {
  id: string;
  name: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type ThreadReply = {
  id: string;
  messageId: string | null;
  body: string;
  adminName: string | null;
  createdAt: string;
};

export type ThreadNote = {
  id: string;
  body: string;
  adminName: string | null;
  createdAt: string;
};

export type MessageThread = {
  id: string;
  email: string;
  customerName: string;
  subject: string;
  status: "open" | "archived";
  unreadCount: number;
  lastReplyAt: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  startedByAdmin: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages: ThreadMessage[];
  replies: ThreadReply[];
  notes: ThreadNote[];
};

export type Assignee = { id: string; name: string; email: string };

export type CannedResponse = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  deliveredAt: string | null;
  _count: { items: number };
};

export type CustomerContext = {
  email: string;
  orders: CustomerOrder[];
  totalOrders: number;
  lifetimeValue: number;
};

export type InboxFilter = "open" | "unread" | "sent" | "archived" | "all";

/** A new, admin-initiated message — the mail-client "New message". */
export type ComposeDraft = {
  to: string;
  name: string;
  subject: string;
  body: string;
};

export const EMPTY_DRAFT: ComposeDraft = { to: "", name: "", subject: "", body: "" };

/** Mirrors MAX_BODY_LENGTH in app/api/admin/messages/[id]/reply/route.ts. */
export const MAX_REPLY_LENGTH = 5000;

/**
 * Fired on `window` whenever the inbox changes, so the sidebar badge can refresh
 * without the messages page and the nav having to be coupled.
 */
export const MESSAGES_CHANGED_EVENT = "veldic:messages-changed";

export function notifyMessagesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MESSAGES_CHANGED_EVENT));
}

/** One conversation flattened into a single chronological feed. */
export type TimelineEntry =
  | { kind: "inbound"; at: string; data: ThreadMessage }
  | { kind: "reply"; at: string; data: ThreadReply }
  | { kind: "note"; at: string; data: ThreadNote };

/**
 * Interleave customer messages, our replies and internal notes in time order.
 *
 * Notes sit in the timeline so the next admin sees what was already tried, but
 * they are visually distinct and are never included in the email sent out.
 */
export function buildTimeline(thread: MessageThread): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...thread.messages.map((data) => ({ kind: "inbound" as const, at: data.createdAt, data })),
    ...thread.replies.map((data) => ({ kind: "reply" as const, at: data.createdAt, data })),
    ...thread.notes.map((data) => ({ kind: "note" as const, at: data.createdAt, data })),
  ];
  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** The newest thing anyone said — what the thread list previews. */
export function lastActivity(thread: MessageThread): TimelineEntry | null {
  const timeline = buildTimeline(thread);
  return timeline.length > 0 ? timeline[timeline.length - 1] : null;
}

export function previewText(entry: TimelineEntry | null): string {
  if (!entry) return "";
  if (entry.kind === "inbound") return entry.data.message;
  return entry.data.body;
}
