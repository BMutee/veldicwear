import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Extension API keys.
 *
 * Format: `vw_<43 chars of base64url>` (32 random bytes = 256 bits of
 * entropy, so a plain SHA-256 hash is the right storage choice — no slow
 * KDF needed because the key cannot be brute-forced).
 *
 * The raw key is returned ONLY by generateExtensionApiKey() at creation
 * time; only the hash is persisted.
 */

export const EXTENSION_KEY_PREFIX = "vw_";

export function hashExtensionKey(rawKey: string): string {
  return createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export type GeneratedExtensionKey = {
  id: string;
  /** The raw key — shown once to the admin, never stored. */
  key: string;
  name: string | null;
  createdAt: Date;
};

export async function generateExtensionApiKey(name?: string): Promise<GeneratedExtensionKey> {
  const key = EXTENSION_KEY_PREFIX + randomBytes(32).toString("base64url");
  const record = await prisma.extensionApiKey.create({
    data: { keyHash: hashExtensionKey(key), name: name?.trim() || null },
  });
  return { id: record.id, key, name: record.name, createdAt: record.createdAt };
}

export type ValidatedKey = { id: string };

/**
 * Validate a raw Bearer key against the stored hashes.
 * timingSafeEqual prevents hash-comparison timing leaks.
 */
export async function validateExtensionApiKey(rawKey: string): Promise<ValidatedKey | null> {
  const provided = Buffer.from(hashExtensionKey(rawKey), "hex");
  const candidates = await prisma.extensionApiKey.findMany({
    where: { keyHash: provided.toString("hex") },
    select: { id: true, revoked: true },
    take: 1,
  });
  const match = candidates[0];
  if (!match || match.revoked) return null;

  // Constant-time confirmation (defense in depth; the unique index already
  // narrowed this to one row).
  const stored = await prisma.extensionApiKey.findUniqueOrThrow({
    where: { id: match.id },
    select: { keyHash: true },
  });
  const storedBuf = Buffer.from(stored.keyHash, "hex");
  if (storedBuf.length !== provided.length || !timingSafeEqual(storedBuf, provided)) return null;

  return { id: match.id };
}

export async function touchExtensionKeyLastUsed(keyId: string): Promise<void> {
  await prisma.extensionApiKey.update({
    where: { id: keyId },
    data: { lastUsedAt: new Date() },
  });
}
