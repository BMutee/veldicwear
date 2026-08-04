import { prisma } from "./prisma";

export type CouponValidation = {
  valid: false;
  error: string;
} | {
  valid: true;
  discountAmount: number;
  code: string;
  couponId: string;
};

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  if (!code?.trim()) {
    return { valid: false, error: "Please enter a coupon code." };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon) {
    return { valid: false, error: "Coupon code not found." };
  }

  if (!coupon.active) {
    return { valid: false, error: "This coupon is no longer active." };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "This coupon has expired." };
  }

  if (coupon.maxUses !== null && coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return {
      valid: false,
      error: `Minimum order amount of $${coupon.minOrder.toFixed(2)} required for this coupon.`,
    };
  }

  let discountAmount = 0;

  if (coupon.type === "percentage") {
    discountAmount = subtotal * (coupon.value / 100);
  } else if (coupon.type === "fixed") {
    discountAmount = coupon.value;
  }

  // Discount cannot exceed the subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    discountAmount,
    code: coupon.code,
    couponId: coupon.id,
  };
}

/**
 * Atomically increments usedCount — only if the coupon hasn't reached its
 * maxUses limit. Uses a single SQL UPDATE with a WHERE guard so that if
 * two requests race, the second one matches zero rows and silently fails.
 *
 * PostgreSQL UPDATE ... WHERE is atomic — the row-level lock ensures only
 * one request can increment at a time, and the WHERE condition prevents
 * exceeding maxUses.
 */
export async function incrementCouponUsage(code: string): Promise<boolean> {
  try {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "Coupon"
       SET "usedCount" = "usedCount" + 1
       WHERE "code" = $1
         AND "active" = true
         AND ("maxUses" = 0 OR "usedCount" < "maxUses")`,
      code,
    );
    return result > 0;
  } catch (error) {
    console.error("Failed to increment coupon usage:", error);
    return false;
  }
}