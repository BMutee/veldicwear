import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrderFromStripeSession } from "@/lib/createOrderFromStripeSession";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header." },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET ?? "",
      );
    } catch (err) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "Invalid signature"}` },
        { status: 400 },
      );
    }

    // Only handle completed checkout sessions
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Verify payment was actually completed
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed." },
        { status: 200 }, // Return 200 to acknowledge receipt, but don't create order
      );
    }

    // Create order using the shared helper — idempotent via stripeSessionId check
    const result = await createOrderFromStripeSession(session);

    if (result.created) {
      console.log(`Webhook: Order ${result.orderNumber} created from session ${session.id}`);
    } else {
      console.log(`Webhook: Order ${result.orderNumber} already existed for session ${session.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed." },
      { status: 500 },
    );
  }
}