// ─── Theme-editor preview token ──────────────────────────────────────────────
// The Shopify theme editor previews hidden/draft sections through an
// authenticated preview URL. This applies the same logic: /admin/editor (which
// is admin-guarded) mints a short-lived HMAC token, and the homepage embeds it
// as /?preview=1&t=<token> inside the editor's live-preview iframe. With a
// valid token the homepage renders ALL sections (drafts included); without
// one, only published sections render — so unpublished content is never
// exposed publicly.
//
// The HMAC secret is derived from DATABASE_URL (always present in this app),
// so no extra environment variable is required. Tokens expire, so a link that
// leaks stops working.

import { createHmac, timingSafeEqual } from "crypto";

const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000; // 24h — comfortably longer than an editing session

function secret(): string {
  return process.env.DATABASE_URL ?? "veldic-wear-dev-preview-secret";
}

function signature(expiry: number): string {
  return createHmac("sha256", secret()).update(`veldic-preview:${expiry}`).digest("hex");
}

/** Mint a preview token valid for PREVIEW_TTL_MS. Admin pages only. */
export function createPreviewToken(ttlMs: number = PREVIEW_TTL_MS): string {
  const expiry = Date.now() + ttlMs;
  return `${expiry}.${signature(expiry)}`;
}

/** True when the token is well-formed, unexpired, and correctly signed. */
export function verifyPreviewToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const expiry = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(expiry) || expiry < Date.now() || !sig) return false;
  const expected = signature(expiry);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
