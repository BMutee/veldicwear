import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const faqs = await prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  if (!body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
  }
  const faq = await prisma.fAQ.create({
    data: {
      question: body.question.trim(),
      answer: body.answer.trim(),
      sortOrder: body.sortOrder ?? 0,
      published: body.published ?? true,
    },
  });
  return NextResponse.json(faq, { status: 201 });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  if (!body.id || !body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json({ error: "ID, question, and answer are required." }, { status: 400 });
  }
  const faq = await prisma.fAQ.update({
    where: { id: body.id },
    data: {
      question: body.question.trim(),
      answer: body.answer.trim(),
      sortOrder: body.sortOrder ?? 0,
      published: body.published ?? true,
    },
  });
  return NextResponse.json(faq);
}

export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const body = await request.json();
  await prisma.fAQ.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}