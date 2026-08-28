import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export const runtime = "nodejs";

/** Revoke an extension API key (soft — the row and its audit trail remain). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.extensionApiKey.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await prisma.extensionApiKey.update({ where: { id }, data: { revoked: true } });
  return NextResponse.json({ ok: true, id, revoked: true });
}
