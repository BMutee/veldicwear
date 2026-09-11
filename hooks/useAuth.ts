"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth-server";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone: string | null;
  role?: string;
};

// Create a shared client instance with 2FA support.
//
// NOTE: we intentionally do NOT pass `baseURL` here. better-auth's client
// falls back to a relative "/api/auth" path, which resolves against the
// origin the user is actually browsing. Passing an absolute URL (e.g. from
// NEXT_PUBLIC_BASE_URL, which is baked into the bundle at build time) made
// the browser POST to `http://localhost:3000/...` and fail with "Failed to
// fetch". A relative path works in every environment automatically.
const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient(),
  ],
});

export function useAuth() {
  const { data: session, isPending: loading, refetch } = authClient.useSession();
  const user = (session?.user as User | undefined) ?? null;

  const login = async (
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    error?: string;
    role?: string;
    twoFactorRedirect?: boolean;
  }> => {
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) {
        return { success: false, error: error.message || "Invalid email or password." };
      }
      // Better Auth's twoFactor plugin returns `twoFactorRedirect: true` with
      // NO user/session when the account has 2FA enabled. The caller must
      // show the code-entry step and finish sign-in via verifyTotp/verifyOtp.
      // (Cast needed: the client type union doesn't expose the flag.)
      const d = data as { twoFactorRedirect?: boolean; user?: User | null } | null;
      if (d?.twoFactorRedirect) {
        return { success: true, twoFactorRedirect: true };
      }
      if (d?.user) {
        await refetch();
      }
      const role = d?.user?.role;
      return { success: true, role };
    } catch (err) {
      // Surface the underlying network/API failure instead of a generic message,
      // so login problems are not silently hidden.
      console.error("signIn.email threw:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message || "Unable to connect. Please try again." };
    }
  };

  /**
   * Finish a 2FA login with a TOTP code from an authenticator app.
   * `trustDevice` skips the code prompt on subsequent logins from the same
   * browser (requires `trustDevice: true` on the server plugin).
   */
  const verifyTotp = async (
    code: string,
  ): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({ code, trustDevice: true });
      if (error) {
        return { success: false, error: error.message || "Invalid code. Try again." };
      }
      await refetch();
      const role = (data?.user as User | undefined)?.role;
      return { success: true, role };
    } catch {
      return { success: false, error: "Unable to connect. Please try again." };
    }
  };

  /** Trigger the email-OTP fallback (sends a code via `sendOTP`). */
  const sendEmailOtp = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        return { success: false, error: error.message || "Failed to send the email code." };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Unable to connect. Please try again." };
    }
  };

  /** Finish a 2FA login with the code received by email. */
  const verifyEmailOtp = async (
    code: string,
  ): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const { data, error } = await authClient.twoFactor.verifyOtp({ code });
      if (error) {
        return { success: false, error: error.message || "Invalid code. Try again." };
      }
      await refetch();
      const role = (data?.user as User | undefined)?.role;
      return { success: true, role };
    } catch {
      return { success: false, error: "Unable to connect. Please try again." };
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
      });
      if (error) {
        return { success: false, error: "Unable to create your account. Please check your details and try again." };
      }
      if (data?.user) {
        await refetch();
      }
      return { success: true };
    } catch {
      return { success: false, error: "Unable to connect. Please try again." };
    }
  };

  const logout = async () => {
    await authClient.signOut();
    await refetch();
  };

  // 2FA methods
  return {
    user,
    loading,
    login,
    register,
    logout,
    verifyTotp,
    sendEmailOtp,
    verifyEmailOtp,
    authClient,
  };
}