import { NextResponse } from "next/server";
import { cjGet } from "@/lib/cj";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pid = url.searchParams.get("pid");

  if (!pid) {
    return NextResponse.json({ error: "Missing CJ product pid." }, { status: 400 });
  }

  try {
    const response = await cjGet("product/sku/getSkuList", {
      pid,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch CJ product variants." },
      { status: 500 }
    );
  }
}
