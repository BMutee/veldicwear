import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 5000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const payload = await request.json().catch(() => ({}));

  const data: { title?: string; body?: string } = {};
  if (typeof payload?.title === "string" && payload.title.trim()) {
    data.title = payload.title.trim().slice(0, MAX_TITLE_LENGTH);
  }
  if (typeof payload?.body === "string" && payload.body.trim()) {
    data.body = payload.body.trim().slice(0, MAX_BODY_LENGTH);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const response = await prisma.cannedResponse.update({ where: { id }, data });
    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Saved reply not found." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.cannedResponse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Saved reply not found." }, { status: 404 });
  }
}
