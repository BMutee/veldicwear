import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const pages = await prisma.cmsPage.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(pages);
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const errs: string[] = [];

  if (!body.title?.trim()) errs.push("Title is required.");
  if (!body.slug?.trim()) errs.push("Slug is required.");
  else if (!/^[a-z0-9-]+$/.test(body.slug)) errs.push("Slug: only lowercase letters, numbers, hyphens.");
  if (!body.content?.trim()) errs.push("Content is required.");

  if (errs.length) return NextResponse.json({ error: "Validation failed", details: errs }, { status: 400 });

  const existing = await prisma.cmsPage.findUnique({ where: { slug: body.slug.trim() } });
  if (existing) return NextResponse.json({ error: `Slug "${body.slug}" already in use.` }, { status: 409 });

  const page = await prisma.cmsPage.create({
    data: {
      slug: body.slug.trim(),
      title: body.title.trim(),
      content: sanitizeHtml(body.content),
      seoTitle: body.seoTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      published: body.published ?? false,
    },
  });

  return NextResponse.json(page, { status: 201 });
}