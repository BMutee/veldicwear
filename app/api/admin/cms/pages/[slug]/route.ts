import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { parseCtaFields, sanitizeHtml } from "@/lib/sanitize";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { slug } = await params;
  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { slug } = await params;
  const body = await request.json();
  const errs: string[] = [];

  if (!body.title?.trim()) errs.push("Title is required.");
  if (!body.content?.trim()) errs.push("Content is required.");
  const cta = parseCtaFields(body.ctaLabel, body.ctaUrl);
  if (cta.error) errs.push(cta.error);

  const newSlug = body.slug?.trim() || slug;
  if (!/^[a-z0-9-]+$/.test(newSlug)) errs.push("Slug: only lowercase letters, numbers, hyphens.");

  if (errs.length) return NextResponse.json({ error: "Validation failed", details: errs }, { status: 400 });

  if (newSlug !== slug) {
    const existing = await prisma.cmsPage.findUnique({ where: { slug: newSlug } });
    if (existing) return NextResponse.json({ error: `Slug "${newSlug}" already in use.` }, { status: 409 });
  }

  const page = await prisma.cmsPage.update({
    where: { slug },
    data: {
      slug: newSlug,
      title: body.title.trim(),
      content: sanitizeHtml(body.content),
      ctaLabel: cta.ctaLabel,
      ctaUrl: cta.ctaUrl,
      seoTitle: body.seoTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      published: body.published ?? false,
    },
  });

  return NextResponse.json(page);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { slug } = await params;
  await prisma.cmsPage.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}