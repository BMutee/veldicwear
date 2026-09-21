import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sendOrderShippedEmail } from "@/lib/email";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // ── Attach costPrice from matching variant to each item ──
  const enrichedItems = order.items.map((item: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    quantity: number;
    price: number;
    productId: string;
    product: {
      variants: Array<{ id: string; size: string; color: string | null; stock: number; price: number | null; costPrice: number | null; productId: string; cjVariantId: string | null }>;
    };
  }) => {
    const matchingVariant = item.product?.variants?.find(
      (v) => v.size === item.size
    );
    return {
      ...item,
      costPrice: matchingVariant?.costPrice ?? null,
      variantId: matchingVariant?.id ?? null,
      product: undefined, // strip product to keep payload clean
    };
  });

  const { items: _items, ...orderWithoutItems } = order;
  return NextResponse.json({
    ...orderWithoutItems,
    OrderItem: enrichedItems,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const validStatuses = ["Ordered", "Processing", "Shipped", "Delivered", "Cancelled"];
  const errors: string[] = [];

  if (body.status && !validStatuses.includes(body.status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }
  if (body.trackingNumber && typeof body.trackingNumber !== "string") {
    errors.push("Tracking number must be a string.");
  }
  if (body.trackingCarrier && typeof body.trackingCarrier !== "string") {
    errors.push("Tracking carrier must be a string.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // Read the current order to detect status transitions
  const currentOrder = await prisma.order.findUnique({ where: { id } });
  if (!currentOrder) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const previousStatus = currentOrder.status;
  const updateData: Prisma.OrderUpdateInput = {};

  if (body.status) {
    updateData.status = body.status;
    if (body.status === "Delivered") {
      updateData.deliveredAt = new Date();
    }
  }

  if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber || null;
  if (body.trackingCarrier !== undefined) updateData.trackingCarrier = body.trackingCarrier || null;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  // Send email ONLY when status actually transitions INTO "Shipped" from a different status
  const transitioningToShipped = body.status === "Shipped" && previousStatus !== "Shipped";
  if (transitioningToShipped) {
    try {
      await sendOrderShippedEmail({
        to: order.email,
        orderNumber: order.orderNumber,
        trackingCarrier: order.trackingCarrier || undefined,
        trackingNumber: order.trackingNumber || undefined,
        items: order.items.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        })),
      });
    } catch (emailError) {
      console.error("Failed to send shipped email:", emailError);
    }
  }

  return NextResponse.json(order);
}