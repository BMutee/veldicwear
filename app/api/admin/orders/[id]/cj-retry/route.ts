import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { cjFulfillOrder } from "@/lib/cj-fulfillment";
import { prisma } from "@/lib/prisma";

/**
 * Admin-triggered endpoint to retry CJ fulfillment for a failed order.
 * Re-runs the add-cart + confirm-cart flow.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    await cjFulfillOrder(id);

    // Fetch the updated order to return its current state
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        cjFulfillmentStatus: true,
        cjOrderId: true,
        cjCartReference: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "CJ fulfillment retry completed.",
      order,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "CJ fulfillment retry failed.",
      },
      { status: 500 }
    );
  }
}