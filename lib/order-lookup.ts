import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Two-factor order lookup: the order number plus the email on the order.
 *
 * The order number alone is NOT enough — order numbers follow a predictable
 * `ORD-<timestamp>-<random>` pattern and can be sprayed — so the checkout email
 * is required as the second factor. Shared by the public tracking page and the
 * returns portal so the scraping defences live in exactly one place:
 *
 *   - one generic failure for "no such number" and "wrong email", so nobody can
 *     probe which order numbers exist;
 *   - a constant-time email compare, run even when the number missed, so the
 *     response time doesn't leak which half was wrong.
 *
 * Returns only the order id, so each caller keeps its own least-privilege
 * `select` and decides what may leave the server.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MAX_ORDER_NUMBER = 64;
const MAX_EMAIL = 254;

/**
 * Customers retype both fields by hand, so normalise the way the tracking page
 * always has: trim the number, trim + lowercase the email, and cap both.
 */
export function normaliseLookupCredentials(
  rawOrderNumber: unknown,
  rawEmail: unknown
): { orderNumber: string; email: string; rawOrderNumber: string } | null {
  const raw = typeof rawOrderNumber === "string" ? rawOrderNumber : "";
  const email = (typeof rawEmail === "string" ? rawEmail : "").trim().toLowerCase().slice(0, MAX_EMAIL);
  const orderNumber = raw.trim().toUpperCase().slice(0, MAX_ORDER_NUMBER);
  if (!orderNumber || !EMAIL_RE.test(email)) return null;
  return { orderNumber, email, rawOrderNumber: raw.trim().slice(0, MAX_ORDER_NUMBER) };
}

/** Resolve the order id for a customer-supplied order number + email, or null. */
export async function verifyOrderCredentials(
  rawOrderNumber: unknown,
  rawEmail: unknown
): Promise<{ id: string } | null> {
  const credentials = normaliseLookupCredentials(rawOrderNumber, rawEmail);
  if (!credentials) return null;
  const { orderNumber, email, rawOrderNumber: asTyped } = credentials;

  const order = await prisma.order.findFirst({
    where: { OR: [{ orderNumber }, { orderNumber: asTyped }] },
    select: { id: true, email: true },
  });

  const expected = Buffer.from(order?.email?.trim().toLowerCase() ?? "");
  const supplied = Buffer.from(email);
  const matched =
    expected.length > 0 &&
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected);

  if (!order || !matched) return null;
  return { id: order.id };
}

/** Best-effort client IP for rate limiting, matching the tracking page. */
export function clientIpFrom(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
