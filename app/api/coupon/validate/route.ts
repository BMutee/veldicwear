import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupon";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: "Please enter a coupon code." }, { status: 400 });
    }

    const amount = typeof subtotal === "number" && !isNaN(subtotal) ? subtotal : 0;
    const result = await validateCoupon(code, amount);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      code: result.code,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : "Failed to validate coupon." },
      { status: 500 },
    );
  }
}