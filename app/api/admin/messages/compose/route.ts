import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sendProactiveContactEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";
import { composeThreadForOutbound, normaliseEmail } from "@/lib/message-threads";

const MAX_BODY_LENGTH = 5000;
const MAX_SUBJECT_LENGTH = 200;

/**
 * Starting a conversation can send cold mail, so the cap is much tighter than
 * the reply limit — 10 an hour per admin.
 */
const COMPOSE_LIMIT = { maxAttempts: 10, windowSeconds: 3600 } as const;

// Deliberately stricter than the contact form's check: this address is typed by
// an admin into a single field, and a typo here means silently emailing nobody.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/admin/messages/compose — the mail-client "New message".
 *
 * Sends before writing, exactly like the reply route: if DeoMail rejects the
 * mail, no thread is created and the admin keeps their draft. The caller passes
 * the thread id back on a follow-up reply, so the whole conversation lives on
 * one row.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAdminApi();
  if (error) return error;

  if (!checkRateLimit(`admin-message-compose:${user.id}`, COMPOSE_LIMIT).allowed) {
    return NextResponse.json(
      { error: "You've sent a lot of new messages recently. Please wait before sending more." },
      { status: 429 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const to = normaliseEmail(typeof payload?.to === "string" ? payload.to : "");
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!to) {
    return NextResponse.json({ error: "Enter a recipient email address." }, { status: 400 });
  }
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Messages are limited to ${MAX_BODY_LENGTH} characters.` },
      { status: 400 },
    );
  }

  // A subject is optional in the UI (we fall back to the body) but never blank
  // on the wire — an empty subject line reads as spam.
  const safeSubject = (subject || body.split(/\r?\n/)[0] || "A note from Veldic Wear").slice(
    0,
    MAX_SUBJECT_LENGTH,
  );

  try {
    await sendProactiveContactEmail({
      to,
      customerName: name || to,
      subject: safeSubject,
      body,
    });
  } catch (err) {
    console.error("[admin/messages] compose send failed:", err);
    return NextResponse.json(
      { error: "We couldn't send that message. Please try again." },
      { status: 502 },
    );
  }

  const thread = await composeThreadForOutbound({
    email: to,
    name: name || to,
    subject: safeSubject,
  });

  const reply = await prisma.contactMessageReply.create({
    data: {
      threadId: thread.id,
      body,
      adminId: user.id,
      adminName: user.name ?? null,
    },
  });

  console.log("[admin/messages] conversation started", {
    threadId: thread.id,
    to,
    adminId: user.id,
    replyId: reply.id,
  });

  return NextResponse.json({ thread, reply }, { status: 201 });
}
