import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const homepage = await prisma.homepage.findUnique({ where: { id: "homepage" } });

  return NextResponse.json(homepage || {});
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();

  // ── Server-side validation ──
  const errors: string[] = [];

  if (!body.heroTitle || typeof body.heroTitle !== "string" || body.heroTitle.trim().length === 0) {
    errors.push("Hero title is required.");
  }
  if (!body.heroSubtitle || typeof body.heroSubtitle !== "string" || body.heroSubtitle.trim().length === 0) {
    errors.push("Hero subtitle is required.");
  }
  if (!body.heroImage || typeof body.heroImage !== "string" || body.heroImage.trim().length === 0) {
    errors.push("Hero image URL is required.");
  }
  if (!body.heroButtonText || typeof body.heroButtonText !== "string" || body.heroButtonText.trim().length === 0) {
    errors.push("Hero button text is required.");
  }
  if (!body.heroButtonLink || typeof body.heroButtonLink !== "string" || body.heroButtonLink.trim().length === 0) {
    errors.push("Hero button link is required.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const homepage = await prisma.homepage.upsert({
    where: { id: "homepage" },
    create: {
      id: "homepage",
      heroTitle: body.heroTitle.trim(),
      heroSubtitle: body.heroSubtitle.trim(),
      heroTagline: body.heroTagline?.trim() || "Fall / Winter 2026",
      heroImage: body.heroImage.trim(),
      heroButtonText: body.heroButtonText.trim(),
      heroButtonLink: body.heroButtonLink.trim(),
      trustProductCount: body.trustProductCount?.trim() || "200+",
      trustMemberCount: body.trustMemberCount?.trim() || "50K+",
      trustRating: body.trustRating?.trim() || "4.9",
      featuredSectionTitle: body.featuredSectionTitle?.trim() || "New Arrivals",
      featuredSectionSubtitle: body.featuredSectionSubtitle?.trim() || "The latest drops engineered for the relentless.",
    },
    update: {
      heroTitle: body.heroTitle.trim(),
      heroSubtitle: body.heroSubtitle.trim(),
      heroTagline: body.heroTagline?.trim() || "Fall / Winter 2026",
      heroImage: body.heroImage.trim(),
      heroButtonText: body.heroButtonText.trim(),
      heroButtonLink: body.heroButtonLink.trim(),
      trustProductCount: body.trustProductCount?.trim() || "200+",
      trustMemberCount: body.trustMemberCount?.trim() || "50K+",
      trustRating: body.trustRating?.trim() || "4.9",
      featuredSectionTitle: body.featuredSectionTitle?.trim() || "New Arrivals",
      featuredSectionSubtitle: body.featuredSectionSubtitle?.trim() || "The latest drops engineered for the relentless.",
    },
  });

  return NextResponse.json(homepage);
}