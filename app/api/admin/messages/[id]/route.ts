import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { markThreadRead, THREAD_INCLUDE } from "@/lib/message-threads";

const STATUSES = new Set(["open", "archived"]);

/**
 * Thread-level state changes for the admin inbox.
 *
 *   PATCH  { markRead? } | { status? } | { assignedToId? }  — partial update
 *   DELETE                                                       — drop a thread
 *
 * Assigning is validated against real admin users rather than trusting a name
 * from the client, so a thread can never be labelled with someone who isn't on
 * the team.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Opening a thread is the read receipt — clear the unread counter and the
  // individual read flags together so the two can't disagree.
  if (body.markRead === true) {
    const existing = await prisma.messageThread.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }
    await prisma.$transaction([
      markThreadRead(id),
      prisma.contactMessage.updateMany({ where: { threadId: id }, data: { read: true } }),
    ]);
  }

  const data: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Status must be open or archived." }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.assignedToId === null) {
    data.assignedToId = null;
    data.assignedToName = null;
  } else if (typeof body.assignedToId === "string" && body.assignedToId.length > 0) {
    const assignee = await prisma.user.findFirst({
      where: { id: body.assignedToId, role: "admin" },
      select: { id: true, name: true, email: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "That teammate is not an admin." }, { status: 400 });
    }
    data.assignedToId = assignee.id;
    data.assignedToName = assignee.name ?? assignee.email;
  }

  let thread = await prisma.messageThread.findUnique({
    where: { id },
    include: THREAD_INCLUDE,
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  if (Object.keys(data).length > 0) {
    thread = await prisma.messageThread.update({
      where: { id },
      data,
      include: THREAD_INCLUDE,
    });
  }

  return NextResponse.json(thread);
}

/** Deleting a thread cascades to its messages, replies and notes. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.messageThread.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }
}
