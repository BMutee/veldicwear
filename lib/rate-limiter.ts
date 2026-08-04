/**
 * Simple in-memory rate limiter.
 * Tracks request counts per IP/user within a window.
 * 
 * For production, consider using Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  /** Number of allowed attempts */
  maxAttempts: number;
  /** Window in seconds */
  windowSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxAttempts: 5, windowSeconds: 300 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request or window expired
    store.set(key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    });
    return { allowed: true, remaining: options.maxAttempts - 1, resetAt: now + options.windowSeconds * 1000 };
  }

  if (entry.count >= options.maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxAttempts - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit for login attempts (per IP per email)
 */
export function checkLoginRateLimit(ip: string, email: string): ReturnType<typeof checkRateLimit> {
  return checkRateLimit(`login:${ip}:${email}`, { maxAttempts: 5, windowSeconds: 300 });
}

/**
 * Rate limit for 2FA verification attempts
 */
export function checkTFARateLimit(userId: string): ReturnType<typeof checkRateLimit> {
  return checkRateLimit(`tfa:${userId}`, { maxAttempts: 3, windowSeconds: 300 });
}

/**
 * Rate limit for 2FA code requests
 */
export function checkTFACodeRateLimit(userId: string): ReturnType<typeof checkRateLimit> {
  return checkRateLimit(`tfa-code:${userId}`, { maxAttempts: 3, windowSeconds: 60 });
}