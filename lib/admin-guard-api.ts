import { auth } from "./auth-server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * API route guard for admin endpoints.
 * Call this at the top of any admin API route handler.
 * Returns the user object if authorized.
 * Returns NextResponse (401/403) if not.
 */
export async function requireAdminApi() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = session.user as typeof session.user & { role?: string };

  if (user.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }),
    };
  }

  return { user, error: null };
}