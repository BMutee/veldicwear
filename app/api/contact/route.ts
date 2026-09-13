import { NextRequest, NextResponse } from "next/server";
import { escapeHtml } from "@/lib/sanitize";
import { prisma } from "@/lib/prisma";
import { sendDeoMail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limiter";

const CONTACT_EMAIL_TO = (process.env.CONTACT_EMAIL_TO ?? "info@veldicwear.com").toLowerCase();
const CONTACT_EMAIL_FROM = (process.env.EMAIL_FROM ?? "info@veldicwear.com").toLowerCase();

export async function POST(request: NextRequest) {
  try {
    // Spam/abuse guard: max 5 contact submissions per IP per 10 minutes.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "unknown";
    const limit = checkRateLimit(`contact:${ip}`, { maxAttempts: 5, windowSeconds: 600 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const { name, email, subject, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const visitorEmail = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(visitorEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const safeSubject = String(subject).trim().slice(0, 200);

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">New Contact Form Submission</h1>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 100px;">Name</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(String(name).trim())}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(visitorEmail)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(safeSubject)}</td></tr>
        </table>
        <h2 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px;">Message</h2>
        <p style="padding: 12px; border: 1px solid #ddd; background: #f9f9f9; white-space: pre-wrap;">${escapeHtml(String(message).trim())}</p>
      </div>
    `;
    const text = [
      "New Contact Form Submission",
      `Name: ${String(name).trim()}`,
      `Email: ${visitorEmail}`,
      `Subject: ${safeSubject}`,
      "",
      String(message).trim(),
    ].join("\n");

    // Single shared email path (lib/email.ts) so contact mail benefits from
    // the same sender normalization + error handling as every other email.
    const result = await sendDeoMail({
      from: CONTACT_EMAIL_FROM,
      to: [CONTACT_EMAIL_TO],
      replyTo: visitorEmail,
      subject: `[Veldic Wear Contact] ${safeSubject}`,
      html,
      text,
      // Omit `fingerprint` so it defaults to true (free-plan compatible).
    });

    // Persist every submission so no message is ever lost if email fails
    // or lands in spam — the inbox lives at /admin/messages.
    const saved = await prisma.contactMessage.create({
      data: {
        name: String(name).trim().slice(0, 200),
        email: visitorEmail.slice(0, 320),
        subject: safeSubject,
        message: String(message).trim().slice(0, 5000),
      },
      select: { id: true },
    });

    console.log("[contact] email sent", {
      to: CONTACT_EMAIL_TO,
      from: CONTACT_EMAIL_FROM,
      replyTo: visitorEmail,
      id: (result as { id?: string })?.id ?? null,
      messageId: saved.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contact] failed to send:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message." },
      { status: 500 },
    );
  }
}
