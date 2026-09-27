import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sendContactMessageReplyEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";

/** Long enough for a real support answer, short enough to stop runaway mail. */
const MAX_BODY_LENGTH = 5000;
const SUBJECT_MAX_LENGTH = 200;

/**
 * The cap is per admin rather than per thread, so a stuck client or a
 * double-click loop can't mail the same customer over and over.
 */
const REPLY_LIMIT = { maxAttempts: 30, windowSeconds: 600 } as const;

/**
 * Answer a conversation from Admin -> Messages.
 *
 * The mail is sent BEFORE anything is written. If DeoMail rejects the send, no
 * reply row and no `lastReplyAt` are stored — the inbox must never claim a
 * customer was answered when the mail never left the building.
 *
 * `inReplyToMessageId` is optional: it links the reply to the specific message
 * it answers for display, but a follow-up sent days later belongs to the thread
 * without answering any one message.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdminApi();
  if (error) return error;

  if (!checkRateLimit(`admin-message-reply:${user.id}`, REPLY_LIMIT).allowed) {
    return NextResponse.json(
      { error: "Too many replies sent. Please wait a few minutes." },
      { status: 429 },
    );
  }

  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: { id },
    select: { id: true, email: true, customerName: true, subject: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const replyBody = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!replyBody) {
    return NextResponse.json({ error: "Write a reply before sending." }, { status: 400 });
  }
  if (replyBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Replies are limited to ${MAX_BODY_LENGTH} characters.` },
      { status: 400 },
    );
  }

  // The latest customer message is quoted in the outgoing mail so the customer
  // can see what is being answered.
  const latestInbound = await prisma.contactMessage.findFirst({
    where: { threadId: id },
    orderBy: { createdAt: "desc" },
    select: { message: true },
  });

  try {
    await sendContactMessageReplyEmail({
      to: thread.email,
      customerName: thread.customerName,
      originalSubject: thread.subject.slice(0, SUBJECT_MAX_LENGTH),
      originalMessage: latestInbound?.message ?? "",
      body: replyBody,
    });
  } catch (err) {
    console.error("[admin/messages] reply send failed:", err);
    return NextResponse.json(
      { error: "We couldn't send that reply. Please try again." },
      { status: 502 },
    );
  }

  const inReplyToMessageId =
    typeof payload?.inReplyToMessageId === "string" && payload.inReplyToMessageId
      ? payload.inReplyToMessageId
      : null;

  // Replying to an archived conversation is normal (a customer wrote again
  // after you filed it), so the send reopens the thread rather than replying
  // into an archive.
  const [reply] = await prisma.$transaction([
    prisma.contactMessageReply.create({
      data: {
        threadId: thread.id,
        messageId: inReplyToMessageId,
        body: replyBody,
        adminId: user.id,
        adminName: user.name ?? null,
      },
    }),
    prisma.messageThread.update({
      where: { id: thread.id },
      data: { lastReplyAt: new Date(), status: "open" },
    }),
  ]);

  console.log("[admin/messages] reply sent", {
    threadId: thread.id,
    to: thread.email,
    adminId: user.id,
    replyId: reply.id,
  });

  return NextResponse.json({ reply }, { status: 201 });
}

