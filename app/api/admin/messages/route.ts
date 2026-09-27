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
    // `repliedAt` drives the "Replied" badge; `replies` is the thread the detail
    // pane shows under the original message. Replies are capped per message so a
    // long thread can't balloon the list response.
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        take: 20,
        select: { id: true, body: true, adminName: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(messages);
}
