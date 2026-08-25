import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { blockOwnerWhere } from "@/lib/block-owner";
export async function DELETE(_: Request, { params }: { params: Promise<{ key: string; blockId: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const { key, blockId } = await params;
  const section = await prisma.siteSection.findUnique({ where: { key }, select: { key: true } });
  if (!section) return NextResponse.json({ error: "Section not found." }, { status: 404 });
  await prisma.block.deleteMany({ where: { AND: [{ id: blockId }, blockOwnerWhere({ sectionKey: key })] } });
  return NextResponse.json({ ok: true });
}
