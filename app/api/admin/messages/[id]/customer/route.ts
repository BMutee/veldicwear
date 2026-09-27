import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

/**
 * What this customer has bought.
 *
 * Shown inside the conversation so support knows what the person is asking
 * about before answering. Keyed off the thread's own email — the admin never
 * supplies the address, so this can't be pointed at someone else's orders.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: { id },
    select: { email: true, customerName: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const orders = await prisma.order.findMany({
    where: { email: { equals: thread.email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      deliveredAt: true,
      _count: { select: { items: true } },
    },
  });

  // Lifetime value across every order, not just the ten listed above.
  const spend = await prisma.order.aggregate({
    _sum: { total: true },
    _count: true,
    where: { email: { equals: thread.email, mode: "insensitive" } },
  });

  return NextResponse.json({
    email: thread.email,
    orders,
    totalOrders: spend._count,
    lifetimeValue: spend._sum.total ?? 0,
  });
}
