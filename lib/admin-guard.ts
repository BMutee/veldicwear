import { auth } from "./auth-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

/**
 * Server-side admin guard.
 * Call this at the top of any admin page or layout.
 * Returns the user if they are authenticated AND role === "admin".
 * Redirects to / if not authorized.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  // The role field comes from Better Auth's additionalFields
  const user = session.user as typeof session.user & { role?: string };

  if (user.role !== "admin") {
    redirect("/login");
  }

  return user;
}

/**
 * For API routes: returns the session user or null.
 */
export async function getOptionalSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/**
 * Log a security event to the audit trail
 */
export async function logSecurityEvent(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  try {
    const headersList = await headers();
    await prisma.securityAuditLog.create({
      data: {
        userId,
        action,
        ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined,
        userAgent: headersList.get("user-agent") || undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch {
    // Audit logging should never crash the request
    console.error("Failed to log security event:", action);
  }
}