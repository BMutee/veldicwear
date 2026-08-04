import { NextRequest, NextResponse } from "next/server";
import { escapeHtml } from "@/lib/sanitize";

const DEO_MAIL_API_KEY = process.env.DEO_MAIL_API_KEY ?? "";
const DEO_MAIL_API_URL = "https://api.deomail.com/v1/send";
const DEFAULT_FROM = "info@veldicwear.com";
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO ?? "khalildigital.contact@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">New Contact Form Submission</h1>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 100px;">Name</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(subject)}</td></tr>
        </table>
        <h2 style="font-size: 16px; margin-top: 24px; margin-bottom: 8px;">Message</h2>
        <p style="padding: 12px; border: 1px solid #ddd; background: #f9f9f9; white-space: pre-wrap;">${escapeHtml(message)}</p>
        <p style="margin-top: 24px; color: #666;">Reply-to: ${escapeHtml(email)}</p>
      </div>
    `;

    if (!DEO_MAIL_API_KEY) {
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 },
      );
    }

    const response = await fetch(DEO_MAIL_API_URL, {
      method: "POST",
      headers: {
        "X-API-Key": DEO_MAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DEFAULT_FROM,
        to: [CONTACT_EMAIL_TO],
        subject: `[Veldic Wear Contact] ${subject}`,
        html,
        fingerprint: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to send email");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message." },
      { status: 500 },
    );
  }
}