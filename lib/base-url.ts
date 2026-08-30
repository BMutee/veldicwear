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

/**
 * Resolve the public base URL for absolute redirects (Stripe success/cancel
 * URLs, email links, ...) from the incoming request.
 *
 * Why not just `NEXT_PUBLIC_BASE_URL`?
 * - The var can be missing — or point at localhost — in the hosting
 *   dashboard. Stripe live mode then rejects the checkout session with
 *   `Not a valid URL`, breaking every order at the final step.
 * - The request headers (`x-forwarded-host` / `x-forwarded-proto`, set by
 *   the platform) always reflect the public host the customer actually
 *   browsed, and work identically on production, preview deployments and
 *   local dev.
 *
 * Env vars are kept as sanitised fallbacks (same rules as resolveBaseUrl).
 * A `localhost` candidate is only ever accepted when the request itself is
 * local, so a public deployment can never hand Stripe a localhost URL.
 */
export function resolveRequestBaseUrl(request: {
  headers: { get(name: string): string | null };
}): string {
  const first = (value: string | null) => value?.split(",")[0]?.trim() || "";

  const forwardedHost = first(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || first(request.headers.get("host"));
  const forwardedProto = first(request.headers.get("x-forwarded-proto"));

  const isLocalHost = (h: string) =>
    !h ||
    h.startsWith("localhost") ||
    h.startsWith("127.0.0.1") ||
    h.startsWith("0.0.0.0") ||
    h.endsWith(".local") ||
    h.endsWith(".localhost");

  const proto = forwardedProto || (isLocalHost(host) ? "http" : "https");
  const requestIsLocal = isLocalHost(host);

  const candidates = [
    host ? `${proto}://${host}` : "",
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BETTER_AUTH_URL,
  ];

  for (const raw of candidates) {
    const value = (raw || "").trim().replace(/\/+$/, "");
    if (!value || value === "undefined" || value === "null") continue;

    // Add scheme if the host was pasted without it (e.g. "veldicwear.com")
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;

    try {
      const url = new URL(withScheme);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      // Reject garbage like "https://not a url" / "https://undefined": a real
      // host always has a dot (or is localhost).
      const hostname = url.hostname;
      const looksLikeHost =
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.includes(".");
      if (!looksLikeHost) continue;
      // Never hand Stripe a localhost URL from a public request.
      if (!requestIsLocal && isLocalHost(url.host)) continue;
      return `${url.protocol}//${url.host}`;
    } catch {
      // Invalid candidate — keep trying the next one.
      continue;
    }
  }

  // Default that always works so checkout survives a broken config.
  return process.env.NODE_ENV === "production"
    ? "https://veldicwear.com"
    : "http://localhost:3000";
}