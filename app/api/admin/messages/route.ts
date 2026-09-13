import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  const messages = await prisma.contactMessage.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(messages);
}
