/**
 * Resolve a valid Better Auth base URL without throwing.
 *
 * Better Auth crashes with `Invalid base URL: [REDACTED]` when the
 * `BETTER_AUTH_URL` / `NEXT_PUBLIC_BASE_URL` env var is missing or not a
 * well-formed absolute URL (e.g. in the Vercel dashboard it can be unset).
 *
 * This helper sanitises the configured value (strips trailing slashes,
 * adds the scheme when missing) and falls back to a sensible default so a
 * broken/missing env var never takes the whole admin panel down at runtime.
 */
export function resolveBaseUrl(): string {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ];

  for (const raw of candidates) {
    const value = (raw || "").trim().replace(/\/+$/, "");
    if (!value) continue;

    // Add scheme if the host was pasted without it (e.g. "veldicwear.com")
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;

    try {
      new URL(withScheme);
      return withScheme;
    } catch {
      // Invalid candidate — keep trying the next one.
      continue;
    }
  }

  // Default that always works so the app (and admin) survive a bad config.
  return process.env.NODE_ENV === "production"
    ? "https://veldicwear.com"
    : "http://localhost:3000";
}