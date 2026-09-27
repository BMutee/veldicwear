/**
 * Shared shape + helpers for the Admin -> Messages inbox.
 *
 * The inbox is thread-centric: one MessageThread per customer (keyed by the
 * lowercased email), holding every ContactMessage they sent, every reply we
 * sent back, and any internal notes. app/api/contact writes a new message onto
 * the existing thread instead of creating an orphan row, which is what makes
 * repeat contact from one person read as a single conversation.
 *
 * Server-only — it imports prisma, so it must not be pulled into a client
 * component.
 */

import { prisma } from "@/lib/prisma";

/** The thread key. Emails are compared case-insensitively, so always lower-case. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type ThreadStatus = "open" | "archived";
export type InboxFilter = "open" | "unread" | "sent" | "archived" | "all";

const MESSAGE_SELECT = {
  id: true,
  name: true,
  subject: true,
  message: true,
  read: true,
  createdAt: true,
} as const;

const REPLY_SELECT = {
  id: true,
  messageId: true,
  body: true,
  adminName: true,
  createdAt: true,
} as const;

const NOTE_SELECT = {
  id: true,
  body: true,
  adminName: true,
  createdAt: true,
} as const;

/**
 * A thread carries its whole history inline so the inbox needs one request
 * instead of one per conversation. Capped per thread so a pathological customer
 * can't make the list response unbounded.
 */
export const THREAD_INCLUDE = {
  messages: { orderBy: { createdAt: "asc" }, take: 100, select: MESSAGE_SELECT },
  replies: { orderBy: { createdAt: "asc" }, take: 100, select: REPLY_SELECT },
  notes: { orderBy: { createdAt: "asc" }, take: 100, select: NOTE_SELECT },
} as const;

const MAX_THREADS = 200;

/**
 * List the inbox.
 *
 * `unread` and `sent` are views over the same rows, not separate buckets, so a
 * thread can appear in several folders at once — matching how a mail client
 * behaves. `sent` holds conversations an admin started from the composer.
 */
export async function listThreads(options: { filter: InboxFilter; search?: string }) {
  const { filter, search } = options;
  const q = search?.trim();

  const where: Record<string, unknown> = {};
  if (filter === "archived") where.status = "archived";
  else if (filter !== "all" && filter !== "sent") where.status = "open";
  if (filter === "unread") where.unreadCount = { gt: 0 };
  if (filter === "sent") where.startedByAdmin = true;

  if (q) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { messages: { some: { message: { contains: q, mode: "insensitive" } } } },
      { replies: { some: { body: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return prisma.messageThread.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: MAX_THREADS,
    include: THREAD_INCLUDE,
  });
}

/**
 * Clear a thread's unread counter.
 *
 * Deliberately NOT `async`: marking it async wraps the call in a native Promise
 * instead of returning Prisma's PrismaPromise, which cannot be passed to
 * `$transaction([...])` for use alongside other writes. Awaiting it works either
 * way, so callers don't need to know.
 */
export function markThreadRead(threadId: string) {
  return prisma.messageThread.update({
    where: { id: threadId },
    data: { unreadCount: 0 },
  });
}

/**
 * Find or create the thread for an inbound message.
 *
 * `lastMessageAt`, subject and customer name are refreshed on every contact so
 * the inbox sorts by real activity and shows the newest subject for a customer
 * who has written several times.
 */
export async function upsertThreadForInbound(input: {
  email: string;
  name: string;
  subject: string;
  message: string;
}) {
  const email = normaliseEmail(input.email);
  const thread = await prisma.messageThread.upsert({
    where: { email },
    create: {
      email,
      customerName: input.name.slice(0, 200),
      subject: input.subject,
      lastMessageAt: new Date(),
      // A brand-new message is unread until an admin opens the thread.
      unreadCount: 1,
    },
    update: {
      customerName: input.name.slice(0, 200),
      subject: input.subject,
      lastMessageAt: new Date(),
      unreadCount: { increment: 1 },
    },
  });

  const message = await prisma.contactMessage.create({
    data: {
      name: input.name.slice(0, 200),
      email,
      subject: input.subject,
      message: input.message,
      threadId: thread.id,
    },
    select: { id: true },
  });

  return { thread, message };
}

/**
 * Start a conversation from the admin composer — the mail-client "New message".
 *
 * There is no customer message yet, so the thread is created (or reused, if that
 * person already has one) and the first entry is an outbound one. `unreadCount`
 * deliberately stays at 0: nobody is waiting on us, so this must not light up
 * the badge or the Unread folder.
 */
export async function composeThreadForOutbound(input: {
  email: string;
  name: string;
  subject: string;
}) {
  const email = normaliseEmail(input.email);
  const name = input.name.trim() || email;
  const subject = input.subject.trim();
  const now = new Date();

  return prisma.messageThread.upsert({
    where: { email },
    create: {
      email,
      customerName: name.slice(0, 200),
      subject,
      startedByAdmin: true,
      lastMessageAt: now,
      lastReplyAt: now,
      unreadCount: 0,
    },
    update: {
      // Keep the address fresh (a typo'd earlier address, a full name typed
      // this time) but leave unreadCount alone: opening an old conversation to
      // write to it must not mark the customer's own mail as read.
      customerName: name.slice(0, 200),
      subject,
      lastMessageAt: now,
      lastReplyAt: now,
    },
  });
}

