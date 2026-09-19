import { NextResponse } from "next/server";
import { cjPost } from "@/lib/cj";
import { requireAdminApi } from "@/lib/admin-guard-api";

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const body = await request.json();
    const response = await cjPost("shopping/create-order-v3", body);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create CJ sandbox order v3." },
      { status: 500 }
    );
  }
}