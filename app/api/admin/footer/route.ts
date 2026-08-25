import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import {
  footerContentSchema,
  parseFooterContent,
  serializeFooterContent,
} from "@/lib/footer-section";

const KEY = "footer";
const LABEL = "Footer";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const section = await prisma.siteSection.findUnique({ where: { key: KEY } });

  return NextResponse.json({
    content: parseFooterContent(section?.content),
    updatedAt: section?.updatedAt ?? null,
  });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" && "content" in (body as Record<string, unknown>)
      ? (body as { content: unknown }).content
      : body;

  const parsed = footerContentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
        ),
      },
      { status: 400 }
    );
  }

  const section = await prisma.siteSection.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      label: LABEL,
      content: serializeFooterContent(parsed.data),
      published: true,
    },
    update: {
      label: LABEL,
      content: serializeFooterContent(parsed.data),
    },
  });

  return NextResponse.json({
    content: parseFooterContent(section.content),
    updatedAt: section.updatedAt,
  });
}
