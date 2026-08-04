import { NextResponse } from "next/server";
import { getCJAuthStatus } from "@/lib/cj";

export async function GET() {
  const status = await getCJAuthStatus();
  return NextResponse.json(status);
}
