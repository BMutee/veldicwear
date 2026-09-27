import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/order-tracking";
import { checkRateLimit } from "@/lib/rate-limiter";
import { clientIpFrom, verifyOrderCredentials } from "@/lib/order-lookup";

/**
 * Shared shape for the public tracking page. No customer PII leaves this
 * endpoint — in particular no email, phone or street address — so a tracking
 * link (or an order number + matching email) is safe to view in any browser.
 * Color is included so the page shows the exact variant ordered, same as the
 * order confirmation email.
 */
const PUBLIC_TRACKING_SELECT = {
  orderNumber: true,
  status: true,
  createdAt: true,
  deliveredAt: true,
  // The customer's whole reason for opening the page: read this number off
  // (or copy it) and see which carrier holds the parcel.
  trackingNumber: true,
  trackingCarrier: true,
  items: { select: { name: true, size: true, color: true, quantity: true } },
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const orderId = verifyOrderTrackingToken(token);
    if (!orderId) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: PUBLIC_TRACKING_SELECT,
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve this order." }, { status: 500 });
  }
}

/**
 * Order-number lookup for customers who lost the email link.
 *
 * The order number alone is NOT enough (order numbers follow a predictable
 * `ORD-<timestamp>-<random>` pattern and can be sprayed) — the checkout email
 * is required as the second factor. Both halves are rate limited per IP, the
 * response is identical (plain 404) whether the number or the email was wrong,
 * and the email itself is never returned in any response.
 *
 * The credential check itself lives in lib/order-lookup.ts so the returns portal
 * cannot drift into a weaker version of these defences.
 */
export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(`order-lookup:${clientIpFrom(request)}`, {
      maxAttempts: 10,
      windowSeconds: 600,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many lookups. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const params = request.nextUrl.searchParams;
    const verified = await verifyOrderCredentials(
      params.get("orderNumber"),
      params.get("email")
    );
    if (!verified) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id: verified.id },
      select: PUBLIC_TRACKING_SELECT,
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve this order." }, { status: 500 });
  }
}
