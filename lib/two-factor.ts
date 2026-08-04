import { prisma } from "./prisma";
import { sendEmail } from "./email";

export interface TwoFactorResult {
  success: boolean;
  error?: string;
}

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

export async function requestTwoFactorCode(userId: string, email: string): Promise<TwoFactorResult> {
  try {
    // Invalidate previous unused codes for this user
    await prisma.twoFactorSession.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.twoFactorSession.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    // Send email with code
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C1917;">Veldic Wear Admin Login</h2>
        <p style="color: #78716C;">Your verification code is:</p>
        <div style="background: #F5F5F4; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1C1917;">${code}</span>
        </div>
        <p style="color: #78716C; font-size: 14px;">This code expires in ${OTP_TTL_MINUTES} minutes.</p>
        <p style="color: #78716C; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Veldic Wear Admin - Verification Code",
      html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to send verification code. Please try again." };
  }
}

export async function verifyTwoFactorCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await prisma.twoFactorSession.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return { success: false, error: "Invalid or expired verification code." };
    }

    // Mark as used
    await prisma.twoFactorSession.update({
      where: { id: session.id },
      data: { used: true },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Verification failed. Please try again." };
  }
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.twoFactorSession.deleteMany({
    where: { userId },
  });
}