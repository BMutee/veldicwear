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

// Create a shared client instance with 2FA support
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient(),
  ],
});

export function useAuth() {
  const { data: session, isPending: loading, refetch } = authClient.useSession();
  const user = (session?.user as User | undefined) ?? null;

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string; twoFactorRedirect?: boolean }> => {
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) {
        return { success: false, error: error.message || "Invalid email or password." };
      }
      if (data?.user) {
        await refetch();
      }
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
    authClient,
  };
}