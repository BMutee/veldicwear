import { betterAuth, type User as BetterAuthUser } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins/two-factor";
import { prisma } from "./prisma";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendEmail } = await import("./email");
      await sendEmail({
        to: user.email,
        subject: "Reset your Veldic Wear password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1C1917;">
            <h2 style="color: #1C1917; margin-bottom: 8px;">Reset your password</h2>
            <p style="color: #78716C;">We received a request to reset the password for your Veldic Wear account.</p>
            <p style="color: #78716C;">Click the button below to choose a new password. This link expires in 1 hour.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background: #1C1917; color: #FAFAF9; padding: 14px 32px; font-weight: bold; text-decoration: none; letter-spacing: 0.05em;">RESET PASSWORD</a>
            </div>
            <p style="color: #78716C; font-size: 14px;">If the button doesn't work, paste this URL into your browser:</p>
            <p style="color: #57534E; font-size: 12px; word-break: break-all;">${url}</p>
            <p style="color: #78716C; font-size: 12px; margin-top: 32px;">If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
          </div>
        `,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update every 24 hours
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      phone: { type: "string", required: false },
      role: { type: "string", required: true, defaultValue: "customer" },
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  account: {
    accountLinking: {
      enabled: false,
      trustedProviders: ["credential"],
    },
  },
  plugins: [
    twoFactor({
      otpOptions: {
        async sendOTP({ user, otp }) {
          // Send OTP via email for admin 2FA
          const { sendEmail } = await import("./email");
          await sendEmail({
            to: user.email,
            subject: "Veldic Wear Admin - Verification Code",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1C1917;">Veldic Wear Admin Login</h2>
                <p style="color: #78716C;">Your verification code is:</p>
                <div style="background: #F5F5F4; padding: 20px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1C1917;">${otp}</span>
                </div>
                <p style="color: #78716C; font-size: 14px;">This code expires in 5 minutes.</p>
                <p style="color: #78716C; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          });
        },
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});