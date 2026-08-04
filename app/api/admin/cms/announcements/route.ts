import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const announcement = await prisma.announcement.create({
    data: {
      message: body.message.trim(),
      link: body.link?.trim() || null,
      style: body.style || "info",
      active: body.active ?? false,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(announcement, { status: 201 });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  if (!body.id || !body.message?.trim()) {
    return NextResponse.json({ error: "ID and message are required." }, { status: 400 });
  }
  const announcement = await prisma.announcement.update({
    where: { id: body.id },
    data: {
      message: body.message.trim(),
      link: body.link?.trim() || null,
      style: body.style || "info",
      active: body.active ?? false,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(announcement);
}

export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  await prisma.announcement.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}