import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { checkSingleCjTracking } from "@/lib/cj-tracking";

/**
 * Admin-triggered endpoint to check CJ tracking for a specific order.
 * Protected by requireAdminApi — only authenticated admins can call this.
 *
 * Queries CJ's logistic/get-tracking-information endpoint.
 * If tracking info is available, updates the order's trackingNumber,
 * trackingCarrier, and sets status to "Shipped" (sending the customer
 * a shipped notification email on the transition).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await checkSingleCjTracking(id);

    // Fetch the updated order to return full state
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        trackingCarrier: true,
        cjFulfillmentStatus: true,
        cjOrderId: true,
      },
    });

    return NextResponse.json({
      success: result.updated,
      result,
      order,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "CJ tracking check failed.",
      },
      { status: 500 }
    );
  }
}