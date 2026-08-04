import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pid = url.searchParams.get("pid");

  if (!pid) {
    return NextResponse.json({ error: "Missing CJ product pid." }, { status: 400 });
  }

  try {
    const response = await cjGet("product/query", {
      pid,
      features: JSON.stringify(["enable_description"]),
    });
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch CJ product details." },
      { status: 500 }
    );
  }
}
