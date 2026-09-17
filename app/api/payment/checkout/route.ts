import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupon";
import {
  SHIPPING_PROTECTION_PRICE,
  SHIPPING_PROTECTION_LABEL,
  SHIPPING_PROTECTION_DESCRIPTION,
} from "@/lib/shipping-protection";
import { CURRENCY_COOKIE } from "@/lib/currency-map";
import {
  resolveCheckoutCurrencyPlan,
  toStripeUnitAmount,
} from "@/lib/checkout-currency";
import { resolveRequestBaseUrl } from "@/lib/base-url";

type ProductWithVariants = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  image: string;
  variants: Array<{
    id: string;
    size: string;
    color: string | null;
    stock: number;
    price: number | null;
    costPrice: number | null;
    productId: string;
    cjVariantId: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cart: CartItem[] = body.cart ?? [];

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    for (const item of cart) {
      if (!item.id || !item.size || typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json(
          { error: `Invalid cart item: ${JSON.stringify(item)}` },
          { status: 400 },
        );
      }
    }

    const productIds = [...new Set(cart.map((item) => item.id))];
    const dbProducts: ProductWithVariants[] = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const validatedItems: {
      name: string;
      size: string;
      color?: string;
      quantity: number;
      price: number;
      image: string;
    }[] = [];

    for (const item of cart) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product "${item.id}" not found.` }, { status: 400 });
      }

      const variant = dbProduct.variants.find(
        (v) => v.size === item.size && (item.color == null || v.color === item.color),
      );
      if (!variant) {
        return NextResponse.json(
          { error: `Variant (Size: ${item.size}${item.color ? `, Color: ${item.color}` : ""}) not found for "${dbProduct.name}".` },
          { status: 400 },
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for "${dbProduct.name}" (${item.size}).` },
          { status: 400 },
        );
      }

      validatedItems.push({
        name: `${dbProduct.name} (Size: ${item.size}${item.color ? `, Color: ${item.color}` : ""})`,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: variant.price ?? dbProduct.price,
        image: dbProduct.image,
      });
    }

    // ── Currency resolution ──
    // The proxy matcher EXCLUDES /api routes, so x-viewer-currency is not
    // forwarded here — read the currency cookie directly (set by proxy on
    // page responses / by the navbar picker). Missing cookie -> USD.
    const displayCurrency =
      request.cookies.get(CURRENCY_COOKIE)?.value ?? "USD";
    const plan = await resolveCheckoutCurrencyPlan(displayCurrency);
    const chargeCurrency = plan.chargeCurrency; // "USD" | "CAD"
    const stripeCurrency = chargeCurrency.toLowerCase(); // Stripe wants lowercase

    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: stripeCurrency,
        product_data: {
          name: item.name,
          description: `Size: ${item.size}${item.color ? `, Color: ${item.color}` : ""}`,
          // Stripe only accepts fully-qualified http(s) URLs; the DB may store
          // relative paths (served via next/image locally), so filter those out.
          images: /^https?:\/\//i.test(item.image) ? [item.image] : [],
        },
        unit_amount: toStripeUnitAmount(item.price, chargeCurrency, plan.rate),
      },
      quantity: item.quantity,
    }));

    // ── Shipping protection (server-priced, converted at the locked rate) ──
    const wantsShippingProtection = body.hasShippingProtection === true;
    if (wantsShippingProtection) {
      lineItems.push({
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: SHIPPING_PROTECTION_LABEL,
            description: SHIPPING_PROTECTION_DESCRIPTION,
            images: [],
          },
          unit_amount: toStripeUnitAmount(
            SHIPPING_PROTECTION_PRICE,
            chargeCurrency,
            plan.rate,
          ),
        },
        quantity: 1,
      });
    }

    // ── Coupon (validated server-side against the USD subtotal) ──
    // Percentage discounts need no conversion. Fixed-amount discounts convert
    // via the SAME locked rate used for line items ("auto-converted" pricing).
    let couponDiscount: Extract<
      Awaited<ReturnType<typeof validateCoupon>>,
      { valid: true }
    > | null = null;
    let stripeCouponId: string | undefined;
    const couponCodeInput =
      typeof body.couponCode === "string" ? body.couponCode.trim() : "";
    if (couponCodeInput) {
      const usdSubtotal = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const result = await validateCoupon(couponCodeInput, usdSubtotal);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      couponDiscount = result;
      if (result.discountAmount > 0) {
        const stripeCoupon =
          result.type === "percentage"
            ? await stripe.coupons.create({
                percent_off: result.value,
                duration: "once",
                name: result.code,
              })
            : await stripe.coupons.create({
                amount_off: toStripeUnitAmount(
                  result.discountAmount,
                  chargeCurrency,
                  plan.rate,
                ),
                currency: stripeCurrency,
                duration: "once",
                name: result.code,
              });
        stripeCouponId = stripeCoupon.id;
      }
    }

    const { shipping } = body;
    const customerEmail = shipping?.email ?? "";
    const customerName = `${shipping?.firstName ?? ""} ${shipping?.lastName ?? ""}`.trim();
    // Legacy single-string address kept for display/back-compat.
    const shippingAddress = [
      shipping?.address ?? "",
      shipping?.apartment ? `Apt ${shipping.apartment}` : "",
      shipping?.city ?? "",
      shipping?.country ?? "",
      shipping?.postalCode ?? "",
    ]
      .filter(Boolean)
      .join(", ");
    // Structured copy — the comma-joined string shifts every field after an
    // optional apartment when split, so order creation reads this instead.
    const shippingStructured = JSON.stringify({
      address: shipping?.address ?? "",
      apartment: shipping?.apartment ?? "",
      city: shipping?.city ?? "",
      country: shipping?.country ?? "",
      postalCode: shipping?.postalCode ?? "",
    });
    const customerPhone = shipping?.phone ?? "";

    // Derive from the actual request host (x-forwarded-host) so Stripe always
    // gets a valid public success/cancel URL, even when NEXT_PUBLIC_BASE_URL
    // is missing or set to localhost on the deployment (live mode rejects
    // localhost with "Not a valid URL").
    const baseUrl = resolveRequestBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: customerEmail || undefined,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        shipping_json: shippingStructured,
        cart_items: JSON.stringify(
          cart.map((i) => ({ id: i.id, size: i.size, color: i.color ?? null, quantity: i.quantity })),
        ),
        // ── Locked checkout-currency context ──
        // The rate is captured HERE and later written to Order.currency /
        // Order.exchangeRateUsed exactly once (at order creation). It is
        // never recomputed after this point.
        charge_currency: chargeCurrency,
        exchange_rate_used: plan.rate.toFixed(6),
        display_currency: plan.displayCurrency,
        currency_fallback_to_usd: plan.fallbackToUsd ? "1" : "0",
        ...(wantsShippingProtection ? { shipping_protection: "1" } : {}),
        ...(couponDiscount ? { coupon_code: couponDiscount.code } : {}),
      },
    });

    return NextResponse.json({
      url: session.url,
      chargeCurrency,
      displayCurrency: plan.displayCurrency,
      notice: plan.notice,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 500 },
    );
  }
}