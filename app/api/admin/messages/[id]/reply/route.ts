import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sendContactMessageReplyEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";

/** Long enough for a real support answer, short enough to stop runaway mail. */
const MAX_BODY_LENGTH = 5000;
const SUBJECT_MAX_LENGTH = 200;

/**
 * The cap is per admin rather than per message, so a stuck client or a
 * double-click loop can't mail the same customer over and over.
 */
const REPLY_LIMIT = { maxAttempts: 30, windowSeconds: 600 } as const;

/**
 * Answer a contact-form message from Admin → Messages.
 *
 * The mail is sent BEFORE anything is written. If DeoMail rejects the send, no
 * reply row and no `repliedAt` are stored — the inbox must never claim a
 * customer was answered when the mail never left the building.
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

  const message = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, subject: true, message: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
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

  try {
    await sendContactMessageReplyEmail({
      to: message.email,
      customerName: message.name,
      originalSubject: message.subject.slice(0, SUBJECT_MAX_LENGTH),
      originalMessage: message.message,
      body: replyBody,
    });
  } catch (err) {
    console.error("[admin/messages] reply send failed:", err);
    return NextResponse.json(
      { error: "We couldn't send that reply. Please try again." },
      { status: 502 },
    );
  }

  // The reply also marks the message read — answering it is the read receipt.
  const [reply] = await prisma.$transaction([
    prisma.contactMessageReply.create({
      data: {
        messageId: message.id,
        body: replyBody,
        adminId: user.id,
        adminName: user.name ?? null,
      },
    }),
    prisma.contactMessage.update({
      where: { id: message.id },
      data: { repliedAt: new Date(), read: true },
    }),
  ]);

  console.log("[admin/messages] reply sent", {
    messageId: message.id,
    to: message.email,
    adminId: user.id,
    replyId: reply.id,
  });

  return NextResponse.json({ reply }, { status: 201 });
}
