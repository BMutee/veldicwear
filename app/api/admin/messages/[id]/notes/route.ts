import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

const MAX_NOTE_LENGTH = 5000;

/**
 * Internal notes on a thread — never emailed to the customer.
 *
 * Notes exist so the next person to open a conversation knows what was already
 * tried ("asked for photos, waiting on them") without re-asking the customer.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!body) {
    return NextResponse.json({ error: "Write a note before saving." }, { status: 400 });
  }
  if (body.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      { error: `Notes are limited to ${MAX_NOTE_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const note = await prisma.messageNote.create({
    data: { threadId: id, body, adminId: user.id, adminName: user.name ?? null },
  });

  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const noteId = typeof payload?.noteId === "string" ? payload.noteId : null;
  if (!noteId) {
    return NextResponse.json({ error: "Which note?" }, { status: 400 });
  }

  try {
    // Scoped to the thread so a note id from another thread can't be deleted
    // through this route.
    await prisma.messageNote.deleteMany({ where: { id: noteId, threadId: id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }
}
