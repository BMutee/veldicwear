import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import { clientIpFrom, verifyOrderCredentials } from "@/lib/order-lookup";
import {
  RETURN_WINDOW_DAYS,
  evaluateReturnWindow,
  isReturnReason,
  makeReturnReference,
  normaliseReturnNote,
  type ReturnWindow,
} from "@/lib/returns";
import { sendReturnRequestConfirmationEmail, sendReturnRequestEmail } from "@/lib/email";

/**
 * Return portal API: look an order up, then submit a return request against it.
 *
 *   GET  /api/returns?orderNumber=…&email=…   → order + its return window
 *   POST /api/returns                          → submit a request
 *
 * Security posture matches the public tracking page: the order number alone
 * proves nothing (they follow a predictable `ORD-<timestamp>-<random>` pattern),
 * so the checkout email is the second factor, verified in lib/order-lookup.ts
 * with a constant-time compare and one generic failure for every kind of wrong
 * answer. Nothing identifying leaves the server except the items the customer
 * already knows they bought.
 *
 * There is no `Return` table, so a submitted request is a notification to the
 * support inbox plus a confirmation to the customer — the human step the Return
 * & Refund Policy already promises ("we'll reply with return instructions").
 */

const RETURN_ORDER_SELECT = {
  orderNumber: true,
  status: true,
  createdAt: true,
  deliveredAt: true,
  items: {
    select: { id: true, name: true, size: true, color: true, quantity: true, price: true },
  },
} as const;

const NOT_FOUND = { error: "Order not found." };

/** Per-IP limits: lookups are cheap, submissions mail a human. */
const LOOKUP_LIMIT = { maxAttempts: 10, windowSeconds: 600 } as const;
const SUBMIT_LIMIT = { maxAttempts: 5, windowSeconds: 600 } as const;
/** Per-order backstop so one order can't be used to flood the support inbox. */
const SUBMIT_PER_ORDER_LIMIT = { maxAttempts: 3, windowSeconds: 24 * 60 * 60 } as const;

const MAX_ITEMS = 50;

/** One sentence per blocked state — the page shows it verbatim. */
function windowMessage(window: ReturnWindow): string {
  switch (window.state) {
    case "in-transit":
      return "This order hasn't been delivered yet, so the return window hasn't opened. Returns open from the delivery date.";
    case "outside-window":
      return `This order is outside the ${RETURN_WINDOW_DAYS}-day return window. If it arrived damaged, faulty or incorrect, email us with photos and we'll put it right.`;
    case "closed":
      return "This order was cancelled or already refunded, so there's nothing to return.";
    default:
      return "This order isn't eligible for a return.";
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(`return-lookup:${clientIpFrom(request)}`, LOOKUP_LIMIT);
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
    if (!verified) return NextResponse.json(NOT_FOUND, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id: verified.id },
      select: RETURN_ORDER_SELECT,
    });
    if (!order) return NextResponse.json(NOT_FOUND, { status: 404 });

    // The window is decided here, not in the browser: the client renders what
    // the server says, and POST re-checks it so a stale page can't sneak past.
    return NextResponse.json({ order, window: evaluateReturnWindow(order) });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve this order." }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFrom(request);
    if (!checkRateLimit(`return-request:${ip}`, SUBMIT_LIMIT).allowed) {
      return NextResponse.json(
        { error: "Too many return requests from this device. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const verified = await verifyOrderCredentials(payload.orderNumber, payload.email);
    if (!verified) return NextResponse.json(NOT_FOUND, { status: 404 });

    if (!checkRateLimit(`return-request-order:${verified.id}`, SUBMIT_PER_ORDER_LIMIT).allowed) {
      return NextResponse.json(
        {
          error:
            "We've already received a return request for this order. Check your inbox, or email us if you need to change it.",
        },
        { status: 429 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: verified.id },
      select: { ...RETURN_ORDER_SELECT, email: true },
    });
    if (!order) return NextResponse.json(NOT_FOUND, { status: 404 });

    const window = evaluateReturnWindow(order);
    if (!window.eligible) {
      return NextResponse.json({ error: windowMessage(window), window }, { status: 409 });
    }

    if (!isReturnReason(payload.reason)) {
      return NextResponse.json({ error: "Please choose a reason for the return." }, { status: 400 });
    }

    // Item ids are resolved against the order's own rows, so a hand-rolled
    // request can't return an item that isn't in this order, and the amounts
    // support receives are the database's, never the client's.
    const requested = Array.isArray(payload.itemIds)
      ? [
          ...new Set(
            payload.itemIds.filter((id): id is string => typeof id === "string")
          ),
        ].slice(0, MAX_ITEMS)
      : [];
    if (requested.length === 0) {
      return NextResponse.json(
        { error: "Please choose at least one item to return." },
        { status: 400 },
      );
    }
    const items = order.items.filter((item) => requested.includes(item.id));
    if (items.length !== requested.length) {
      return NextResponse.json(
        { error: "One of the items you selected is not part of this order. Please look the order up again." },
        { status: 400 },
      );
    }

    const reference = makeReturnReference();
    const note = normaliseReturnNote(payload.note);

    try {
      await sendReturnRequestEmail({
        to: process.env.RETURNS_NOTIFICATION_EMAIL ?? undefined,
        customerEmail: order.email,
        orderNumber: order.orderNumber,
        reference,
        reason: payload.reason,
        note,
        items: items.map((item) => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      await sendReturnRequestConfirmationEmail({
        to: order.email,
        orderNumber: order.orderNumber,
        reference,
        reason: payload.reason,
        itemCount: items.reduce((total, item) => total + item.quantity, 0),
        items: items.map((item) => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      });
    } catch {
      // Nothing is stored, so a failed notification means the request never
      // reached us. Say that instead of handing back a reference nobody will act on.
      return NextResponse.json(
        {
          error:
            "We couldn't submit your request right now. Please try again, or email us and we'll sort it out.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ reference, window });
  } catch {
    return NextResponse.json({ error: "Unable to submit this return request." }, { status: 500 });
  }
}
