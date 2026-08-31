import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sendEmail } from "@/lib/email";

export async function POST() {
  try {
    const admin = await requireAdminApi();
    if (admin.error) return admin.error;

    const userId = admin.user.id;
    const email = admin.user.email;

    // Invalidate previous unused codes
    await prisma.twoFactorSession.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.twoFactorSession.create({
      data: { userId, code, expiresAt },
    });

    // Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C1917;">Veldic Wear Admin Login</h2>
        <p style="color: #78716C;">Your verification code is:</p>
        <div style="background: #F5F5F4; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1C1917;">${code}</span>
        </div>
        <p style="color: #78716C; font-size: 14px;">This code expires in 5 minutes.</p>
        <p style="color: #78716C; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Veldic Wear Admin - Verification Code",
      html,
    });

    return NextResponse.json({ success: true, message: "Verification code sent to your email." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send code." }, { status: 500 });
  }
}