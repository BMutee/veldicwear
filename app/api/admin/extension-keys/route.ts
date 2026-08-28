import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";
import { generateExtensionApiKey } from "@/lib/extension-api-keys";

export const runtime = "nodejs";

/** List all extension API keys (never includes the raw key). */
export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const keys = await prisma.extensionApiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true, revoked: true },
  });
  return NextResponse.json({ keys });
}

/** Generate a new extension API key. The raw key is returned ONCE. */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  let name: string | undefined;
  try {
    const body = (await request.json()) as { name?: string };
    name = typeof body?.name === "string" ? body.name.slice(0, 100) : undefined;
  } catch {
    // empty body is fine — name is optional
  }

  const generated = await generateExtensionApiKey(name);
  return NextResponse.json(
    {
      key: generated.key,
      id: generated.id,
      name: generated.name,
      createdAt: generated.createdAt,
      warning:
        "Copy this key now — it is shown only once and cannot be retrieved again.",
    },
    { status: 201 }
  );
}
