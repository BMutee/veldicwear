import { prisma } from "@/lib/prisma";
import { cjGet } from "@/lib/cj";
import { sendOrderShippedEmail } from "@/lib/email";

/**
 * Check CJ tracking for a single order that has been sent to CJ.
 *
 * 1. Queries CJ's logistic/get-tracking-information endpoint
 * 2. If tracking info is available (tracking number present), updates our Order:
 *    - trackingNumber, trackingCarrier
 *    - status = "Shipped" (only if not already "Shipped")
 *    - sends sendOrderShippedEmail() on the Shipped transition
 * 3. If CJ hasn't shipped yet, returns without changes
 *
 * Uses the same previousStatus !== "Shipped" guard as the admin PUT endpoint
 * to prevent duplicate "shipped" emails if this runs multiple times.
 */
export async function checkSingleCjTracking(
  orderId: string
): Promise<{
  updated: boolean;
  shipped: boolean;
  trackingNumber?: string;
  trackingCarrier?: string;
  message: string;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { updated: false, shipped: false, message: "Order not found." };
  }

  // Only check orders that have been sent to CJ
  if (order.cjFulfillmentStatus !== "sent" || !order.cjOrderId) {
    return {
      updated: false,
      shipped: false,
      message: `Order ${order.orderNumber} is not in "sent" CJ status. Skipping.`,
    };
  }

  // If already marked as Shipped in our system, skip
  if (order.status === "Shipped") {
    return {
      updated: false,
      shipped: true,
      trackingNumber: order.trackingNumber ?? undefined,
      trackingCarrier: order.trackingCarrier ?? undefined,
      message: `Order ${order.orderNumber} is already marked as Shipped.`,
    };
  }

  try {
    // Query CJ for tracking information
    const trackingResponse = await cjGet<{
      trackingNumber?: string;
      trackingFrom?: string;
      trackingTo?: string;
      deliveryDay?: string;
      deliveryTime?: string;
      trackingStatus?: string;
      logisticName?: string;
      [key: string]: unknown;
    }>("logistic/get-tracking-information", {
      orderId: order.cjOrderId,
    });

    const trackingData = trackingResponse.data;

    // Check if CJ has provided a tracking number
    const cjTrackingNumber = trackingData?.trackingNumber;
    const cjCarrier = trackingData?.logisticName ?? trackingData?.trackingFrom ?? "";

    if (!cjTrackingNumber) {
      return {
        updated: false,
        shipped: false,
        message: `CJ has not yet shipped order ${order.orderNumber}. No tracking number available.`,
      };
    }

    // CJ has shipped! Update our order
    const previousStatus = order.status;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: cjTrackingNumber,
        trackingCarrier: cjCarrier || null,
        status: "Shipped",
      },
    });

    // Send email only on transition INTO "Shipped" (not if already "Shipped")
    const transitioningToShipped = previousStatus !== "Shipped";
    if (transitioningToShipped) {
      try {
        await sendOrderShippedEmail({
          to: order.email,
          orderNumber: order.orderNumber,
          trackingCarrier: cjCarrier || undefined,
          trackingNumber: cjTrackingNumber,
          items: order.items.map((item) => ({
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        });
        console.log(
          `checkSingleCjTracking: Shipped email sent for order ${order.orderNumber}`
        );
      } catch (emailError) {
        console.error(
          `checkSingleCjTracking: Failed to send shipped email for order ${order.orderNumber}:`,
          emailError
        );
      }
    }

    return {
      updated: true,
      shipped: true,
      trackingNumber: cjTrackingNumber,
      trackingCarrier: cjCarrier || undefined,
      message: `Order ${order.orderNumber} updated to Shipped. Tracking: ${cjTrackingNumber}${cjCarrier ? ` (${cjCarrier})` : ""}`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown CJ tracking error";
    console.error(
      `checkSingleCjTracking: Failed for order ${order.orderNumber}: ${errorMessage}`
    );
    return {
      updated: false,
      shipped: false,
      message: `CJ tracking query failed: ${errorMessage}`,
    };
  }
}

/**
 * Check CJ tracking for ALL orders that are in "sent" status and not yet "Shipped".
 * Called by the cron job to batch-process pending shipments.
 */
export async function checkAllCjTracking(): Promise<{
  total: number;
  updated: number;
  alreadyShipped: number;
  notYetShipped: number;
  errors: number;
  results: Array<{ orderNumber: string; message: string }>;
}> {
  // Find all orders that have been sent to CJ but not yet marked as Shipped in our system
  const pendingOrders = await prisma.order.findMany({
    where: {
      cjFulfillmentStatus: "sent",
      cjOrderId: { not: null },
      status: { not: "Shipped" },
    },
    select: { id: true, orderNumber: true },
  });

  const results: Array<{ orderNumber: string; message: string }> = [];
  let updated = 0;
  let alreadyShipped = 0;
  let notYetShipped = 0;
  let errors = 0;

  for (const order of pendingOrders) {
    try {
      const result = await checkSingleCjTracking(order.id);
      results.push({
        orderNumber: order.orderNumber,
        message: result.message,
      });
      if (result.updated) updated++;
      if (result.shipped && !result.updated) alreadyShipped++;
      if (!result.shipped && !result.updated) notYetShipped++;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      results.push({
        orderNumber: order.orderNumber,
        message: `Error: ${errorMessage}`,
      });
      errors++;
    }
  }

  return {
    total: pendingOrders.length,
    updated,
    alreadyShipped,
    notYetShipped,
    errors,
    results,
  };
}