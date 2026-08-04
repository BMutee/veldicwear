import { NextResponse } from "next/server";
import { cjPatch } from "@/lib/cj";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const response = await cjPatch("setting/account/set", body);
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update CJ account settings." },
      { status: 500 }
    );
  }
}
