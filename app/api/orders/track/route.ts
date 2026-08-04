import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/order-tracking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const orderId = verifyOrderTrackingToken(token);
    if (!orderId) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        items: { select: { name: true, size: true, quantity: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve this order." }, { status: 500 });
  }
}