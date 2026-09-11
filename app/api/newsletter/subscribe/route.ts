import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const rawSource = typeof body?.source === "string" ? body.source : "";
    const email = rawEmail.trim().toLowerCase();
    const source = rawSource.trim().slice(0, 50) || "website";

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing && existing.status === "active") {
      // Already subscribed — don't store twice or send a second welcome email.
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    if (existing) {
      // Previously unsubscribed — reactivate without re-sending the welcome email.
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: "active", unsubscribedAt: null, source },
      });
      return NextResponse.json({ success: true, reactivated: true });
    }

    await prisma.newsletterSubscriber.create({
      data: { email, source, status: "active" },
    });

    try {
      await sendWelcomeEmail({ to: email });
    } catch (emailError) {
      // The subscription is saved; a transient email failure shouldn't make
      // the storefront show an error. Log for observability.
      console.error("Failed to send welcome email", emailError);
      return NextResponse.json(
        { success: true, emailSent: false },
        { status: 202 },
      );
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}