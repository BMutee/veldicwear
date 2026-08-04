import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { cjCompletePayment } from "@/lib/cj-fulfillment";

/**
 * Admin-triggered endpoint to complete CJ payment for an order.
 * Calls pay-balance-v2 to finalize the CJ order.
 * Only works for orders in "ready_to_pay" status.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    await cjCompletePayment(id);
    return NextResponse.json({
      success: true,
      message: "CJ payment completed successfully.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "CJ payment failed.",
      },
      { status: 500 }
    );
  }
}