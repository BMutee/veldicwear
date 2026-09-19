import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { auth } from "@/lib/auth-server";
import { createOrderFromStripeSession } from "@/lib/createOrderFromStripeSession";
import { createOrderTrackingToken } from "@/lib/order-tracking";
import { prisma } from "@/lib/prisma";
import { sourcingRequiredFromStock } from "@/lib/getDeliveryEstimate";

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  let linkingUserId: string | null = null;

  try {
    const body = await request.json();
    sessionId = body.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid session ID." },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.object !== "checkout.session") {
      return NextResponse.json(
        { error: "Unable to retrieve checkout session." },
        { status: 404 },
      );
    }

    const paymentStatus = session.payment_status;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    if (paymentStatus !== "paid") {
      return NextResponse.json(
        {
          error: "Payment was not completed.",
          paymentStatus,
          paymentIntentId,
        },
        { status: 402 },
      );
    }

    // Detect the current user from the browser session (available on this
    // redirect-back request, unlike the checkout API which sometimes fails).
    // Pass as linkingUserId so createOrderFromStripeSession has a fallback
    // when Stripe session metadata lacks user info.
    const authSession = await auth.api.getSession({ headers: request.headers });
    linkingUserId = authSession?.user?.id ?? null;

    // Use shared helper — idempotent via stripeSessionId check
    const result = await createOrderFromStripeSession(session, linkingUserId);
    const trackingToken = createOrderTrackingToken(result.order.id);

    // Delivery estimate for the confirmation page. There is no stored sourcing
    // flag on Product, so it is derived from live CJ-synced stock (stock <= 0 =
    // must be sourced, stock > 0 = ships fast). Best-effort: if the lookup
    // fails the client falls back to the conservative "needs sourcing" window,
    // and the customer — who has already paid — still gets a confirmation.
    const availableStockByProductId = new Map<string, number>();
    try {
      const orderedProductIds = Array.from(
        new Set(
          result.items
            .map((item: { productId?: string }) => item.productId)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      );

      if (orderedProductIds.length > 0) {
        const productRows = await prisma.product.findMany({
          where: { id: { in: orderedProductIds } },
          select: { id: true, stock: true, variants: { select: { stock: true } } },
        });

        for (const row of productRows) {
          // A product is on hand if any variant (or its own stock) is positive.
          availableStockByProductId.set(
            row.id,
            Math.max(row.stock, ...row.variants.map((variant) => variant.stock), 0),
          );
        }
      }
    } catch (stockLookupError) {
      console.error("Order confirm: delivery-estimate stock lookup failed", stockLookupError);
    }

    // Attempt to send confirmation email — whether or not this request created the order.
    // The webhook may have created it first (race condition), in which case result.created
    // is false but the customer still deserves a confirmation.
    let emailSent = false;
    if (result.emailAddress) {
      try {
        await sendOrderConfirmationEmail({
          to: result.emailAddress,
          orderId: result.order.id,
          orderNumber: result.orderNumber,
          orderTotal: result.orderTotal,
          trackingToken,
          items: result.items.map((item: { name: string; size: string; quantity: number; price: number }) => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send confirmation email", emailError);
      }
    }

    return NextResponse.json({
      orderId: result.order.id,
      orderNumber: result.orderNumber,
      email: result.emailAddress,
      sent: emailSent,
      message: result.created ? "Order created and confirmed." : "Order was already confirmed.",
      stripePaymentId: paymentIntentId,
      paymentStatus,
      trackingToken,
      order: {
        id: result.order.id,
        orderNumber: result.orderNumber,
        firstName: result.order.firstName,
        lastName: result.order.lastName,
        email: result.order.email,
        phone: result.order.phone,
        country: result.order.country,
        city: result.order.city,
        address: result.order.address,
        postalCode: result.order.postalCode,
        total: result.order.total,
        status: result.order.status,
        hasShippingProtection: result.order.hasShippingProtection,
        createdAt: result.order.createdAt,
        items: result.items.map((item: { name: string; size: string; quantity: number; price: number; productId?: string }) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          sourcingRequired: sourcingRequiredFromStock(
            (item.productId ? availableStockByProductId.get(item.productId) : undefined) ?? 0,
          ),
        })),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to confirm order.";

    // Race safeguard: if the webhook created the order before us (unique
    // constraint violation on stripeSessionId), try to link it now.
    if (msg.includes("Unique constraint") || msg.includes("stripeSessionId")) {
      try {
        const existing = await prisma.order.findFirst({
          where: { stripeSessionId: sessionId },
        });
        if (existing && !existing.userId && linkingUserId) {
          await prisma.order.update({
            where: { id: existing.id },
            data: { userId: linkingUserId },
          });
          console.log(`Confirm fallback: linked order ${existing.orderNumber} to user ${linkingUserId}`);
        }
      } catch { /* best-effort */ }
    }

    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
