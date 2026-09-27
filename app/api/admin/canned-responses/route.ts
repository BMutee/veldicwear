import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-guard-api";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 5000;

/**
 * Saved replies for the composer.
 *
 * Repeat support questions ("here's your tracking number", "we're checking with
 * the warehouse") shouldn't be retyped, and a canned answer keeps them worded
 * consistently.
 */
export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const responses = await prisma.cannedResponse.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(responses);
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const payload = await request.json().catch(() => ({}));
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!title || !body) {
    return NextResponse.json(
      { error: "A saved reply needs both a name and a message." },
      { status: 400 },
    );
  }

  const response = await prisma.cannedResponse.create({
    data: {
      title: title.slice(0, MAX_TITLE_LENGTH),
      body: body.slice(0, MAX_BODY_LENGTH),
    },
  });

  return NextResponse.json({ response }, { status: 201 });
}