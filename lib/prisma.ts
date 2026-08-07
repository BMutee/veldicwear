// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

/**
 * Lazily construct the PrismaClient on first access.
 *
 * Why lazy:
 * - During `next build`, Next.js imports route modules to collect page data.
 *   If we eagerly `throw` when DATABASE_URL is missing, EVERY build breaks on
 *   Netlify (which does not expose runtime env vars to the build worker).
 * - Defer construction to first use so the module loads cleanly during build.
 *   The first DB access at runtime still throws a clear error if DATABASE_URL
 *   is missing.
 */
function getPrisma(): PrismaClient {
  if (globalThis.__prismaClient) return globalThis.__prismaClient;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable for Prisma client.");
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__prismaClient = client;
  }

  return client;
}

/**
 * Drop-in proxy that defers PrismaClient construction until the first property
 * access. Existing call sites like `prisma.user.findMany(...)` continue to work
 * unchanged because the proxy forwards every property access to the real
 * client instance.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
