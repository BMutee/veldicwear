import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { blockInputSchema, blockTypes, parseStoredBlock, sanitizeBlockContent, reorderSchema, defaultBlockContent, BLOCK_DEFAULT_STYLES, HERO_BLOCK_DEFAULT_STYLES, stylesForType } from "@/lib/block-section";
import { blockOwnerData, blockOwnerWhere, findBlocksForOwner } from "@/lib/block-owner";

async function getPage(slug: string) {
  return prisma.cmsPage.findUnique({ where: { slug }, select: { id: true } });
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const page = await getPage((await params).slug); if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  const owner = { pageId: page.id } as const;
  const blocks = await findBlocksForOwner(owner);
  return NextResponse.json(blocks.map((block) => ({ ...block, ...parseStoredBlock(block.type, block.content, block.styles) })));
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const page = await getPage((await params).slug); if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  const owner = { pageId: page.id } as const;
  const body = await request.json();
  const type = body?.type;
  if (!blockTypes.includes(type)) return NextResponse.json({ error: "Invalid block type." }, { status: 400 });
  try {
    const content = sanitizeBlockContent(type, body.content ?? defaultBlockContent(type));
    const styles = stylesForType(type).parse(body.styles ?? (type === "HERO" ? HERO_BLOCK_DEFAULT_STYLES : BLOCK_DEFAULT_STYLES));
    const last = await prisma.block.findFirst({ where: blockOwnerWhere(owner), orderBy: { order: "desc" }, select: { order: true } });
    const block = await prisma.block.create({ data: { ...blockOwnerData(owner), type, order: (last?.order ?? -1) + 1, content, styles } });
    return NextResponse.json(block, { status: 201 });
  } catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : "Invalid block content." }, { status: 400 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const page = await getPage((await params).slug); if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  const owner = { pageId: page.id } as const;
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Block id is required." }, { status: 400 });
  try {
    const parsed = blockInputSchema.parse(body);
    const content = sanitizeBlockContent(parsed.type, parsed.content);
    const styles = stylesForType(parsed.type).parse(parsed.styles);
    const existing = await prisma.block.findFirst({ where: { AND: [{ id: body.id }, blockOwnerWhere(owner)] }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Block not found." }, { status: 404 });
    const block = await prisma.block.update({ where: { id: existing.id }, data: { content, styles } });
    return NextResponse.json(block);
  } catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : "Invalid block." }, { status: 400 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi(); if (error) return error;
  const page = await getPage((await params).slug); if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  const owner = { pageId: page.id } as const;
  const parsed = reorderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid block order." }, { status: 400 });
  const blocks = await prisma.block.findMany({ where: blockOwnerWhere(owner), select: { id: true } });
  if (blocks.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !blocks.some((block) => block.id === id))) return NextResponse.json({ error: "Order must include every page block exactly once." }, { status: 400 });
  await prisma.$transaction(parsed.data.ids.map((id, order) => prisma.block.update({ where: { id }, data: { order: order + 1 } })));
  return NextResponse.json({ ok: true });
}
