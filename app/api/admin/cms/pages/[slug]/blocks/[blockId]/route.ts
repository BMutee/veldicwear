import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { blockOwnerWhere } from "@/lib/block-owner";
export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string; blockId: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const { slug, blockId } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug }, select: { id: true } });
  if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  await prisma.block.deleteMany({ where: { AND: [{ id: blockId }, blockOwnerWhere({ pageId: page.id })] } });
  return NextResponse.json({ ok: true });
}
