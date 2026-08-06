import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/cart";

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-06-24.dahlia",
});

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

    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: `Size: ${item.size}${item.color ? `, Color: ${item.color}` : ""}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // ── Extract shipping info from request body ──
    const { shipping } = body;
    const customerEmail = shipping?.email ?? "";
    const customerName = `${shipping?.firstName ?? ""} ${shipping?.lastName ?? ""}`.trim();
    const shippingAddress = [
      shipping?.address ?? "",
      shipping?.apartment ? `Apt ${shipping.apartment}` : "",
      shipping?.city ?? "",
      shipping?.country ?? "",
      shipping?.postalCode ?? "",
    ]
      .filter(Boolean)
      .join(", ");
    const customerPhone = shipping?.phone ?? "";

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: customerEmail || undefined,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        cart_items: JSON.stringify(
          cart.map((i) => ({ id: i.id, size: i.size, color: i.color ?? null, quantity: i.quantity })),
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 500 },
    );
  }
}