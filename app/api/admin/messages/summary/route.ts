import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

/**
 * Small, cheap payload for chrome that isn't the inbox itself:
 *
 *   - the unread badge on the admin sidebar's Messages link
 *   - the assignee list for the "assign to teammate" picker
 *
 * Both are needed by the same screens and both are trivial queries. The badge
 * must not depend on the inbox being mounted, since it shows across every admin
 * page. Next.js matches this static segment ahead of the sibling [id], so it is
 * never captured as a thread id.
 */
export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const [unread, assignees] = await Promise.all([
    prisma.messageThread.aggregate({
      _sum: { unreadCount: true },
      where: { status: "open" },
    }),
    prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return NextResponse.json({
    unreadCount: unread._sum.unreadCount ?? 0,
    assignees: assignees.map((a) => ({ id: a.id, name: a.name ?? a.email, email: a.email })),
  });
}
